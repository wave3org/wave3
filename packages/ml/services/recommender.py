import os
from collections import defaultdict

import numpy as np
import requests
import scipy.sparse as sparse
from implicit.als import AlternatingLeastSquares
import faiss
from sklearn.preprocessing import normalize


CONTENT_WEIGHT = 0.3


class RecommendationModel:
    """Trained ALS factors + FAISS indexes for nearest-neighbor song lookups.
    model_data: dict with user_factors (ndarray), item_factors (ndarray),
      users (list of wallet addresses), songs (list of song IDs).
    """
    def __init__(self, model_data):
        self.user_factors = model_data["user_factors"]
        self.item_factors = model_data["item_factors"]
        self.users = model_data["users"]
        self.songs = model_data["songs"]
        
        song_factors_normalized = normalize(self.item_factors.astype(np.float32), norm='l2')
        user_factors_normalized = normalize(self.user_factors.astype(np.float32), norm='l2')
        
        # inner-product indexes for cosine similarity (vectors are L2-normalized)
        self.song_index = faiss.IndexFlatIP(song_factors_normalized.shape[1])
        self.song_index.add(song_factors_normalized)
        
        self.user_index = faiss.IndexFlatIP(user_factors_normalized.shape[1])
        self.user_index.add(user_factors_normalized)
    
    def recommend_songs_to_user(self, user_id: str, topn: int = 5) -> list[str]:
        """Returns song IDs for that user, or [] if unknown.
        user_id: wallet address (case-insensitive), topn: how many.
        """
        user_id_lower = user_id.lower()
        try:
            user_idx = self.users.index(user_id_lower)
        except ValueError:
            return []
        
        user_factor = normalize(self.user_factors[user_idx:user_idx+1].astype(np.float32), norm='l2')
        distances, indices = self.song_index.search(user_factor, min(topn, len(self.songs)))
        
        results = []
        for i in indices[0]:
            i = int(i)
            if 0 <= i < len(self.songs):
                results.append(self.songs[i])
        return results
    
    def recommend_similar_songs(self, song_id: str, topn: int = 5) -> list[str]:
        """Returns similar song IDs (excluding the input), or [] if unknown.
        song_id: the song to find neighbors for, topn: how many.
        """
        try:
            song_idx = self.songs.index(song_id)
        except ValueError:
            return []
        
        song_factor = normalize(self.item_factors[song_idx:song_idx+1].astype(np.float32), norm='l2')
        distances, indices = self.song_index.search(song_factor, min(topn + 1, len(self.songs)))
        
        results = []
        for i in indices[0]:
            i = int(i)
            if 0 <= i < len(self.songs) and i != song_idx:
                results.append(self.songs[i])
        return results[:topn]


def fetch_training_data() -> list[dict]:
    """Pulls play events with song metadata (genre, year) from Ponder.
    Returns list of dicts with songId, listener, genre, year.
    """
    ponder_url = os.getenv("PONDER_URL", "http://localhost:42069")
    response = requests.get(f"{ponder_url}/training-data", timeout=30)
    response.raise_for_status()
    return response.json()["items"]


def build_content_features(songs: list[str], metadata: dict[str, dict]) -> np.ndarray:
    """Builds a content feature matrix for the given songs.
    One-hot encodes genres and normalizes year to [0, 1].
    Args: songs - sorted list of song IDs,
          metadata - {songId: {"genre", "year"}} from Ponder.
    Returns ndarray of shape (len(songs), n_genres + 1).
    """
    genres = set()
    years = []
    for song in songs:
        meta = metadata.get(song)
        if not meta:
            continue
        if meta["genre"]:
            genres.add(meta["genre"])
        if meta["year"] > 0:
            years.append(meta["year"])

    genre_list = sorted(genres)
    genre_idx = {g: i for i, g in enumerate(genre_list)}
    n_genres = len(genre_list)

    min_year = min(years) if years else 1900
    max_year = max(years) if years else 2025
    year_range = max_year - min_year if max_year != min_year else 1

    features = np.zeros((len(songs), n_genres + 1), dtype=np.float32)
    for i, song in enumerate(songs):
        meta = metadata.get(song)
        if not meta:
            continue
        if meta["genre"] in genre_idx:
            features[i, genre_idx[meta["genre"]]] = 1.0
        if meta["year"] > 0:
            features[i, n_genres] = (meta["year"] - min_year) / year_range

    return features


def train() -> dict:
    """Fetches plays + metadata from Ponder, trains ALS, builds hybrid factors.
    Concatenates content features (genre one-hot + normalized year) onto the
    ALS latent factors so FAISS searches in the augmented space.
    Returns dict with user_factors, item_factors, users, songs.
    """
    training_data = fetch_training_data()

    play_counts: dict[tuple[str, str], int] = defaultdict(int)
    song_metadata: dict[str, dict] = {}
    users: set[str] = set()
    songs: set[str] = set()
    for item in training_data:
        song_id = item["songId"]
        user = item["listener"].lower()
        play_counts[(user, song_id)] += 1
        users.add(user)
        songs.add(song_id)
        song_metadata[song_id] = {"genre": item["genre"], "year": item["year"]}

    user_idx = {u: i for i, u in enumerate(sorted(users))}
    song_idx = {s: i for i, s in enumerate(sorted(songs))}

    rows, cols, data = [], [], []
    for (user, song), count in play_counts.items():
        rows.append(user_idx[user])
        cols.append(song_idx[song])
        data.append(count)

    user_item = sparse.csr_matrix((data, (rows, cols)), shape=(len(users), len(songs)))

    model = AlternatingLeastSquares(factors=10, iterations=10)
    model.fit(user_item)

    sorted_songs = sorted(songs)
    content_features = build_content_features(sorted_songs, song_metadata)
    weighted_content = content_features * CONTENT_WEIGHT

    augmented_items = np.hstack([model.item_factors, weighted_content])

    # user content profile = weighted average of content features of played songs
    user_content = np.zeros((len(users), content_features.shape[1]), dtype=np.float32)
    for (user, song), count in play_counts.items():
        user_content[user_idx[user]] += content_features[song_idx[song]] * count
    row_sums = user_content.sum(axis=1, keepdims=True)
    row_sums[row_sums == 0] = 1
    user_content = (user_content / row_sums) * CONTENT_WEIGHT

    augmented_users = np.hstack([model.user_factors, user_content])

    return {
        "user_factors": augmented_users,
        "item_factors": augmented_items,
        "users": sorted(users),
        "songs": sorted_songs,
    }

import os
from collections import defaultdict

import numpy as np
import requests
import scipy.sparse as sparse
from implicit.als import AlternatingLeastSquares
import faiss
from sklearn.preprocessing import normalize


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


def fetch_plays() -> list[list[str]]:
    """Pulls play events from the Ponder indexer.
    Returns list of [songId, listener] pairs.
    """
    ponder_url = os.getenv("PONDER_URL", "http://localhost:42069")
    response = requests.get(f"{ponder_url}/song-plays", params={"limit": 10000}, timeout=30)
    response.raise_for_status()
    items = response.json()["items"]

    plays = []
    for item in items:
        plays.append([item["songId"], item["listener"]])
    return plays


def train() -> dict:
    """Fetches plays from Ponder, builds user-item matrix, trains ALS.
    Returns dict with user_factors, item_factors, users, songs — ready for RecommendationModel().
    """
    plays = fetch_plays()

    play_counts: dict[tuple[str, str], int] = defaultdict(int)
    users: set[str] = set()
    songs: set[str] = set()
    for song_id, listener in plays:
        user = listener.lower()
        play_counts[(user, song_id)] += 1
        users.add(user)
        songs.add(song_id)

    user_idx = {u: i for i, u in enumerate(sorted(users))}
    song_idx = {s: i for i, s in enumerate(sorted(songs))}

    rows, cols, data = [], [], []
    for (user, song), count in play_counts.items():
        rows.append(user_idx[user])
        cols.append(song_idx[song])
        data.append(count)

    user_item = sparse.csr_matrix((data, (rows, cols)), shape=(len(users), len(songs)))

    # implicit expects item-user in CSR format
    model = AlternatingLeastSquares(factors=10, iterations=10)
    model.fit(user_item.T.tocsr())

    model_data = {
        "user_factors": model.user_factors,
        "item_factors": model.item_factors,
        "users": sorted(users),
        "songs": sorted(songs),
    }
    return model_data

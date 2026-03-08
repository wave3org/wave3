import io
import json
import logging
import os
from collections import defaultdict

import numpy as np
import requests
import scipy.sparse as sparse
from implicit.als import AlternatingLeastSquares

logger = logging.getLogger(__name__)


def fetch_plays() -> list[list[str]]:
    ponder_url = os.getenv("PONDER_URL", "http://localhost:42069")
    logger.info("Fetching song plays from %s", ponder_url)
    response = requests.get(f"{ponder_url}/song-plays", params={"limit": 10000}, timeout=30)
    response.raise_for_status()
    items = response.json()["items"]
    logger.info("Fetched %d play events", len(items))
    # Convert to [[songId, listener], ...] format
    plays = [[item["songId"], item["listener"]] for item in items]
    return plays


def upload_model(model_bytes: bytes) -> str:
    storage_url = os.getenv("STORAGE_URL", "http://localhost:3001")
    size_kb = len(model_bytes) / 1024
    logger.info("Uploading model to %s (%.1f KB)", storage_url, size_kb)
    response = requests.post(
        f"{storage_url}/upload",
        files={"file": ("model.npz", model_bytes, "application/octet-stream")},
        timeout=60,
    )
    response.raise_for_status()
    cid = response.json()["cid"]
    logger.info("Model uploaded successfully — CID: %s", cid)
    return cid


def train() -> str:
    logger.info("Starting model training pipeline")
    plays = fetch_plays()

    play_counts: dict[tuple[str, str], int] = defaultdict(int)
    users: set[str] = set()
    songs: set[str] = set()
    for song_id, listener in plays:
        user = listener.lower()
        play_counts[(user, song_id)] += 1
        users.add(user)
        songs.add(song_id)

    logger.info("Dataset: %d users, %d songs, %d unique (user, song) pairs", len(users), len(songs), len(play_counts))

    user_idx = {u: i for i, u in enumerate(sorted(users))}
    song_idx = {s: i for i, s in enumerate(sorted(songs))}

    rows, cols, data = [], [], []
    for (user, song), count in play_counts.items():
        rows.append(user_idx[user])
        cols.append(song_idx[song])
        data.append(count)

    user_item = sparse.csr_matrix((data, (rows, cols)), shape=(len(users), len(songs)))
    logger.info("Sparse user-item matrix: shape=%s, nnz=%d", user_item.shape, user_item.nnz)

    logger.info("Fitting ALS model (factors=10, iterations=10)")
    model = AlternatingLeastSquares(factors=10, iterations=10)
    model.fit(user_item.T)
    logger.info("ALS model trained")

    buf = io.BytesIO()
    np.savez(
        buf,
        user_factors=model.user_factors,
        item_factors=model.item_factors,
        users=np.array(sorted(users)),
        songs=np.array(sorted(songs)),
    )
    model_bytes = buf.getvalue()
    return upload_model(model_bytes)

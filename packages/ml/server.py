import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import requests

app = FastAPI()

recommendation_model = None
MAX_RECOMMENDATIONS = 50

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    """Health check.
    Returns: dict - {"status": "ok"}
    """
    return {"status": "ok"}

@app.get("/ping")
def ping():
    return {"status": "ok", "service": "ml", "message": "Service is awake"}

@app.post("/train")
def train_model():
    """Fetches play history from Ponder and trains the ALS model.
    Must be called before any /recommend endpoints work.
    Returns: dict - {"status": "success", "message": "..."} or error
    """
    global recommendation_model
    try:
        from services.recommender import train, RecommendationModel
        model_data = train()
        recommendation_model = RecommendationModel(model_data)
        return {
            "status": "success",
            "message": "Model trained and indexed",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/recommend/song/{song_id}")
def recommend_by_song(song_id: str, topn: int = 5):
    """Returns songs similar to the given song (content-based via FAISS).
    Args: song_id (str) - the song to find neighbors for
          topn (int) - how many recommendations (default 5, max 50)
    Returns: dict - {"song": song_id, "recommendations": [song_ids]}
    """
    if recommendation_model is None:
        raise HTTPException(status_code=404, detail="Model not trained yet")
    
    topn = min(topn, MAX_RECOMMENDATIONS)
    recommendations = recommendation_model.recommend_similar_songs(song_id, topn)
    if not recommendations and song_id not in recommendation_model.songs:
        raise HTTPException(status_code=404, detail=f"Song {song_id} not found")
    
    return {
        "song": song_id,
        "recommendations": recommendations
    }

@app.get("/recommend/user/{user_id}")
def recommend_by_user(user_id: str, topn: int = 5):
    """Returns personalized song recommendations for a user (wallet address)
    based on collaborative filtering. Returns 404 if user has no play history.
    Args: user_id (str) - wallet address
          topn (int) - how many recommendations (default 5, max 50)
    Returns: dict - {"user": user_id, "recommendations": [song_ids]}
    """
    if recommendation_model is None:
        raise HTTPException(status_code=404, detail="Model not trained yet")
    topn = min(topn, MAX_RECOMMENDATIONS)
    
    recommendations = recommendation_model.recommend_songs_to_user(user_id, topn)
    if not recommendations and user_id.lower() not in recommendation_model.users:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")
    
    return {
        "user": user_id,
        "recommendations": recommendations
    }

@app.get("/debug/songs")
def debug_songs():
    """Debug: list all songs the model knows about.
    Returns: dict - {"songs": [song_ids]}
    """
    if recommendation_model is None:
        return {"songs": []}
    return {"songs": recommendation_model.songs}

@app.get("/debug/users")
def debug_users():
    """Debug: list all users (wallets) the model knows about.
    Returns: dict - {"users": [wallet_addresses]}
    """
    if recommendation_model is None:
        return {"users": []}
    return {"users": recommendation_model.users}

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)


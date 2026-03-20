import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import requests

app = FastAPI()

recommendation_model = None

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok"}

@app.post("/train")
def train_model():
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
    if recommendation_model is None:
        raise HTTPException(status_code=404, detail="Model not trained yet")
    
    recommendations = recommendation_model.recommend_similar_songs(song_id, topn)
    if not recommendations and song_id not in recommendation_model.songs:
        raise HTTPException(status_code=404, detail=f"Song {song_id} not found")
    
    return {
        "song": song_id,
        "recommendations": recommendations
    }

@app.get("/recommend/user/{user_id}")
def recommend_by_user(user_id: str, topn: int = 5):
    if recommendation_model is None:
        raise HTTPException(status_code=404, detail="Model not trained yet")
    
    recommendations = recommendation_model.recommend_songs_to_user(user_id, topn)
    if not recommendations and user_id.lower() not in recommendation_model.users:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")
    
    return {
        "user": user_id,
        "recommendations": recommendations
    }

@app.get("/debug/songs")
def debug_songs():
    if recommendation_model is None:
        return {"songs": []}
    return {"songs": recommendation_model.songs}

@app.get("/debug/users")
def debug_users():
    if recommendation_model is None:
        return {"users": []}
    return {"users": recommendation_model.users}

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)


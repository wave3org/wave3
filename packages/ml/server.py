import time
import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import requests

app = FastAPI(title="ML Service")

# Store latest model CID in memory
latest_model_cid = None

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ML Service is running"}

@app.get("/ping")
def ping():
    return {"status": "ok", "service": "ml", "message": "Service is awake"}

@app.post("/train")
def train_model():
    """Train the recommender model and upload to IPFS"""
    global latest_model_cid
    try:
        from services.recommender import train
        model_cid = train()
        latest_model_cid = model_cid
        return {
            "status": "success",
            "message": "Model trained and uploaded",
            "cid": model_cid,
            "ipfs_url": f"https://ipfs.io/ipfs/{model_cid}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/plays")
def get_plays():
    """Fetch all song plays from Ponder"""
    try:
        ponder_url = os.getenv("PONDER_URL", "http://localhost:42069")
        response = requests.get(f"{ponder_url}/song-plays", params={"limit": 10000}, timeout=30)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/model/cid")
def get_model_cid():
    """Get the latest model CID"""
    try:
        if not latest_model_cid:
            raise HTTPException(status_code=404, detail="No model CID found")
        return {
            "cid": latest_model_cid,
            "ipfs_url": f"https://ipfs.io/ipfs/{latest_model_cid}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # Run FastAPI server
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)


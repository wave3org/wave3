import time
import os
import json
from fastapi import FastAPI, HTTPException
import uvicorn
import requests

app = FastAPI(title="ML Service")

def query_ponder_graphql(query: str) -> dict:
    """Query Ponder GraphQL endpoint"""
    ponder_url = os.getenv('PONDER_URL', 'http://ponder:42069')
    
    try:
        response = requests.post(
            f"{ponder_url}/graphql",
            json={"query": query},
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()
        
        result = response.json()
        
        if "errors" in result:
            raise Exception(f"GraphQL errors: {result['errors']}")
        
        return result.get("data", {})
        
    except Exception as e:
        print(f"✗ Error querying Ponder: {e}")
        raise

def save_to_ipfs(data: dict) -> str:
    """Guardar datos en IPFS usando el servicio storage"""
    storage_url = os.getenv('STORAGE_URL', 'http://storage:3001')
    
    try:
        # Convertir dict a JSON y crear un archivo en memoria
        json_data = json.dumps(data).encode('utf-8')
        
        files = {
            'file': ('data.json', json_data, 'application/json')
        }
        
        response = requests.post(f"{storage_url}/upload", files=files)
        response.raise_for_status()
        
        result = response.json()
        ipfs_hash = result['cid']
        
        print(f"✓ Guardado en IPFS: {ipfs_hash}")
        return ipfs_hash
        
    except Exception as e:
        print(f"✗ Error al guardar en IPFS: {e}")
        raise

@app.get("/")
def read_root():
    return {"status": "ML Service is running"}

@app.get("/counter")
def get_counter():
    """Obtener el último valor del contador desde Ponder y guardarlo en IPFS"""
    try:
        # Query GraphQL para obtener el último evento del contador
        query = """
        {
          counterEvents(orderBy: "timestamp", orderDirection: "desc", limit: 1) {
            items {
              id
              value
              timestamp
              blockNumber
              transactionHash
            }
          }
        }
        """
        
        result = query_ponder_graphql(query)
        
        counter_events = result.get("counterEvents", {}).get("items", [])
        
        if not counter_events:
            return {
                "message": "No counter events found",
                "value": 0
            }
        
        latest_event = counter_events[0]
        
        data = {
            "counter_value": int(latest_event["value"]),
            "timestamp": latest_event["timestamp"],
            "block_number": int(latest_event["blockNumber"]),
            "transaction_hash": latest_event["transactionHash"]
        }
        
        # Guardar en IPFS
        ipfs_hash = save_to_ipfs(data)
        
        return {
            **data,
            "ipfs_hash": ipfs_hash,
            "ipfs_url": f"https://ipfs.io/ipfs/{ipfs_hash}"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # Run FastAPI server
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)


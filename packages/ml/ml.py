import psycopg2
from psycopg2.extensions import connection, cursor as Cursor
import time
import os
import json
from fastapi import FastAPI, HTTPException
import uvicorn
import requests

app = FastAPI(title="ML Service")

def connect_to_db() -> connection:
    """Connect to PostgreSQL database with retry logic"""
    max_retries = 5
    retry_delay = 2
    
    database_url = os.getenv(
        'DATABASE_URL',
        'postgresql://wave3:wave3@postgres:5432/wave3'
    )
    
    for attempt in range(max_retries):
        try:
            conn = psycopg2.connect(database_url)
            print(f"✓ Conectado a la base de datos")
            return conn
        except psycopg2.OperationalError as e:
            if attempt < max_retries - 1:
                print(f"Intento {attempt + 1}/{max_retries} fallido. Reintentando en {retry_delay}s...")
                time.sleep(retry_delay)
            else:
                print(f"✗ Error al conectar después de {max_retries} intentos: {e}")
                raise
    
    # Este punto nunca debería alcanzarse, pero satisface el type checker
    raise psycopg2.OperationalError("No se pudo conectar a la base de datos")

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

@app.get("/ml")
def get_table_count():
    """Obtener el conteo de registros de la primera tabla disponible"""
    try:
        conn = connect_to_db()
        cursor = conn.cursor()
        
        # Obtener lista de tablas
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
            LIMIT 1
        """)
        
        result = cursor.fetchone()
        
        if result:
            table_name = result[0]
            
            # Hacer count de la primera tabla encontrada
            cursor.execute(f"SELECT COUNT(1) FROM {table_name}")
            count_result = cursor.fetchone()
            
            cursor.close()
            conn.close()
            
            if count_result:
                count = count_result[0]
                data = {
                    "table": table_name,
                    "count": count
                }
                
                # Guardar en IPFS
                ipfs_hash = save_to_ipfs(data)
                
                return {
                    **data,
                    "ipfs_hash": ipfs_hash,
                    "ipfs_url": f"https://ipfs.io/ipfs/{ipfs_hash}"
                }
        
        cursor.close()
        conn.close()
        return {"message": "No se encontraron tablas en la base de datos"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # Run FastAPI server
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)


import psycopg2
from psycopg2.extensions import connection, cursor as Cursor
import time
import os
from fastapi import FastAPI, HTTPException
import uvicorn

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
                return {
                    "table": table_name,
                    "count": count
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


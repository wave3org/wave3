import psycopg2
from psycopg2.extensions import connection, cursor as Cursor
import time
import os

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

def main():
    print("Iniciando servicio ML...")
    
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
        print(f"\nConsultando tabla: {table_name}")
        
        # Hacer count de la primera tabla encontrada
        cursor.execute(f"SELECT COUNT(1) FROM {table_name}")
        count_result = cursor.fetchone()
        
        if count_result:
            count = count_result[0]
            print(f"Cantidad de registros en '{table_name}': {count}")
    else:
        print("No se encontraron tablas en la base de datos")
    
    cursor.close()
    conn.close()
    print("\n✓ Consulta completada")

if __name__ == "__main__":
    main()

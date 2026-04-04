# Seed

Carga música del [Free Music Archive](https://github.com/mdeff/fma) a la chain y al storage.

```mermaid
graph LR
    FMA[FMA dataset] -->|covers + mp3s| ST[Storage]
    ST -->|CIDs| script[seed_database.py]
    script -->|txs| chain[Blockchain]
    chain -->|eventos| ponder[Ponder]
    ponder -->|indexa| db[Postgres / Supabase]
```

## Pasos

### 1. Descargar el dataset

```bash
make download-fma
```

~7.5 GB (8000 MP3s + metadata) en `downloads/`.

### 2. Seedear

**Local** (requiere `yarn chain` + `yarn deploy` + `docker compose up -d`):

```bash
make seed
```

**Sepolia** (requiere `make deploy-sepolia`):

```bash
make seed-sepolia DEPLOYER_PRIVATE_KEY=0x...
```

El script sube covers y MP3s en paralelo (async) y luego manda las transacciones.

```mermaid
sequenceDiagram
    participant S as Script
    participant ST as Storage
    participant C as Chain

    S->>ST: Subir covers + mp3s (paralelo)
    ST-->>S: CIDs
    loop álbum
        S->>C: addAlbum(title, artist, imageCid)
        C-->>S: albumId
        loop canción
            S->>C: addSong(title, audioCid, albumId, ...)
        end
    end
```

## Resetear

Si cambiaron los contratos:

**Local:**
```bash
make clean-contracts
yarn deploy
make seed
```

**Supabase:**
```bash
make reset-db-supabase DB_URL="postgresql://user:pass@host:5432/postgres"
make deploy-sepolia
# arrancar Ponder (recrea tablas)
make seed-sepolia DEPLOYER_PRIVATE_KEY=0x...
```

## Variables

| Variable | Default | Uso |
|---|---|---|
| `NETWORK` | `localhost` | `localhost` o `sepolia` |
| `DEPLOYER_PRIVATE_KEY` | — | Obligatoria para Sepolia |
| `ALCHEMY_API_KEY` | default del proyecto | RPC de Alchemy |

## Importante

El seed escribe en la **chain**. Ponder indexa esos eventos a la DB. Si no aparecen canciones, chequeá que Ponder esté corriendo.

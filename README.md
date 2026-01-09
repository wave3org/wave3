# Wave3 - Trabajo Práctico Final

Plataforma descentralizada con backend distribuido, storage IPFS/Pinata, indexación en tiempo real y ML service.

## Arquitectura

### Servicios

- **nextjs** (`:3000`) - Frontend Next.js con Scaffold-ETH-2
- **ponder** (`:42069`) - Indexador de eventos blockchain con GraphQL API
- **storage** (`:3001`) - API de gestión de archivos IPFS/Pinata
- **ml** (`:8000`) - Servicio Python FastAPI para procesamiento de datos
- **postgres** (`:5432`) - Base de datos PostgreSQL 16
- **ipfs** (`:5001`, `:8080`) - Nodo IPFS local (solo desarrollo)

### Stack Tecnológico

- **Frontend**: Next.js, TypeScript, Scaffold-ETH-2, Wagmi, Viem
- **Indexación**: Ponder (TypeScript)
- **Storage**: Express, TypeScript, Multer, Axios
- **ML Service**: Python 3.11, FastAPI, psycopg2, requests
- **Base de datos**: PostgreSQL 16
- **Contenedores**: Docker Compose
- **IPFS**: Kubo (local) / Pinata (producción)

## Ambiente Local

### Requisitos

- Docker & Docker Compose
- Node.js 20+ (para desarrollo sin Docker)
- Python 3.11+ (para desarrollo sin Docker)
- Yarn

### Instalación

```bash
# Instalar dependencias del workspace
yarn install

# Build e iniciar todos los servicios
make up

# O usar docker compose directamente
docker compose up -d
```

### Servicios Individuales

```bash
# Build
make build-nextjs
make build-ponder
make build-storage
make build-ml
make build-all

# Iniciar
make up-nextjs
make up-ponder
make up-storage
make up-ml

# Logs
make logs-nextjs
make logs-ponder
make logs-storage
make logs-ml

# Detener
make down
```

### Variables de Entorno - Local

**Ponder** (`packages/ponder/.env`)
```env
DATABASE_URL=postgres://wave3:wave3@postgres:5432/wave3
DATABASE_SCHEMA=public
PONDER_RPC_URL_31337=http://host.docker.internal:8545
```

**Storage** (`packages/storage/.env`)
```env
PORT=3001
IPFS_API_URL=http://ipfs:5001
# PINATA_JWT=  # Opcional en local
```

**ML** (`packages/ml/.env`)
```env
PORT=8000
DATABASE_URL=postgresql://wave3:wave3@postgres:5432/wave3
STORAGE_URL=http://storage:3001
```

### URLs Locales

- Frontend: http://localhost:3000
- Ponder GraphQL: http://localhost:42069/graphql
- Storage API: http://localhost:3001
- ML API: http://localhost:8000
- IPFS Gateway: http://localhost:8080

### Desarrollo

**Hot reload está habilitado** para todos los servicios mediante volumes:

```bash
# Frontend
cd packages/nextjs
yarn dev

# Ponder
cd packages/ponder
yarn dev

# Storage
cd packages/storage
yarn dev

# ML
cd packages/ml
# Con el Dockerfile monta el volumen automáticamente
```

## Ambiente Productivo

### Diferencias Clave

1. **IPFS**: Usa **Pinata** en lugar de nodo local
2. **PostgreSQL**: Usa **Supabase** como managed database
3. **Build**: Imágenes optimizadas multi-stage
4. **Variables**: Configuración mediante variables de entorno

### Deploy en Render/Railway/Fly.io

#### Storage Service

**Variables de entorno requeridas:**
```env
PORT=3001
PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NODE_ENV=production
```

**URL Producción:** https://wave3-1-59mh.onrender.com

**Obtener PINATA_JWT:**
1. Ir a https://app.pinata.cloud
2. API Keys → New Key
3. Copiar el JWT completo

#### ML Service

**Variables de entorno requeridas:**
```env
PORT=8000
DATABASE_URL=postgresql://user:pass@host.supabase.co:5432/postgres
STORAGE_URL=https://wave3-1-59mh.onrender.com
```

**URL Producción:** https://wave3-1.onrender.com

**Configurar Supabase:**
1. Crear proyecto en https://supabase.com
2. Settings → Database → Connection String (Pooler)
3. Copiar la connection string y reemplazar `[YOUR-PASSWORD]`

#### Ponder Service

**Variables de entorno requeridas:**
```env
DATABASE_URL=postgresql://user:pass@host.supabase.co:5432/postgres?pgbouncer=true
DATABASE_SCHEMA=public
PONDER_RPC_URL_1=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
# O el RPC que necesites según tu red
```

**URL Producción:** https://ponder-y0w9.onrender.com

#### Next.js (Frontend)

Deploy automático en Vercel o similar. Configurar las URLs de los servicios:
ponder-y0w9.onrender.com
NEXT_PUBLIC_STORAGE_URL=https://wave3-1-59mh.onrender.com
NEXT_PUBLIC_ML_URL=https://wave3-1.onrender.com
```

**URL Producción:** https://wave3-cwfk.onrender.comT_PUBLIC_STORAGE_URL=https://tu-storage.onrender.com
NEXT_PUBLIC_ML_URL=https://tu-ml.onrender.com
```

### Arquitectura Productiva

```
┌─────────────┐
│   Vercel    │  Frontend Next.js
│  (Next.js)  │
└──────┬──────┘
       │
       ├──────────────────────────────┐
       │                              │
┌──────▼──────┐              ┌────────▼────────┐
│   Render    │              │     Render      │
│  (Ponder)   │              │   (Storage)     │
└──────┬──────┘              └────────┬────────┘
       │                              │
       │     ┌───────────┐            │
       └─────►  Supabase │◄───────────┤
             │(PostgreSQL)│            │
             └───────────┘             │
                                       │
             ┌───────────┐             │
             │  Pinata   │◄────────────┘
             │  (IPFS)   │
             └───────────┘
                   ▲
                   │
         ┌─────────┴─────────┐
         │      Render       │
         │    (ML Service)   │
         └───────────────────┘
```

### Healthchecks
wave3-1-59mh.onrender.com/
# {"status": "Storage Service is running"}

curl https://wave3-1.onrender.com/
# {"status": "ML Service is running"}
```

## URLs Productivas

- **Frontend**: https://wave3-cwfk.onrender.com
- **Ponder GraphQL**: https://ponder-y0w9.onrender.com/graphql
- **Storage API**: https://wave3-1-59mh.onrender.com
- **ML API**: https://wave3-1.onrender.com"status": "Storage Service is running"}

curl https://tu-ml.onrender.com/
# {"status": "ML Service is running"}
```

### Monitoreo

- Logs en tiempo real: `make logs-<service>`
- Docker stats: `docker stats`
- Postgres healthcheck cada 5s con reintentos automáticos
- Storage y ML con dependency startup ordering

## API Reference

### Storage Service

**POST /upload**
```bash
curl -F "file=@image.jpg" http://localhost:3001/upload
```
Response:
```json
{
  "cid": "QmXXXXX...",
  "filename": "image.jpg",
  "size": 12345,
  "url": "https://ipfs.io/ipfs/QmXXXXX..."
}
```

**GET /file/:cid**
```bash
curl http://localhost:3001/file/QmXXXXX...
```

### ML Service

**GET /ml**
```bash
curl http://localhost:8000/ml
```
Response:
```json
{
  "table": "greetings",
  "count": 42,
  "ipfs_hash": "QmYYYYY...",
  "ipfs_url": "https://ipfs.io/ipfs/QmYYYYY..."
}
```

## Troubleshooting

### Error: No se puede conectar a Postgres

```bash
# Verificar que el servicio está corriendo
docker compose ps postgres

# Ver logs
make logs-postgres

# Reiniciar con healthcheck
docker compose restart postgres
```

### Error: IPFS timeout en local

```bash
# Verificar que IPFS está corriendo
docker compose ps ipfs

# Reiniciar IPFS
docker compose restart ipfs
```

### Error: Pinata upload fails
wave3-1-59mh
Verificar que `PINATA_JWT` está configurado correctamente:
```bash
curl -H "Authorization: Bearer YOUR_JWT" \
     https://api.pinata.cloud/data/testAuthentication
```

### Error: ML no puede conectarse a Storage

Verificar que `STORAGE_URL` apunta al servicio correcto:
- Local: `http://storage:3001`
- Producción: `https://tu-storage.onrender.com`

## Contributing

Para agregar un nuevo servicio:

1. Crear directorio en `packages/<nombre>/`
2. Agregar Dockerfile
3. Agregar al `compose.yml`
4. Agregar comandos al `Makefile`
5. Documentar en este README

## Licencia

MIT

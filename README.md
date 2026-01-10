# Wave3 - Walking Skeleton

Implementación mínima de extremo a extremo para verificar la arquitectura completa de una dApp descentralizada con indexación, storage IPFS y procesamiento de datos.

## 🌐 Ambiente Productivo

**Frontend:** https://wave3-cwfk.onrender.com

**APIs:**
- **Ponder GraphQL:** https://ponder-y0w9.onrender.com/graphql
- **Storage:** https://wave3-1-59mh.onrender.com
- **ML Service:** https://wave3-1.onrender.com

## 🚀 Inicio Rápido - Desarrollo Local

### Prerequisitos
- Docker & Docker Compose
- Node.js 20+
- Python 3.11+
- Yarn

### 1. Iniciar servicios helper (Postgres, IPFS)

```bash
make dev
```

Esto va a:
- Levantar Postgres y IPFS en Docker
- Instalar dependencias con `yarn install`
- Mostrar las instrucciones para iniciar los servicios localmente

### 2. Iniciar servicios en terminales separadas

```bash
# Terminal 1 - Blockchain local
yarn chain

# Terminal 2 - Deploy de contratos (después que chain esté corriendo)
yarn deploy

# Terminal 3 - Frontend
make dev-nextjs

# Terminal 4 - Indexador
make dev-ponder

# Terminal 5 - Storage API
make dev-storage

# Terminal 6 - ML Service
make dev-ml
```

### URLs Locales
- **Frontend:** http://localhost:3000
- **Ponder GraphQL:** http://localhost:42069/graphql
- **Storage API:** http://localhost:3001
- **ML API:** http://localhost:8000
- **IPFS Gateway:** http://localhost:8080

### Testnet Faucet (Sepolia)

Para obtener ETH de prueba en Sepolia:
https://cloud.google.com/application/web3/faucet/ethereum/sepolia

### Detener todo

```bash
make down
```

## 📦 Arquitectura

```
Frontend (Next.js)
    ↓
Smart Contracts (Hardhat)
    ↓
Ponder (Indexa eventos) → Postgres
    ↓
ML Service (Procesa datos)
    ↓
Storage (Sube a IPFS) → IPFS/Pinata
```

### Servicios

- **nextjs** - Frontend con Scaffold-ETH-2
- **ponder** - Indexador de eventos blockchain (GraphQL)
- **storage** - API de gestión IPFS
- **ml** - Servicio de procesamiento (FastAPI)
- **postgres** - Base de datos (Docker)
- **ipfs** - Nodo IPFS local (Docker)

## 🔧 Comandos Útiles

```bash
# Desarrollo local (solo helpers)
make dev

# Stack completo en Docker
make up-full

# Ver logs
make logs-ponder
make logs-storage
make logs-ml

# Detener todo
make down
```

## 📝 Notas

- Este es un **Walking Skeleton** - una implementación mínima para validar la integración completa
- En desarrollo, los servicios corren nativamente para hot-reload
- En producción, todo corre en contenedores (Render/Vercel)
- IPFS usa nodo local en dev, Pinata en producción
- Postgres usa Docker local, Supabase en producción

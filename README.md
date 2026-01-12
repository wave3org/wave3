# Wave3 - Walking Skeleton

Implementación mínima de extremo a extremo para verificar la arquitectura completa de una dApp descentralizada con indexación, storage IPFS y procesamiento de datos.

## 🌐 Ambiente Productivo

**Frontend:** https://wave3-s4p8.onrender.com

**APIs:**
- **Ponder GraphQL:** https://ponder-sudh.onrender.com/graphql
- **Storage:** https://storage-5gx1.onrender.com
- **ML Service:** https://ml-3l8u.onrender.com

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

### Cuenta de Deploy CI/CD (Sepolia)

El deploy automatizado a Sepolia en CI/CD se realiza con la siguiente cuenta:

**Dirección:** `0x34dba5adc4bf90ff2697532b92ba427b6ef96bf2`

⚠️ **Importante:**
- Esta cuenta necesita Sepolia ETH para funcionar
- Si el deploy falla, revisar si tiene fondos y agregarle ETH de prueba

### Detener todo

```bash
make down
```

## 📦 Arquitectura

### Diagrama de Despliegue

```mermaid
flowchart LR
  subgraph Cliente
    Navegador[Browser]
  end

  subgraph Almacenamiento
    API_ALM[Almacenamiento API]
  end

  subgraph Indexador
    IDX[Indexador]
  end

  subgraph EntrenamientoML
    ML[Entrenamiento ML]
  end

  subgraph BaseDatos
    DB[(Base de datos relacional)]
  end

  subgraph Blockchain
    Contratos[Contratos]
  end

  subgraph Bundler
    BUND[Bundler]
  end

  subgraph SistemaDeArchivosDecentralizado
    SDA[(Almacenamiento descentralizado)]
  end

  Navegador -->|Consulta canciones y artistas| IDX
  IDX -->|Guarda y Lee| DB
  Contratos -->|Emite eventos| IDX
  ML -->|Lee eventos| IDX
  ML -->|Guarda binario| API_ALM
  Navegador -->|Descarga MP3 y modelo| API_ALM
  Navegador -->|UserOperations| BUND
  BUND -->|Acciones| Contratos
  Contratos -->|Lee canciones y metadata| API_ALM
  API_ALM --> |Guarda y Lee| SDA
```

### Servicios

- **nextjs** - Frontend con Scaffold-ETH-2
- **ponder** - Indexador de eventos blockchain (GraphQL)
- **storage** - API de gestión IPFS
- **ml** - Servicio de procesamiento (FastAPI)
- **postgres** - Base de datos (Docker local / Supabase prod)
- **ipfs** - Nodo IPFS local (Docker) / Pinata (prod)

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

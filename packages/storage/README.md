# Storage Service

IPFS upload service that wraps the IPFS API.

## Local Development

```bash
# From workspace root
make dev-storage

# Or manually
cd packages/storage
IPFS_API_URL=http://localhost:5001 yarn dev
```

## Docker Deployment

The storage service is now part of the default docker-compose stack (runs with IPFS).

```bash
# Start storage + IPFS
docker compose up

# Or with all services
make up-full
```

## Production Deployment (Render)

### Option 1: Deploy to Render Web Service

1. Create a new Web Service in Render
2. Connect your repository
3. Configure:
   - **Build Command**: `cd packages/storage && yarn install && yarn build`
   - **Start Command**: `cd packages/storage && yarn start`
   - **Environment Variables**:
     - `IPFS_API_URL`: Your IPFS gateway URL (can use public gateway like `https://ipfs.io/api/v0`)
4. Deploy

### Option 2: Use Docker on Render

1. Create a new Web Service in Render
2. Select "Docker"
3. Set **Dockerfile Path**: `packages/storage/Dockerfile`
4. Set **Docker Context Directory**: `.` (workspace root)
5. Set environment variable:
   - `IPFS_API_URL`: Your IPFS gateway URL

### Update Next.js App

Once deployed, update your Next.js app environment variable in Render:

```
NEXT_PUBLIC_STORAGE_API_URL=https://your-storage-service.onrender.com
```

Redeploy the Next.js app for the change to take effect.

## API Endpoints

### POST /upload

Upload a file to IPFS

**Request:**
- Content-Type: `multipart/form-data`
- Field name: `file`

**Response:**
```json
{
  "cid": "bafkreihu6ck7cgln5zebgfwxwaoke2ba6kxqgjhomx3djwau7jvdvrkb6i"
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/upload \
  -F "file=@song.mp3"
```

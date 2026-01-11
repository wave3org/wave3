import express, { Request, Response } from 'express';
import multer from 'multer';
import cors from 'cors';
import axios from 'axios';
import FormData from 'form-data';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

const PINATA_JWT = process.env.PINATA_JWT;
const IPFS_API_URL = process.env.IPFS_API_URL || 'http://ipfs:5001';

async function uploadToPinata(file: Express.Multer.File): Promise<string> {
  if (!PINATA_JWT) {
    throw new Error('PINATA_JWT no está configurado');
  }

  const formData = new FormData();
  formData.append('file', file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype,
  });

  const response = await axios.post(
    'https://api.pinata.cloud/pinning/pinFileToIPFS',
    formData,
    {
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
        ...formData.getHeaders(),
      },
    }
  );

  return response.data.IpfsHash;
}

async function uploadToIPFSLocal(file: Express.Multer.File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype,
  });

  const response = await axios.post(`${IPFS_API_URL}/api/v0/add`, formData, {
    headers: formData.getHeaders(),
  });

  return response.data.Hash;
}

app.get('/', (req: Request, res: Response) => {
  res.json({ status: 'Storage Service is running' });
});

app.get('/ping', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'storage', message: 'Service is awake' });
});

const uploadMiddleware = upload.single('file');

app.post('/upload', (req, res) => {
  uploadMiddleware(req as any, res as any, async (err: any) => {
    if (err) {
      return res.status(500).json({ error: 'Error al procesar el archivo' });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No se proporcionó un archivo' });
      }

      let cid: string;

      if (PINATA_JWT) {
        cid = await uploadToPinata(req.file);
        console.log(`✓ Archivo subido a Pinata: ${cid}`);
      } else {
        cid = await uploadToIPFSLocal(req.file);
        console.log(`✓ Archivo subido a IPFS local: ${cid}`);
      }

      res.json({
        cid,
        filename: req.file.originalname,
        size: req.file.size,
        url: `https://ipfs.io/ipfs/${cid}`,
      });
    } catch (error) {
      console.error('Error al subir archivo:', error);
      res.status(500).json({ error: 'Error al subir el archivo a IPFS' });
    }
  });
});

app.get('/file/:cid', async (req: Request, res: Response) => {
  try {
    const { cid } = req.params;

    // Intentar obtener desde gateway público
    const response = await axios.get(`https://ipfs.io/ipfs/${cid}`, {
      responseType: 'arraybuffer',
      timeout: 10000,
    });

    res.set('Content-Type', response.headers['content-type'] || 'application/octet-stream');
    res.send(response.data);
  } catch (error) {
    console.error('Error al obtener archivo:', error);
    res.status(404).json({ error: 'Archivo no encontrado en IPFS' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Storage service running on port ${PORT}`);
});

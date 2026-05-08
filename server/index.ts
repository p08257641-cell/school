console.log('>>> [BOOTSTRAP] Server process starting...');
import express from 'express';
import pool from './db.ts';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.ts';
import { init as initDb } from './init-db.ts';

import { Server } from 'socket.io';
import http from 'http';

dotenv.config();
console.log('>>> [BOOTSTRAP] Environment variables loaded.');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Store io in app for access in routes
app.set('io', io);

io.on('connection', (socket) => {
  console.log('>>> [SOCKET] A user connected:', socket.id);
  
  socket.on('join_org', (orgId) => {
    socket.join(`org_${orgId}`);
    console.log(`>>> [SOCKET] User ${socket.id} joined org_${orgId}`);
  });

  socket.on('join_room', (roomName) => {
    socket.join(roomName);
    console.log(`>>> [SOCKET] User ${socket.id} joined ${roomName}`);
  });

  socket.on('disconnect', () => {
    console.log('>>> [SOCKET] User disconnected:', socket.id);
  });
});

app.set('trust proxy', 1);

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 204
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Use project-relative path for uploads to ensure it works across environment (dev/dist)
const uploadsPath = path.join(process.cwd(), 'server', 'uploads');
app.use('/uploads', express.static(uploadsPath));

const PORT = process.env.PORT || process.env.SERVER_PORT || 5000;

// Health Check
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'OK', time: result.rows[0].now });
  } catch (err: any) {
    res.status(500).json({ status: 'ERROR', error: err.message });
  }
});

// API Routes
app.use('/api', apiRoutes);

// Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

// Start Server Immediately to prevent Render Timeout
server.listen(PORT, () => {
  console.log(`Deep backend server with WebSockets is running on http://localhost:${PORT}`);

  // Initialize Database in the background
  initDb()
    .then(() => {
      console.log('Database initialization fully completed.');
    })
    .catch(err => {
      console.error('CRITICAL: Failed to initialize database!');
      console.error('Error Details:', {
        message: err.message,
        code: err.code,
        stack: err.stack,
        hasDatabaseUrl: !!process.env.DATABASE_URL
      });
      // Do not exit the process, just log the error so the server stays up to debug
    });
});

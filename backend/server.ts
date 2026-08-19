import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: '*',
}));
app.use(express.json({ limit: '50mb' }));

// Yahan /api/auth ki jagah direct /api kar diya hai taaki /api/register aur /api/login seedha match ho jaye
app.use('/api', authRoutes);
app.use('/api', projectRoutes);

app.get('/health', (req, res) => {
    res.send('DesignIt Pro API OK');
});

// WebSockets for Real-time Collaboration
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join-project', (projectId: string, user: any) => {
        socket.join(projectId);
        console.log(`Socket ${socket.id} joined project ${projectId}`);
        socket.to(projectId).emit('user-joined', { socketId: socket.id, user });
    });

    socket.on('cursor-move', (data: { projectId: string, cursor: { x: number, y: number }, user: any }) => {
        socket.to(data.projectId).emit('cursor-update', {
            socketId: socket.id,
            cursor: data.cursor,
            user: data.user
        });
    });

    socket.on('object-modified', (data: { projectId: string, state: any }) => {
        socket.to(data.projectId).emit('object-modified-sync', data.state);
    });

    socket.on('object-added', (data: { projectId: string, state: any }) => {
        socket.to(data.projectId).emit('object-added-sync', data.state);
    });

    socket.on('object-removed', (data: { projectId: string, state: any }) => {
        socket.to(data.projectId).emit('object-removed-sync', data.state);
    });

    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
        io.emit('user-left', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
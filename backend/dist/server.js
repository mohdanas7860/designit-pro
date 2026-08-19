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
    origin: [
        'https://designit-pro-tau.vercel.app',
        'http://localhost:3000',
        'http://localhost:3001'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
}));
// Handle preflight requests for all routes
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Routes ko alag-alag theek tarike se mount kar rahe hain:
app.use('/api', authRoutes); // Ye /api/login aur /api/register ke liye hai
app.use('/api/projects', projectRoutes); // Ye /api/projects (save/load) ke liye hai
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
    socket.on('join-project', (projectId, user) => {
        socket.join(projectId);
        console.log(`Socket ${socket.id} joined project ${projectId}`);
        socket.to(projectId).emit('user-joined', { socketId: socket.id, user });
    });
    socket.on('cursor-move', (data) => {
        socket.to(data.projectId).emit('cursor-update', {
            socketId: socket.id,
            cursor: data.cursor,
            user: data.user
        });
    });
    socket.on('object-modified', (data) => {
        socket.to(data.projectId).emit('object-modified-sync', data.state);
    });
    socket.on('object-added', (data) => {
        socket.to(data.projectId).emit('object-added-sync', data.state);
    });
    socket.on('object-removed', (data) => {
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

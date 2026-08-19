import express from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from 'pg';
import jwt from 'jsonwebtoken';

const { Pool } = pkg;
const router = express.Router();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';
// Middleware to authenticate JWT
const authenticateUser = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Create a new project
router.post('/', authenticateUser, async (req: any, res: any) => {
    try {
        const { name, data } = req.body;
        const project = await prisma.project.create({
            data: {
                name: name || 'Untitled Project',
                ownerId: req.user.userId,
                data: data || {}, // JSON holding Fabric canvas
            }
        });
        res.json(project);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// Get user's projects
router.get('/', authenticateUser, async (req: any, res: any) => {
    try {
        const projects = await prisma.project.findMany({
            where: { ownerId: req.user.userId },
            orderBy: { updatedAt: 'desc' }
        });
        res.json(projects);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// Get specific project
router.get('/:id', authenticateUser, async (req: any, res: any) => {
    try {
        const project = await prisma.project.findUnique({
            where: { id: req.params.id }
        });

        if (!project) return res.status(404).json({ error: 'Project not found' });

        // In a real app we might check if user owns project or is collaborator here
        res.json(project);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});

// Update specific project
router.put('/:id', authenticateUser, async (req: any, res: any) => {
    try {
        const { name, data } = req.body;

        // Verify ownership
        const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
        if (!existing || existing.ownerId !== req.user.userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const project = await prisma.project.update({
            where: { id: req.params.id },
            data: { name, data: data ?? existing.data }
        });
        res.json(project);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// Delete specific project
router.delete('/:id', authenticateUser, async (req: any, res: any) => {
    try {
        const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
        if (!existing || existing.ownerId !== req.user.userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await prisma.project.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

export default router;

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();

// Prisma 7 Driver Adapter Setup (Pehle wali error ko rokne ke liye zaroori hai)
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-production-key';

// 3. Test Database Connection
app.get('/', async (req: Request, res: Response): Promise<any> => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return res.json({ message: 'Database connected successfully. Express API is running!' });
    } catch (error) {
        console.error('DB Connection Error:', error);
        return res.status(500).json({ error: 'Database connection failed' });
    }
});

// 4. Signup Route
app.post('/api/signup', async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, password: hashedPassword, name }
        });

        return res.status(201).json({
            message: 'User created successfully',
            user: { id: user.id, email: user.email, name: user.name }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Signup failed. Please try again.' });
    }
});

// 5. Signin Route
app.post('/api/signin', async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

        return res.json({
            token,
            user: { id: user.id, email: user.email, name: user.name }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Signin failed' });
    }
});

// 6. Project Saving Route
app.post('/api/projects', async (req: Request, res: Response): Promise<any> => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized to save' });
        }

        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        } catch (err) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        const { name, data } = req.body;

        const project = await prisma.project.create({
            data: {
                name: name || 'Untitled Project',
                data: data || {},
                ownerId: decoded.userId
            }
        });

        return res.status(201).json(project);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to save project' });
    }
});

// 7. Start the Server
app.listen(PORT, () => {
    console.log(`🚀 DesignIt Pro Backend server running on port ${PORT}`);
});
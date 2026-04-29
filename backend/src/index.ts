import express from 'express';
import bcrypt from 'bcrypt';
import { prisma } from './db';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import pipelineRoutes from './routes/pipelines';
import webhookRoutes from './routes/webhooks';
import jobsRoutes from './routes/jobs';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/pipelines', pipelineRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/webhook', webhookRoutes);

app.get('/health', (req, res) => {
    res.send('Server is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    console.log(`ForgeCI backend listening on port ${PORT}`);
    
    // Seed demo user
    try {
        const demoEmail = 'demo@forgeci.com';
        const existing = await prisma.user.findUnique({ where: { email: demoEmail } });
        if (!existing) {
            const password_hash = await bcrypt.hash('password123', 10);
            await prisma.user.create({
                data: { name: 'Demo User', email: demoEmail, password_hash }
            });
        }
    } catch (err) {
        console.error('\n⚠️ DATABASE WARNING: Could not connect or find the User table!');
        console.error('⚠️ You MUST run `npx prisma db push` in a new terminal to create the database tables!\n');
    }
});

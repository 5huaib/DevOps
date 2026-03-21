import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

router.get('/:projectId', async (req, res) => {
    const { projectId } = req.params;
    try {
        const pipelines = await prisma.pipeline.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' },
            include: { jobs: true }
        });
        res.json(pipelines);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch pipelines' });
    }
});

export default router;

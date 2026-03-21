import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

router.get('/:pipelineId', async (req, res) => {
    const { pipelineId } = req.params;
    try {
        const jobs = await prisma.job.findMany({
            where: { pipelineId },
            orderBy: { createdAt: 'asc' }
        });
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
});

router.post('/ai-analyze', async (req, res) => {
    const { logs } = req.body;
    if (!logs) return res.status(400).json({ error: 'Logs are required for AI analysis' });

    // Simulated AI response
    setTimeout(() => {
        let suggestion = "Review the logs carefully. Some dependencies might be missing or tests are failing due to syntax errors.";

        if (logs.includes('npm install') || logs.includes('missing')) {
            suggestion = "Error: dependency missing. \n\nAI Suggestion:\nRun `npm install` to ensure all required packages are present before building.";
        } else if (logs.includes('test')) {
            suggestion = "Error: test failure detected. \n\nAI Suggestion:\nCheck the failing test cases. It seems a recent code change broke the expected assertions.";
        }

        res.json({ suggestion });
    }, 1500); // simulate network delay
});

export default router;

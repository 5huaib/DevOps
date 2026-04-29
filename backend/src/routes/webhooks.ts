import { Router } from 'express';
import { startPipeline } from '../services/jobRunner';
import { prisma } from '../db';

const router = Router();

router.post('/:projectId', async (req, res) => {
    const { projectId } = req.params;
    
    // Parse common Git Webhook standards
    const branch = req.body?.ref?.replace('refs/heads/', '') || req.body?.branch || 'main';

    try {
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Create a new pipeline
        const pipeline = await prisma.pipeline.create({
            data: {
                projectId,
                triggerType: 'webhook',
                status: 'running',
                startedAt: new Date(),
            }
        });

        // Start pipeline asynchronously (don't block the webhook response)
        startPipeline(pipeline.id, project, branch).catch(console.error);

        res.json({ message: 'Pipeline triggered successfully', pipelineId: pipeline.id, branch });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to process webhook' });
    }
});

export default router;

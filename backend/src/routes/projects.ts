import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const projects = await prisma.project.findMany({
            include: { pipelines: { orderBy: { startedAt: 'desc' } } }
        });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

router.post('/', async (req, res) => {
    const { name, repoUrl, type, script, parentId, userId } = req.body;
    try {
        const project = await prisma.project.create({
            data: { name, repoUrl, type: type || 'pipeline', script, parentId, userId }
        });
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create project' });
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const project = await prisma.project.findUnique({
            where: { id },
            include: { 
                pipelines: { orderBy: { createdAt: 'desc' } },
                children: { include: { pipelines: { orderBy: { startedAt: 'desc' } } } }
            }
        });
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { script } = req.body;
    try {
        const project = await prisma.project.update({
            where: { id },
            data: { script }
        });
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update project' });
    }
});

export default router;

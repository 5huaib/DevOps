import { Router, Request, Response } from 'express';
import { startPipeline } from '../services/jobRunner';
import { prisma } from '../db';
import { PriorityQueue, logPriorityAssignment, globalJobQueue } from '../services/priorityQueue';
import { workerPool } from '../services/workerPool';

const router = Router();

/**
 * Parse webhook payload from GitHub/GitLab
 */
interface WebhookPayload {
    ref?: string;
    branch?: string;
    repository?: { name: string; full_name?: string; url?: string };
    pusher?: { name: string; email: string };
    commits?: Array<{
        id: string;
        message: string;
        timestamp?: string;
        added?: string[];
        modified?: string[];
        removed?: string[];
        author?: { name: string; email: string };
    }>;
}

/**
 * POST /webhook/:projectId
 * Main webhook handler for git push events
 * Triggers pipeline with priority-based job queuing
 */
router.post('/:projectId', async (req: Request, res: Response) => {
    const projectId = Array.isArray(req.params.projectId) 
        ? req.params.projectId[0] 
        : req.params.projectId;
    const payload: WebhookPayload = req.body;

    console.log(`\n🔗 [WEBHOOK RECEIVED] Project: ${projectId}`);
    console.log(`   Payload: ${JSON.stringify(payload).substring(0, 100)}...`);

    // Parse git webhook payload (supports GitHub, GitLab, Gitea, etc.)
    const branch = (payload.ref?.replace('refs/heads/', '') || payload.branch || 'main').trim();
    const repoName = (payload.repository?.name || 'unknown').toLowerCase();
    const commitMessage = payload.commits?.[0]?.message || '';
    const commitId = payload.commits?.[0]?.id || 'unknown';
    const fileChanges = [
        ...(payload.commits?.[0]?.added || []),
        ...(payload.commits?.[0]?.modified || []),
        ...(payload.commits?.[0]?.removed || [])
    ];

    try {
        // Verify project exists
        let project = await prisma.project.findUnique({ where: { id: projectId } });

        // If project doesn't exist, create it (for demo purposes)
        if (!project) {
            console.log(`   ⚠️  Project not found, creating: ${projectId}`);
            project = await prisma.project.create({
                data: {
                    id: projectId,
                    name: repoName,
                    type: 'freestyle',
                    userId: 'demo-user',
                    repoUrl: payload.repository?.url || `https://github.com/${repoName}`,
                    script: 'echo "CI/CD Pipeline triggered"'
                }
            });
        }

        // ✨ CRITICAL FEATURE: Calculate deterministic priority
        const priority = PriorityQueue.calculatePriority(
            branch,
            repoName,
            commitMessage,
            fileChanges
        );

        // Determine reason for priority assignment
        let reason = '';
        if (commitMessage.includes('[URGENT]') || commitMessage.includes('[CRITICAL]')) {
            reason = '[URGENT] tag in commit message';
        } else if (commitMessage.includes('[HIGH]')) {
            reason = '[HIGH] tag in commit message';
        } else if (fileChanges.some((f) => f.includes('auth') || f.includes('security'))) {
            reason = 'Security-sensitive files changed';
        } else if (fileChanges.some((f) => f.includes('package.json') || f.includes('Dockerfile'))) {
            reason = 'Infrastructure/dependency files changed';
        } else if (branch === 'main' || branch === 'master') {
            reason = 'Main/Master production branch';
        } else if (branch === 'develop' || branch === 'staging') {
            reason = 'Develop/Staging branch';
        } else if (branch.startsWith('feature/')) {
            reason = 'Feature branch';
        } else if (branch.startsWith('docs/') || branch.startsWith('chore/')) {
            reason = 'Documentation/Chore branch';
        } else {
            reason = `Branch: ${branch}`;
        }

        // Log priority assignment (for audit trail)
        logPriorityAssignment(projectId, priority, branch, repoName, reason);

        // Create pipeline record
        const pipeline = await prisma.pipeline.create({
            data: {
                projectId,
                triggerType: 'webhook',
                status: 'pending',
                startedAt: new Date()
            }
        });

        console.log(`✅ [PIPELINE CREATED] ID: ${pipeline.id}`);
        console.log(`   Priority: ${priority}/5, Branch: ${branch}, Commit: ${commitId.substring(0, 8)}`);

        // Start pipeline asynchronously (non-blocking webhook response)
        // The priority will be used by the worker pool for scheduling
        setImmediate(() => {
            startPipeline(pipeline.id, project, branch).catch((err) => {
                console.error(`❌ [PIPELINE ERROR] ${pipeline.id}:`, err);
            });
        });

        // Respond immediately (webhook should not block)
        res.status(202).json({
            success: true,
            message: 'Pipeline triggered successfully',
            pipelineId: pipeline.id,
            branch,
            priority,
            priorityReason: reason,
            commitId: commitId.substring(0, 8),
            queueSize: globalJobQueue.size(),
            workerStatus: workerPool.getStatus()
        });

    } catch (error: any) {
        console.error(`❌ [WEBHOOK ERROR] Project ${projectId}:`, error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to process webhook',
            details: error.message
        });
    }
});

/**
 * GET /webhook/status/:projectId
 * Get status of webhooks and queue for a project
 */
router.get('/status/:projectId', async (req: Request, res: Response) => {
    const projectId = Array.isArray(req.params.projectId) 
        ? req.params.projectId[0] 
        : req.params.projectId;
    
    try {
        // Get project pipelines
        const pipelines = await prisma.pipeline.findMany({
            where: { projectId },
            orderBy: { startedAt: 'desc' },
            take: 10
        });

        // Get queue stats
        const queueStats = globalJobQueue.getStats();

        res.json({
            projectId,
            pipelines: pipelines.map(p => ({
                id: p.id,
                status: p.status,
                startedAt: p.startedAt,
                endedAt: p.endedAt
            })),
            queueStats,
            workerStatus: workerPool.getStatus()
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /webhook/queue
 * Get current job queue with priorities
 */
router.get('/queue', (req: Request, res: Response) => {
    const jobs = globalJobQueue.getAll();
    const stats = globalJobQueue.getStats();

    res.json({
        queueSize: jobs.length,
        stats,
        jobs: jobs.map(job => ({
            id: job.id,
            pipelineId: job.pipelineId,
            stageName: job.stageName,
            priority: job.priority,
            branch: job.branch,
            repo: job.repo,
            status: job.status,
            createdAt: job.createdAt
        }))
    });
});

/**
 * GET /webhook/health
 * Health check for webhook endpoint
 */
router.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        queueSize: globalJobQueue.size(),
        workerStatus: workerPool.getStatus()
    });
});

export default router;

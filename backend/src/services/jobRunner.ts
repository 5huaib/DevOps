import { prisma } from '../db';
import { fetchAndParseJenkinsfile } from './jenkinsfileParser';
import { workerPool } from './workerPool';

export async function startPipeline(pipelineId: string, project: any, branch: string = 'main') {
    console.log(`\n🚀 [PIPELINE START] Starting pipeline ${pipelineId} for project ${project.name}`);
    try {
        let stages: Array<{name: string, command: string}> = [];

        if (project.type === 'freestyle') {
            if (project.repoUrl) {
                stages.push({ name: 'Git Checkout', command: `git clone --depth 1 -b ${branch} "${project.repoUrl}" ./workspace-${pipelineId}` });
                stages.push({ name: 'Execute shell', command: `cd ./workspace-${pipelineId} && ${project.script || 'echo "No script provided"'}` });
            } else {
                stages.push({ name: 'Execute shell', command: project.script || 'echo "No script provided"' });
            }
        } else {
            // Jenkinsfile Pipeline Type
            stages = await fetchAndParseJenkinsfile(project.repoUrl, branch);
        }

        // Create job records and queue them for execution
        const jobIds: string[] = [];
        for (const stage of stages) {
            const job = await prisma.job.create({
                data: {
                    pipelineId,
                    stageName: stage.name,
                    status: 'pending',
                    startedAt: new Date()
                }
            });
            jobIds.push(job.id);

            // Queue the job to worker pool
            workerPool.queueJob({
                pipelineId,
                jobId: job.id,
                stageName: stage.name,
                command: stage.command,
                projectName: project.name
            });
        }

        // Wait for all jobs to complete (poll status)
        let allComplete = false;
        let checkInterval: NodeJS.Timeout;
        
        await new Promise<void>((resolve) => {
            checkInterval = setInterval(async () => {
                const jobs = await prisma.job.findMany({
                    where: { id: { in: jobIds } }
                });

                const allDone = jobs.every(j => j.status === 'success' || j.status === 'failed');
                const anyFailed = jobs.some(j => j.status === 'failed');

                if (allDone) {
                    clearInterval(checkInterval);
                    
                    if (anyFailed) {
                        await prisma.pipeline.update({
                            where: { id: pipelineId },
                            data: { status: 'failed', endedAt: new Date() }
                        });
                        console.log(`💀 [PIPELINE FAILED] Pipeline ${pipelineId} - some stages failed.\n`);
                    } else {
                        await prisma.pipeline.update({
                            where: { id: pipelineId },
                            data: { status: 'success', endedAt: new Date() }
                        });
                        console.log(`🎉 [PIPELINE SUCCESS] Pipeline ${pipelineId} completed successfully!\n`);
                    }
                    
                    resolve();
                }
            }, 500);
        });

        // Log worker pool stats
        workerPool.logStats();

    } catch (error) {
        console.error('JobRunner Error:', error);
        await prisma.pipeline.update({
            where: { id: pipelineId },
            data: { status: 'failed', endedAt: new Date() }
        });
        console.log(`💀 [PIPELINE FAILED] Pipeline ${pipelineId} halted due to unexpected error.\n`);
    }
}

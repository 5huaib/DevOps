import { exec } from 'child_process';
import util from 'util';
import { prisma } from '../db';
import { fetchAndParseJenkinsfile } from './jenkinsfileParser';

const execAsync = util.promisify(exec);

export async function startPipeline(pipelineId: string, project: any, branch: string = 'main') {
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

        for (const stage of stages) {
            const job = await prisma.job.create({
                data: {
                    pipelineId,
                    stageName: stage.name,
                    status: 'running',
                    startedAt: new Date()
                }
            });

            try {
                const { stdout, stderr } = await execAsync(stage.command);
                const logs = stdout + (stderr ? '\nERRORS:\n' + stderr : '');

                await prisma.job.update({
                    where: { id: job.id },
                    data: { status: 'success', logs, endedAt: new Date() }
                });
            } catch (error: any) {
                const logs = error.stdout + '\n' + error.stderr + '\n' + error.message;
                await prisma.job.update({
                    where: { id: job.id },
                    data: { status: 'failed', logs, endedAt: new Date() }
                });

                await prisma.pipeline.update({
                    where: { id: pipelineId },
                    data: { status: 'failed', endedAt: new Date() }
                });
                return; // Stop pipeline on failure
            }
        }

        await prisma.pipeline.update({
            where: { id: pipelineId },
            data: { status: 'success', endedAt: new Date() }
        });

    } catch (error) {
        console.error('JobRunner Error:', error);
        await prisma.pipeline.update({
            where: { id: pipelineId },
            data: { status: 'failed', endedAt: new Date() }
        });
    }
}

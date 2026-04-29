/**
 * Worker Pool - Simulates 3-4 parallel workers
 * with randomness for real-world behavior
 */

interface QueuedJob {
    pipelineId: string;
    jobId: string;
    stageName: string;
    command: string;
    projectName: string;
}

interface Worker {
    id: number;
    busy: boolean;
    currentJob: QueuedJob | null;
    jobsCompleted: number;
}

class WorkerPool {
    private workers: Worker[];
    private jobQueue: QueuedJob[] = [];
    private isProcessing = false;

    constructor(workerCount: number = 4) {
        this.workers = Array.from({ length: workerCount }, (_, i) => ({
            id: i + 1,
            busy: false,
            currentJob: null,
            jobsCompleted: 0,
        }));
        console.log(`\n🏗️ [WORKER POOL INITIALIZED] Created ${workerCount} workers`);
    }

    /**
     * Add a job to the queue
     */
    queueJob(job: QueuedJob): void {
        this.jobQueue.push(job);
        console.log(
            `📋 [JOB QUEUED] "${job.stageName}" (Pipeline: ${job.pipelineId.substring(0, 8)}...) - Queue size: ${this.jobQueue.length}`
        );
        this.processQueue();
    }

    /**
     * Process queued jobs with available workers
     */
    private async processQueue(): Promise<void> {
        if (this.isProcessing) return;
        this.isProcessing = true;

        while (this.jobQueue.length > 0) {
            // Find an available worker
            const availableWorker = this.workers.find((w) => !w.busy);

            if (!availableWorker) {
                console.log(`⏳ [QUEUE WAIT] All workers busy (${this.workers.length}). Waiting...`);
                await this.waitForWorkerAvailable();
                continue;
            }

            // Get next job from queue
            const job = this.jobQueue.shift();
            if (!job) break;

            // Introduce random delay (simulating real-world variability)
            const delay = Math.random() * 500 + 200; // 200-700ms
            await new Promise((resolve) => setTimeout(resolve, delay));

            // Execute the job
            availableWorker.busy = true;
            availableWorker.currentJob = job;

            this.executeJobOnWorker(availableWorker, job).finally(() => {
                availableWorker.busy = false;
                availableWorker.currentJob = null;
                availableWorker.jobsCompleted++;
                this.processQueue();
            });
        }

        this.isProcessing = false;
    }

    /**
     * Execute a job on a worker
     */
    private async executeJobOnWorker(worker: Worker, job: QueuedJob): Promise<any> {
        const { exec } = require('child_process');
        const util = require('util');
        const { prisma } = require('../db');

        const execAsync = util.promisify(exec);

        console.log(
            `👷 [WORKER ${worker.id}] Executing: "${job.stageName}" (Pipeline: ${job.pipelineId.substring(0, 8)}...)`
        );

        try {
            // Simulate random execution time (real-world behavior)
            const executionTime = Math.random() * 3000 + 1000; // 1-4 seconds

            const { stdout, stderr } = await execAsync(job.command, {
                timeout: 30000,
            });

            // Simulate potential random failure (5% chance)
            if (Math.random() < 0.05) {
                throw new Error('Simulated random failure');
            }

            const logs = stdout + (stderr ? '\n' + stderr : '');

            // Update job status to success
            await prisma.job.update({
                where: { id: job.jobId },
                data: {
                    status: 'success',
                    logs,
                    endedAt: new Date(),
                },
            });

            console.log(
                `✅ [WORKER ${worker.id}] SUCCESS: "${job.stageName}" (${Math.round(executionTime)}ms)`
            );

            return { success: true, logs };
        } catch (error: any) {
            const logs = error.stdout + '\n' + error.stderr + '\n' + error.message;

            // Update job status to failed
            await prisma.job.update({
                where: { id: job.jobId },
                data: {
                    status: 'failed',
                    logs,
                    endedAt: new Date(),
                },
            });

            console.log(
                `❌ [WORKER ${worker.id}] FAILED: "${job.stageName}" - ${error.message}`
            );

            return { success: false, error: error.message, logs };
        }
    }

    /**
     * Wait for a worker to become available
     */
    private waitForWorkerAvailable(): Promise<void> {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (this.workers.some((w) => !w.busy)) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
    }

    /**
     * Get worker pool status
     */
    getStatus(): { totalWorkers: number; busyWorkers: number; queueSize: number; stats: any[] } {
        return {
            totalWorkers: this.workers.length,
            busyWorkers: this.workers.filter((w) => w.busy).length,
            queueSize: this.jobQueue.length,
            stats: this.workers.map((w) => ({
                workerId: w.id,
                status: w.busy ? 'BUSY' : 'IDLE',
                currentJob: w.currentJob?.stageName || 'None',
                jobsCompleted: w.jobsCompleted,
            })),
        };
    }

    /**
     * Log pool statistics
     */
    logStats(): void {
        const status = this.getStatus();
        console.log(`\n📊 [WORKER POOL STATUS]`);
        console.log(`   Total Workers: ${status.totalWorkers}`);
        console.log(`   Busy: ${status.busyWorkers}/${status.totalWorkers}`);
        console.log(`   Queue Size: ${status.queueSize}`);
        status.stats.forEach((stat) => {
            console.log(
                `   Worker ${stat.workerId}: ${stat.status} (Completed: ${stat.jobsCompleted}, Current: ${stat.currentJob})`
            );
        });
    }
}

// Export singleton instance
export const workerPool = new WorkerPool(4); // 4 workers

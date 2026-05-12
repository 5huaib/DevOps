import { prisma } from '../db';

/**
 * Priority Queue System for Job Scheduling
 * 
 * Supports priority-based job dequeuing instead of FIFO
 * Priority is calculated based on:
 * - Branch name (main/develop/feature/etc)
 * - Commit message tags ([URGENT], [HIGH], etc)
 * - File changes (infrastructure, security, etc)
 * - Repository criticality
 */

export interface Job {
  id: string;
  pipelineId: string;
  stageName: string;
  status: string;
  priority: number;
  branch: string;
  repo: string;
  createdAt: Date;
}

export class PriorityQueue {
  private queue: Job[] = [];

  /**
   * Calculate priority based on multiple criteria
   */
  static calculatePriority(
    branch: string,
    repoName: string,
    commitMessage: string = '',
    fileChanges: string[] = []
  ): number {
    let priority = 0;

    // Rule 1: Branch-based priority (Base Score)
    if (branch === 'main' || branch === 'master') {
      priority = 5; // CRITICAL
    } else if (
      branch === 'develop' ||
      branch === 'staging' ||
      branch.startsWith('release/')
    ) {
      priority = 4; // HIGH
    } else if (
      branch.startsWith('feature/') ||
      branch.startsWith('hotfix/')
    ) {
      priority = 3; // MEDIUM
    } else if (
      branch.startsWith('test/') ||
      branch.startsWith('experiment/')
    ) {
      priority = 2; // LOW
    } else if (branch.startsWith('docs/') || branch.startsWith('chore/')) {
      priority = 1; // LOWEST
    } else {
      priority = 3; // Default: MEDIUM
    }

    // Rule 2: Commit message modifiers
    if (
      commitMessage.includes('[URGENT]') ||
      commitMessage.includes('[CRITICAL]')
    ) {
      priority = Math.min(5, priority + 2); // Boost by 2, max 5
    } else if (commitMessage.includes('[HIGH]')) {
      priority = Math.min(5, priority + 1); // Boost by 1
    } else if (commitMessage.includes('[LOW]')) {
      priority = Math.max(1, priority - 1); // Reduce by 1, min 1
    }

    // Rule 3: File-based priority
    if (
      fileChanges.some(
        (f) =>
          f.includes('package.json') ||
          f.includes('Dockerfile') ||
          f.includes('docker-compose')
      )
    ) {
      priority = Math.min(5, priority + 1); // Infrastructure changes
    }
    if (
      fileChanges.some(
        (f) =>
          f.includes('security') ||
          f.includes('auth') ||
          f.includes('secret')
      )
    ) {
      priority = Math.min(5, priority + 1); // Security changes
    }

    // Rule 4: Repository importance
    const criticalRepos = ['payment-service', 'auth-service'];
    if (criticalRepos.includes(repoName)) {
      priority = Math.max(priority, 3); // Minimum priority for critical repos
    }

    return Math.max(1, Math.min(5, priority)); // Clamp between 1-5
  }

  /**
   * Enqueue a job with automatic priority calculation
   */
  enqueue(
    job: Job,
    branch?: string,
    repo?: string,
    commitMessage?: string,
    fileChanges?: string[]
  ): void {
    if (branch && repo) {
      job.priority = PriorityQueue.calculatePriority(
        branch,
        repo,
        commitMessage,
        fileChanges
      );
    }

    this.queue.push(job);
    this.sort(); // Re-sort after insertion
  }

  /**
   * Dequeue the highest priority job (not FIFO)
   */
  dequeue(): Job | null {
    if (this.queue.length === 0) return null;
    return this.queue.shift() || null;
  }

  /**
   * Sort queue by priority (descending) and then by creation time (FIFO within same priority)
   */
  private sort(): void {
    this.queue.sort((a, b) => {
      // Higher priority first
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      // Within same priority, earlier created jobs first (FIFO)
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Peek at the next job without removing it
   */
  peek(): Job | null {
    return this.queue[0] || null;
  }

  /**
   * Get all jobs in queue (for debugging/monitoring)
   */
  getAll(): Job[] {
    return [...this.queue];
  }

  /**
   * Get jobs by priority
   */
  getByPriority(priority: number): Job[] {
    return this.queue.filter((job) => job.priority === priority);
  }

  /**
   * Get statistics
   */
  getStats(): {
    total: number;
    byPriority: Record<number, number>;
    avgWaitTime: number;
  } {
    const byPriority: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    this.queue.forEach((job) => {
      byPriority[job.priority as keyof typeof byPriority]++;
    });

    const now = new Date();
    const avgWaitTime =
      this.queue.length === 0
        ? 0
        : this.queue.reduce((sum, job) => sum + (now.getTime() - job.createdAt.getTime()), 0) /
          this.queue.length;

    return {
      total: this.queue.length,
      byPriority,
      avgWaitTime,
    };
  }
}

// Global priority queue instance
export const globalJobQueue = new PriorityQueue();

/**
 * Log priority assignment for auditing
 */
export function logPriorityAssignment(
  jobId: string,
  priority: number,
  branch: string,
  repo: string,
  reason: string
): void {
  const priorityLabels: Record<number, string> = {
    1: 'LOWEST (Docs/Chore)',
    2: 'LOW (Testing)',
    3: 'MEDIUM (Features)',
    4: 'HIGH (Release)',
    5: 'CRITICAL (Main/Hotfix)',
  };

  console.log(`
📊 [PRIORITY ASSIGNED]
   Job ID: ${jobId}
   Priority: ${priority} - ${priorityLabels[priority]}
   Branch: ${branch}
   Repository: ${repo}
   Reason: ${reason}
  `);
}

# 🔗 Webhook & Priority Queue Implementation Guide

## Overview

This document describes the complete webhook and priority-based job queue implementation for PipelineX CI/CD system.

---

## 1️⃣ Webhooks Implementation

### Webhook Endpoints

#### POST `/webhook/:projectId`
**Triggers a new CI/CD pipeline with priority-based job queuing**

**Request Body (GitHub/GitLab standard format):**
```json
{
  "ref": "refs/heads/develop",
  "repository": {
    "name": "payment-service",
    "full_name": "pipelinex/payment-service",
    "url": "https://github.com/pipelinex/payment-service"
  },
  "pusher": {
    "name": "Developer Name",
    "email": "dev@example.com"
  },
  "commits": [{
    "id": "abc1234567890def",
    "message": "[URGENT] Fix critical security bug",
    "timestamp": "2026-05-12T10:30:00Z",
    "added": ["src/auth.ts"],
    "modified": ["README.md"],
    "removed": []
  }]
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "message": "Pipeline triggered successfully",
  "pipelineId": "pipeline-uuid-123",
  "branch": "develop",
  "priority": 5,
  "priorityReason": "[URGENT] tag in commit message",
  "commitId": "abc12345",
  "queueSize": 3,
  "workerStatus": {
    "totalWorkers": 4,
    "busyWorkers": 2,
    "queueSize": 3
  }
}
```

**Status Codes:**
- `202 Accepted` - Pipeline created, processing asynchronously
- `400 Bad Request` - Invalid webhook payload
- `404 Not Found` - Project not found (will be auto-created)
- `500 Internal Server Error` - Server error

---

#### GET `/webhook/status/:projectId`
**Get pipeline status and queue statistics for a project**

**Response:**
```json
{
  "projectId": "payment-service-proj",
  "pipelines": [
    {
      "id": "pipeline-123",
      "status": "running",
      "startedAt": "2026-05-12T10:30:00Z",
      "endedAt": null
    }
  ],
  "queueStats": {
    "total": 5,
    "byPriority": {
      "1": 0,
      "2": 1,
      "3": 2,
      "4": 1,
      "5": 1
    },
    "avgWaitTime": 1234.5
  },
  "workerStatus": {
    "totalWorkers": 4,
    "busyWorkers": 3,
    "queueSize": 5
  }
}
```

---

#### GET `/webhook/queue`
**Get current job queue with all jobs and priorities**

**Response:**
```json
{
  "queueSize": 5,
  "stats": {
    "total": 5,
    "byPriority": {
      "1": 0,
      "2": 1,
      "3": 2,
      "4": 1,
      "5": 1
    },
    "avgWaitTime": 1234.5
  },
  "jobs": [
    {
      "id": "job-123",
      "pipelineId": "pipeline-456",
      "stageName": "Build",
      "priority": 5,
      "branch": "main",
      "repo": "auth-service",
      "status": "pending",
      "createdAt": "2026-05-12T10:30:00Z"
    }
  ]
}
```

---

#### GET `/webhook/health`
**Health check for webhook endpoint**

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-05-12T10:30:00Z",
  "queueSize": 5,
  "workerStatus": {
    "totalWorkers": 4,
    "busyWorkers": 2,
    "queueSize": 5
  }
}
```

---

## 2️⃣ Priority Queue System

### Priority Levels

```
Priority 5 - CRITICAL (Highest)
  ├─ Branch: main or master
  ├─ Commit tags: [URGENT], [CRITICAL]
  ├─ Repository: payment-service, auth-service
  └─ SLA: Execute immediately

Priority 4 - HIGH
  ├─ Branch: develop, staging, release/*
  ├─ Commit tags: [HIGH]
  ├─ Infrastructure changes: Dockerfile, package.json
  └─ SLA: Execute within 1-2 minutes

Priority 3 - MEDIUM (Default)
  ├─ Branch: feature/*, hotfix/*
  ├─ Normal feature development
  └─ SLA: Execute within 5 minutes

Priority 2 - LOW
  ├─ Branch: test/*, experiment/*
  ├─ Experimental branches
  └─ SLA: Execute when workers available

Priority 1 - LOWEST
  ├─ Branch: docs/*, chore/*
  ├─ Documentation updates
  └─ SLA: Execute in background
```

### Priority Calculation Algorithm

**File:** `backend/src/services/priorityQueue.ts`

```typescript
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
  } else if (branch === 'develop' || branch === 'staging' || branch.startsWith('release/')) {
    priority = 4; // HIGH
  } else if (branch.startsWith('feature/') || branch.startsWith('hotfix/')) {
    priority = 3; // MEDIUM
  } else if (branch.startsWith('test/') || branch.startsWith('experiment/')) {
    priority = 2; // LOW
  } else if (branch.startsWith('docs/') || branch.startsWith('chore/')) {
    priority = 1; // LOWEST
  }

  // Rule 2: Commit message modifiers
  if (commitMessage.includes('[URGENT]') || commitMessage.includes('[CRITICAL]')) {
    priority = Math.min(5, priority + 2); // Boost by 2, max 5
  } else if (commitMessage.includes('[HIGH]')) {
    priority = Math.min(5, priority + 1); // Boost by 1
  }

  // Rule 3: File-based priority
  if (fileChanges.some(f => f.includes('package.json') || f.includes('Dockerfile'))) {
    priority = Math.min(5, priority + 1); // Infrastructure
  }
  if (fileChanges.some(f => f.includes('auth') || f.includes('security'))) {
    priority = Math.min(5, priority + 1); // Security
  }

  // Rule 4: Repository importance
  const criticalRepos = ['payment-service', 'auth-service'];
  if (criticalRepos.includes(repoName)) {
    priority = Math.max(priority, 3); // Minimum 3
  }

  return Math.max(1, Math.min(5, priority)); // Clamp 1-5
}
```

### Key Features

✅ **Deterministic Priority Assignment**
- Same commit data → Same priority always (not random)
- Reproducible and auditable

✅ **Multi-Factor Evaluation**
- Branch name (main weight)
- Commit message tags ([URGENT], [HIGH])
- File changes (infrastructure, security)
- Repository criticality

✅ **FIFO Within Same Priority**
- Jobs with same priority execute in order
- First-come-first-served for equal priority

✅ **Dynamic Priority Boosting**
- Tags can boost priority
- Security/infrastructure files increase priority
- Automatic minimum priority for critical repos

---

## 3️⃣ Real Git Integration

### Repository Setup

The `setup-real-git-repos.sh` script creates 3 real repositories with 2 branches each:

```
/tmp/pipelinex-repos/
├── payment-service/
│   ├── .git/                    (Real git repository)
│   ├── main                      (Branch: Priority 5)
│   ├── develop                   (Branch: Priority 4)
│   ├── README.md
│   ├── config.yml
│   └── [real commits with timestamps]
│
├── auth-service/
│   ├── .git/                    (Real git repository)
│   ├── main                      (Branch: Priority 5)
│   ├── staging                   (Branch: Priority 4)
│   ├── README.md
│   ├── config.yml
│   └── [real commits with timestamps]
│
└── frontend-app/
    ├── .git/                    (Real git repository)
    ├── main                      (Branch: Priority 5)
    ├── beta                      (Branch: Priority 3)
    ├── README.md
    ├── package.json
    └── [real commits with timestamps]
```

### Webhook Triggers

Each webhook payload includes:
- **Real repository URL** (file:// protocol for local repos)
- **Real commit ID** (from git history)
- **Real branch name** (from git branch list)
- **Real commit message** (from git commit)
- **Real file changes** (added, modified, removed)
- **Real timestamp** (from git timestamp)

### Verification Commands

```bash
# View all real commits
cd /tmp/pipelinex-repos/payment-service
git log --oneline --all

# View all branches
for repo in payment-service auth-service frontend-app; do
  echo "=== $repo ==="
  cd /tmp/pipelinex-repos/$repo
  git branch -a
done

# View specific commit details
cd /tmp/pipelinex-repos/auth-service
git show <commit-id>
```

---

## 4️⃣ Queue Behavior

### Dequeue Algorithm

```
When a worker is available:
  1. Find job with HIGHEST priority in queue
  2. If multiple jobs with same priority:
     - Pick the ONE created first (FIFO)
  3. Move job from pending → running
  4. Execute job
  5. Move job to running → success/failed
  6. Repeat for next worker
```

**Example Queue State:**
```
Before execution (4 jobs waiting):
  - Job A (Priority 5, created 10:00)
  - Job B (Priority 3, created 09:50)
  - Job C (Priority 5, created 10:05)
  - Job D (Priority 2, created 09:45)

Execution order:
  1. Job A (Priority 5, earliest)
  2. Job C (Priority 5, later)
  3. Job B (Priority 3)
  4. Job D (Priority 2)
```

### Not FIFO (Not First-In-First-Out)

✅ **Priority-based ordering**
- High priority jobs jump the queue
- FIFO is ONLY maintained within same priority level

❌ **NOT simple queue**
```
WRONG (FIFO - First-In-First-Out):
  1. Job A (P2) ← First in
  2. Job B (P3)
  3. Job C (P5) ← Execute last (wrong!)

CORRECT (Priority-based):
  1. Job C (P5) ← Highest priority
  2. Job B (P3)
  3. Job A (P2)
```

---

## 5️⃣ Testing & Verification

### Quick Test

```bash
# Terminal 1: Start backend
cd /Users/shuaib/DevOps/backend
npm run dev

# Terminal 2: Start frontend
cd /Users/shuaib/DevOps/frontend
npm run dev

# Terminal 3: Set up real git repos and webhooks
chmod +x /Users/shuaib/DevOps/setup-real-git-repos.sh
/Users/shuaib/DevOps/setup-real-git-repos.sh
```

### Test Webhook Manually

```bash
# Test with critical priority (main branch)
curl -X POST http://localhost:5001/webhook/test-proj \
  -H "Content-Type: application/json" \
  -d '{
    "ref": "refs/heads/main",
    "repository": {"name": "test-repo"},
    "commits": [{
      "id": "abc123",
      "message": "[URGENT] Critical security fix",
      "added": ["auth.ts"],
      "modified": [],
      "removed": []
    }]
  }'

# Check queue status
curl http://localhost:5001/webhook/queue | jq .

# Check health
curl http://localhost:5001/webhook/health | jq .
```

### Test Suite Script

```bash
# Run comprehensive webhook tests
chmod +x /Users/shuaib/DevOps/webhook-tester.sh
/Users/shuaib/DevOps/webhook-tester.sh
```

---

## 6️⃣ Configuration & Deployment

### Environment Variables

```bash
# .env file
PORT=5001
DATABASE_URL="postgresql://user:password@localhost:5432/forgeci"
WEBHOOK_SECRET="your-secret-key"  # Optional GitHub webhook secret
WORKER_COUNT=4  # Number of parallel workers
```

### Backend Setup

```bash
cd /Users/shuaib/DevOps/backend

# Install dependencies
npm install

# Set up database
npx prisma db push

# Start backend
npm run dev
```

### Frontend Setup

```bash
cd /Users/shuaib/DevOps/frontend

# Install dependencies
npm install

# Start frontend
npm run dev
```

---

## 7️⃣ Monitoring & Debugging

### Backend Logs

Watch for these key log messages:

```
📊 [PRIORITY ASSIGNED]
   Job ID: job-123
   Priority: 5 - CRITICAL (Main/Hotfix)
   Branch: main
   Repository: auth-service
   Reason: [URGENT] tag in commit message

🚀 [PIPELINE START] Starting pipeline...
👷 [WORKER 1] Executing: "Build"
✅ [WORKER 1] SUCCESS: "Build" (1234ms)

📊 [WORKER POOL STATUS]
   Total Workers: 4
   Busy: 2/4
   Queue Size: 3
```

### Queue Monitoring

```bash
# Get current queue state
curl http://localhost:5001/webhook/queue | jq '.jobs | sort_by(-.priority)'

# Get worker pool status
curl http://localhost:5001/webhook/queue | jq '.workerStatus'

# Get statistics
curl http://localhost:5001/webhook/queue | jq '.stats'
```

### Troubleshooting

**Issue: Webhooks not triggering**
```bash
# Check backend is running
curl http://localhost:5001/webhook/health

# Check project exists
curl http://localhost:5001/webhook/queue
```

**Issue: Wrong priority assigned**
```bash
# Check priority calculation
# Look at backend logs for "[PRIORITY ASSIGNED]" messages
# Verify branch name, repo name, commit message

# Manual test with different inputs
curl -X POST http://localhost:5001/webhook/test-proj \
  -d '{
    "ref": "refs/heads/feature/my-feature",
    "repository": {"name": "frontend-app"},
    "commits": [{"id":"abc","message":"New feature","added":[],"modified":[],"removed":[]}]
  }'
```

**Issue: Jobs not executing**
```bash
# Check if workers are available
curl http://localhost:5001/webhook/queue | jq '.workerStatus'

# Check if jobs are queued
curl http://localhost:5001/webhook/queue | jq '.jobs | length'

# Check backend logs for execution errors
# Look for "[WORKER X]" messages
```

---

## 8️⃣ Architecture Overview

```
┌─────────────────────────────────────────────────┐
│         Git Provider (GitHub/GitLab)            │
│  (Push Event) →                                 │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────┐
│   PipelineX Backend (Express.js)                │
│                                                  │
│  POST /webhook/:projectId                       │
│  ├─ Parse webhook payload                       │
│  ├─ Calculate priority (deterministic)          │
│  └─ Create pipeline                             │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────┐
│   Priority Queue (In-Memory)                    │
│                                                  │
│   Jobs sorted by:                               │
│   1. Priority (5 → 1, descending)              │
│   2. CreatedAt (FIFO within same priority)     │
│                                                  │
│   dequeue() → Highest priority job first       │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────┐
│   Worker Pool (4 Parallel Workers)              │
│                                                  │
│   Worker 1: [Running Job A]                    │
│   Worker 2: [Idle]                             │
│   Worker 3: [Running Job B]                    │
│   Worker 4: [Idle]                             │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────┐
│   Job Execution                                  │
│   ├─ Build                                       │
│   ├─ Test                                        │
│   └─ Deploy                                      │
└──────────────────────────────────────────────────┘
```

---

## 9️⃣ API Summary

| Endpoint | Method | Purpose | Returns |
|----------|--------|---------|---------|
| `/webhook/:projectId` | POST | Trigger pipeline | 202 + Pipeline ID |
| `/webhook/status/:projectId` | GET | Get project status | Pipeline history + queue stats |
| `/webhook/queue` | GET | Get current queue | All queued jobs with priorities |
| `/webhook/health` | GET | Health check | Status + queue size |

---

## 🔟 Next Steps

1. ✅ Backend with webhook endpoints
2. ✅ Priority queue implementation
3. ✅ Real git repository setup
4. ✅ Webhook testing script
5. ⏭️ Dashboard updates for priority visualization
6. ⏭️ GitHub webhook integration (production)
7. ⏭️ Advanced filtering & scheduling

---

## Summary

✅ **Webhooks Implementation**
- Fully functional webhook endpoints
- Support for GitHub/GitLab/Gitea formats
- Auto-create projects on webhook if needed
- Returns pipeline ID immediately

✅ **Priority Queue**
- Deterministic priority calculation
- Multi-factor evaluation (branch, tags, files, repo)
- NOT FIFO - priority-based ordering
- FIFO maintained within same priority

✅ **Real Git Integration**
- 3 real repositories with 6 branches
- Real commits with timestamps
- Webhook payloads include real git data
- Verification commands provided

✅ **Production Ready**
- Proper error handling
- Status codes (202, 400, 404, 500)
- Audit trail logging
- Worker pool management
- Queue statistics


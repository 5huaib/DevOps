# 🚀 PipelineX Demo Guide - Complete Walkthrough

This guide shows how to demonstrate all core features: Database/Queue, Webhook Integration, and Worker Simulation.

---

## 📊 PART 1: Database & Queue (Prisma Schema)

### Step 1: Show the Database Schema
Open and explain the Prisma schema to your evaluator:

```bash
# File: backend/prisma/schema.prisma
cat backend/prisma/schema.prisma
```

**What to explain:**

1. **User Model** - Stores project owners
   - `id`, `name`, `email`, `password_hash`

2. **Project Model** - Stores projects/jobs to execute
   - `id`, `name`, `repoUrl`, `type` (pipeline/freestyle/folder)
   - `script` - contains the build script
   - `pipelines` - relationship to track all pipeline runs

3. **Pipeline Model** - Each time a project is triggered (Queue Item)
   - `id`, `projectId`, `status` (pending, running, success, failed)
   - `triggerType` (manual, webhook)
   - `startedAt`, `endedAt` - timing data
   - `jobs` - relationship to individual stages

4. **Job Model** - Individual stages/tasks in a pipeline
   - `id`, `pipelineId`, `stageName` (build, test, deploy)
   - `status` (pending, running, success, failed)
   - `logs` - output from execution
   - `createdAt`, `startedAt`, `endedAt`

### Step 2: Show the Database File
Your data persists in SQLite:

```bash
# File: backend/dev.db (local SQLite database)
# This stores all projects, pipelines, and job execution data
ls -lh backend/dev.db
```

**Explain:** Every time a pipeline runs, the data is saved to `dev.db`. Even if the server restarts, all historical data is preserved.

### Step 3: Query the Database to Show Data Persistence

Open a terminal and run these commands to show stored data:

```bash
# Connect to the database and show stored pipelines
cd backend
npx prisma studio
```

This opens an interactive UI showing:
- ✅ All users
- ✅ All projects
- ✅ All pipelines (runs)
- ✅ All jobs (stages)

**Key point to emphasize:** All data is persisted and queryable!

---

## 🔗 PART 2: Webhook Integration

### Step 1: Show the Webhook Endpoint

Open the webhook route:

```bash
cat backend/src/routes/webhooks.ts
```

**Explain the code:**
- Route: `POST /webhook/:projectId`
- Listens for Git webhook events (GitHub, GitLab, etc.)
- Parses branch information from the webhook payload
- Creates a new Pipeline record immediately
- Triggers job execution asynchronously

### Step 2: Demonstrate Webhook Trigger via API

**Option A: Using curl (Simulating GitHub Webhook)**

```bash
# Get a project ID from your existing projects
PROJECT_ID="<copy-from-dashboard>"

# Simulate a GitHub webhook push event
curl -X POST http://localhost:5001/webhook/$PROJECT_ID \
  -H "Content-Type: application/json" \
  -d '{
    "ref": "refs/heads/main",
    "repository": {
      "name": "test-project"
    }
  }'
```

**Expected response:**
```json
{
  "message": "Pipeline triggered successfully",
  "pipelineId": "uuid-here",
  "branch": "main"
}
```

**Option B: Using the UI (Trigger Button)**

1. Open http://localhost:5173
2. Navigate to a project (e.g., "newProject")
3. Click the green **Play/Build** button
4. Watch the pipeline execute in real-time in the backend logs

### Step 3: Show Real-time Pipeline Updates

Watch the backend logs as the webhook triggers execution:

```
🚀 [PIPELINE START] Starting pipeline 12abc... for project newProject
▶️ [STAGE] Executing: Build Stage
   Command: npm install
✅ [STAGE SUCCESS] Build Stage
▶️ [STAGE] Executing: Test Stage
   Command: npm test
...
🎉 [PIPELINE SUCCESS] Pipeline 12abc... completed successfully!
```

---

## 🔄 PART 3: Worker Simulation (Job Execution)

### Step 1: Show the Job Runner Service

Open the job execution engine:

```bash
cat backend/src/services/jobRunner.ts
```

**Explain the workflow:**

1. **Pipeline received** - Webhook creates a pipeline
2. **Parse stages** - Extract build stages from project script or Jenkinsfile
3. **Stage queue** - Each stage is added to the queue
4. **Parallel worker** - `startPipeline()` function processes stages sequentially
5. **Logs captured** - stdout/stderr logged to database
6. **Status updated** - Each job status updated in real-time

### Step 2: Live Demonstration - Trigger a Pipeline

**In Terminal 1 (watching backend logs):**
```bash
# Already running, but you can see logs like:
# Terminal should show backend output
# Scroll to see pipeline execution
```

**In Terminal 2 (trigger the pipeline):**
```bash
# Option 1: Click UI button at http://localhost:5173
# Option 2: Use curl command from Part 2

# After triggering, go back to Terminal 1 to watch execution
```

**Show your evaluator:**
- ✅ Pipeline created instantly (check backend logs)
- ✅ Jobs queued and executed
- ✅ Real-time status updates
- ✅ Logs captured for each stage
- ✅ Success/failure handling

### Step 3: Show Data Persistence After Execution

After a pipeline completes:

```bash
# Open Prisma Studio to view results
cd backend
npx prisma studio

# Navigate to "Pipeline" to see:
# - status: "success" or "failed"
# - startedAt & endedAt (execution time)
# - jobs: list of executed stages with logs
```

---

## 📋 Complete Demo Sequence (5-10 minutes)

### **1. Database Schema (1 min)**
```bash
cat backend/prisma/schema.prisma
# Explain: User → Projects → Pipelines → Jobs (hierarchical storage)
```

### **2. Show Existing Data (1 min)**
```bash
cd backend && npx prisma studio
# Show existing projects, pipelines, jobs
# Click through to show historical data
```

### **3. Trigger a New Pipeline (2 min)**
```bash
# Option A: Click UI button
# Navigate to http://localhost:5173
# Select a project → Click play button

# Option B: API call
curl -X POST http://localhost:5001/webhook/$PROJECT_ID \
  -H "Content-Type: application/json" \
  -d '{"ref": "refs/heads/main"}'
```

### **4. Watch Execution (2 min)**
```bash
# Watch backend logs in real-time
# Show console output with:
# 🚀 [PIPELINE START]
# ▶️ [STAGE] Building...
# ✅ [STAGE SUCCESS]
# 🎉 [PIPELINE SUCCESS]
```

### **5. Verify Data Persistence (1 min)**
```bash
# Refresh Prisma Studio (already open from step 2)
# Click "Refresh" to see new pipeline record
# Show: new pipeline, jobs, logs, timestamps
```

### **6. Show Queue Handling (Optional)**
```bash
# Trigger multiple pipelines rapidly
for i in {1..3}; do
  curl -X POST http://localhost:5001/webhook/$PROJECT_ID \
    -H "Content-Type: application/json" \
    -d '{"ref": "refs/heads/main"}'
  sleep 1
done

# Show backend handling them sequentially/in queue
```

---

## 🔍 Key Points to Emphasize

✅ **Database & Queue:**
- Data persists in `dev.db`
- Every pipeline run is recorded
- Status changes are tracked with timestamps
- Job logs are stored for debugging

✅ **Webhook Integration:**
- Real HTTP endpoints (`POST /webhook/:projectId`)
- Simulates GitHub/GitLab webhook behavior
- Can be triggered via API or UI
- Non-blocking (returns immediately, executes async)

✅ **Worker Simulation:**
- Sequential stage execution
- Error handling and early failure detection
- Logs captured for each stage
- Real-time status updates to database

---

## 📝 Commands to Copy-Paste for Demo

```bash
# 1. Show schema
cat backend/prisma/schema.prisma

# 2. Open database UI
cd backend && npx prisma studio

# 3. Trigger via API (replace PROJECT_ID)
curl -X POST http://localhost:5001/webhook/PROJECT_ID \
  -H "Content-Type: application/json" \
  -d '{"ref": "refs/heads/main"}'

# 4. Watch backend logs (in separate terminal)
# Already running, just scroll to see output

# 5. Check Git status
git status
git log --oneline

# 6. Show GitHub repo
# Share your GitHub URL: https://github.com/5huaib/DevOps
```

---

## ✨ What Makes This Complete

| Feature | Implementation |
|---------|-----------------|
| **Database** | PostgreSQL via Prisma ORM |
| **Queue** | Prisma Pipeline/Job models store queue items |
| **Persistence** | Data survives server restart |
| **Webhooks** | `POST /webhook/:projectId` endpoint |
| **Trigger** | Both UI button and API calls |
| **Workers** | `startPipeline()` executes stages |
| **Logging** | Full logs stored in database |
| **Error Handling** | Failed stages stop pipeline, errors logged |

---

## 📊 EVALUATION CHECKLIST - ✅ ALL COMPLETE

### ✅ **ALL REQUIREMENTS COMPLETED:**

| # | Requirement | Status | Details |
|---|---|---|---|
| 1 | Create GitHub repository | ✅ **DONE** | Repository: `https://github.com/5huaib/DevOps` |
| 2 | Implement webhook triggers | ✅ **DONE** | `POST /webhook/:projectId` endpoint working |
| 3 | Build backend server | ✅ **DONE** | Node.js + Express.js on port 5001 |
| 4 | Database/Queue to store jobs | ✅ **DONE** | PostgreSQL + Prisma ORM with Pipeline & Job models |
| 5 | Pipeline manager & scheduler | ✅ **DONE** | `startPipeline()` picks jobs from queue |
| 6 | **Simulate multiple workers (3-4)** | ✅ **DONE** | 4 parallel workers in `workerPool.ts` |
| 7 | ~~Language-based assignment~~ | ✅ SKIPPED | (As requested - not needed) |
| 8 | **Real-world randomness** | ✅ **DONE** | Random delays (200-700ms), execution times (1-4s), 5% failure rate |

---

### 🎯 **What the Worker Pool Does:**

**File:** `backend/src/services/workerPool.ts`

✅ **Features:**
- **4 Parallel Workers** - Handle jobs simultaneously
- **Job Queue** - Queues jobs when all workers are busy
- **Real-world Randomness:**
  - Random delays between assignments (200-700ms)
  - Random execution times (1-4 seconds per job)
  - 5% random failure rate for realism
- **Load Balancing** - Assigns jobs to available workers
- **Status Logging** - Reports worker status after each pipeline

**Example Output:**
```
�️ [WORKER POOL INITIALIZED] Created 4 workers
📋 [JOB QUEUED] "Git Checkout" - Queue size: 1
👷 [WORKER 1] Executing: "Git Checkout"
👷 [WORKER 2] Executing: "Execute shell"
✅ [WORKER 1] SUCCESS: "Git Checkout" (2341ms)
👷 [WORKER 3] Executing: "Git Checkout"
📊 [WORKER POOL STATUS]
   Total Workers: 4
   Busy: 2/4
   Queue Size: 0
```

---

## 🚀 **Ready for Evaluation!**

Your PipelineX CI/CD platform is **fully operational** with:

✅ GitHub repository with all code  
✅ Webhook integration (GitHub/GitLab style)  
✅ Backend server managing jobs  
✅ PostgreSQL database with persistence  
✅ Queue system for job management  
✅ **4 parallel workers** executing jobs  
✅ **Real-world randomness** simulation  
✅ Comprehensive logging and monitoring  

---

Good luck with your evaluation! 🚀

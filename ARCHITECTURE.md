# 🏗️ PipelineX Architecture Diagram

Complete system architecture showing all components and data flow.

---

## 📐 **High-Level System Architecture**

```
┌─────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL TRIGGERS                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │   GitHub/GitLab  │  │   Manual Trigger │  │   REST API Call  │ │
│  │  (Webhook POST)  │  │   (UI Button)    │  │  (curl/Postman)  │ │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘ │
│           │                     │                      │            │
│           └─────────────────────┼──────────────────────┘            │
│                                 │                                    │
└─────────────────────────────────┼────────────────────────────────────┘
                                  │
                     POST /webhook/:projectId
                                  │
                    ┌─────────────▼─────────────┐
                    │   BACKEND SERVER (5001)   │
                    │   Node.js + Express.js    │
                    └─────────────┬─────────────┘
                                  │
    ┌─────────────────────────────┼─────────────────────────────────┐
    │                             │                                 │
    ▼                             ▼                                 ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  WEBHOOK ROUTE   │      │   JOB RUNNER     │      │  WORKER POOL     │
│ (webhooks.ts)    │      │ (jobRunner.ts)   │      │(workerPool.ts)   │
│                  │      │                  │      │                  │
│ • Receive POST   │      │ • Parse stages   │      │ 4 Parallel       │
│ • Create Pipeline│      │ • Extract jobs   │      │ Workers:         │
│ • Queue jobs     │      │ • Execute stages │      │ • Worker 1       │
│ • Start runner   │      │ • Capture logs   │      │ • Worker 2       │
└────────┬─────────┘      └────────┬─────────┘      │ • Worker 3       │
         │                        │                 │ • Worker 4       │
         └────────────────────────┼─────────────────┤                  │
                                  │                 │ Job Queue:       │
                                  │                 │ • FIFO Queue     │
                          ┌───────▼────────┐        │ • Max 100 jobs   │
                          │ DATABASE (ORM) │        │                  │
                          │  Prisma ORM    │        │ Randomness:      │
                          └────────────────┘        │ • Delays: 200-700ms
                                  ▲                 │ • Runtime: 1-4s  │
                                  │                 │ • Fail: 5%       │
                                  └─────────────────┤                  │
                                                    └──────────────────┘
                                                             │
                                                    ┌────────▼────────┐
                                                    │  SQLite DB      │
                                                    │  (dev.db)       │
                                                    │                 │
                                                    │ Tables:         │
                                                    │ • User          │
                                                    │ • Project       │
                                                    │ • Pipeline      │
                                                    │ • Job           │
                                                    └─────────────────┘
                                                             ▲
                                                             │
                                          ┌──────────────────┴────────────┐
                                          │                               │
                                ┌─────────▼──────────┐      ┌────────────▼──────┐
                                │  FRONTEND (5173)   │      │ Prisma Studio     │
                                │  React + Vite      │      │ (localhost:5555)  │
                                │                    │      │                   │
                                │ Pages:             │      │ • View data       │
                                │ • Dashboard        │      │ • Browse tables   │
                                │ • Project Detail   │      │ • Edit records    │
                                │ • Pipeline Detail  │      │ • See relationships
                                │ • Job Logs         │      │                   │
                                └────────────────────┘      └───────────────────┘
```

---

## 🔄 **Data Flow Diagram**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        REQUEST LIFECYCLE                                    │
└─────────────────────────────────────────────────────────────────────────────┘

STEP 1: WEBHOOK TRIGGERED
┌──────────────────────────────────────────────────────────────────────────┐
│ GitHub/GitLab → POST /webhook/:projectId                                │
│ {                                                                        │
│   "ref": "refs/heads/main",                                            │
│   "repository": { "name": "test-project" },                            │
│   ...webhook payload...                                                │
│ }                                                                       │
└──────────────┬───────────────────────────────────────────────────────────┘
               │
               ▼
STEP 2: BACKEND RECEIVES & PARSES
┌──────────────────────────────────────────────────────────────────────────┐
│ webhooks.ts:                                                            │
│ 1. Extract projectId from URL                                          │
│ 2. Parse branch from webhook payload                                   │
│ 3. Load project config (script, type)                                  │
│ 4. Create Pipeline record in database                                  │
│    {                                                                   │
│      id: "uuid-1",                                                    │
│      projectId: "proj-123",                                           │
│      status: "pending",                                               │
│      triggerType: "webhook",                                          │
│      branch: "main",                                                  │
│      createdAt: now()                                                 │
│    }                                                                   │
│ 5. Extract stages from project script                                 │
│ 6. Queue jobs (async, non-blocking)                                   │
│ 7. Return 200 OK with pipelineId                                      │
└──────────────┬───────────────────────────────────────────────────────────┘
               │
               ▼
STEP 3: JOBS CREATED IN DATABASE
┌──────────────────────────────────────────────────────────────────────────┐
│ For each stage in pipeline script, create Job:                         │
│                                                                        │
│ Job 1: {                                                              │
│   id: "job-1",                                                       │
│   pipelineId: "uuid-1",                                              │
│   stageName: "Git Checkout",                                         │
│   status: "pending",                                                 │
│   createdAt: now()                                                   │
│ }                                                                     │
│                                                                       │
│ Job 2: {                                                             │
│   id: "job-2",                                                      │
│   pipelineId: "uuid-1",                                             │
│   stageName: "Execute shell",                                       │
│   status: "pending",                                                │
│   createdAt: now()                                                  │
│ }                                                                    │
└──────────────┬───────────────────────────────────────────────────────────┘
               │
               ▼
STEP 4: JOB RUNNER PICKS UP JOBS
┌──────────────────────────────────────────────────────────────────────────┐
│ jobRunner.ts: startPipeline(pipelineId)                                 │
│ 1. Fetch all jobs for pipeline from database                           │
│ 2. Update Pipeline status: pending → running                           │
│ 3. For each job:                                                       │
│    - Update Job status: pending → running                              │
│    - Queue to worker pool                                              │
│    - startedAt = now()                                                 │
│ 4. Wait for all jobs to complete                                       │
│ 5. Update Pipeline status: running → success/failed                    │
│ 6. endedAt = now()                                                     │
└──────────────┬───────────────────────────────────────────────────────────┘
               │
               ▼
STEP 5: WORKER POOL EXECUTES JOBS (4 PARALLEL WORKERS)
┌──────────────────────────────────────────────────────────────────────────┐
│ workerPool.ts: executeJob()                                             │
│                                                                        │
│ Worker Queue:                                                         │
│ ┌─────────────┐                                                       │
│ │ Job 1 (Git) │ ← Ready to execute                                    │
│ │ Job 2 (Sh)  │ ← Ready to execute                                    │
│ │ Job 3 (Git) │ ← Ready to execute                                    │
│ │ Job 4 (Git) │ ← Ready to execute                                    │
│ └─────────────┘                                                       │
│       ↓ ↓ ↓ ↓                                                         │
│  ┌────┴─┴─┴─┴────────────────────────────────────────────┐          │
│  │ Load Balance to Available Workers                      │          │
│  └────┬─┬─┬─┬────────────────────────────────────────────┘          │
│       │ │ │ │                                                        │
│   ┌───▼─┼─┼─┴───────────────────────────────────────────┐           │
│   │  WORKER 1        WORKER 2       WORKER 3      WORKER 4          │
│   │  Git Checkout    Execute shell  Build image   Deploy            │
│   │  ┌────────────┐  ┌────────────┐ ┌──────────┐  ┌─────────┐     │
│   │  │ Executing  │  │ Executing  │ │ Executing│  │ Pending │     │
│   │  │ (2.3s)     │  │ (1.7s)     │ │ (2.8s)   │  │         │     │
│   │  └────────────┘  └────────────┘ └──────────┘  └─────────┘     │
│   │                                                                  │
│   │ Each Worker:                                                    │
│   │ 1. Random delay: 200-700ms                                      │
│   │ 2. Execute job command (sh script)                              │
│   │ 3. Capture stdout/stderr in real-time                           │
│   │ 4. Random execution: 1-4 seconds                                │
│   │ 5. 5% chance of random failure                                  │
│   │ 6. Update Job in database:                                      │
│   │    - logs: "captured output"                                    │
│   │    - status: success/failed                                     │
│   │    - endedAt: now()                                             │
│   │                                                                  │
│   └──────────────────────────────────────────────────────────────┘  │
└──────────────┬───────────────────────────────────────────────────────────┘
               │
               ▼
STEP 6: DATABASE UPDATED WITH RESULTS
┌──────────────────────────────────────────────────────────────────────────┐
│ Job records updated in database:                                       │
│                                                                        │
│ Job 1: {                                                              │
│   id: "job-1",                                                       │
│   status: "success",  ← Updated!                                     │
│   logs: "[GIT] Cloned repo...",  ← Updated!                          │
│   startedAt: "2026-04-29T14:32:45.123Z",  ← Updated!                 │
│   endedAt: "2026-04-29T14:32:47.464Z"  ← Updated!                    │
│ }                                                                     │
│                                                                       │
│ Pipeline record updated:                                             │
│ {                                                                    │
│   id: "uuid-1",                                                     │
│   status: "success",  ← Updated!                                    │
│   endedAt: "2026-04-29T14:32:50.000Z"  ← Updated!                   │
│ }                                                                    │
└──────────────┬───────────────────────────────────────────────────────────┘
               │
               ▼
STEP 7: FRONTEND DISPLAYS RESULTS (POLLING)
┌──────────────────────────────────────────────────────────────────────────┐
│ Frontend polls every 3 seconds:                                       │
│ GET /api/projects → GET /api/pipelines/:id → GET /api/jobs/:id       │
│                                                                       │
│ Dashboard shows:                                                     │
│ ┌─────────────────────────────────────────────┐                     │
│ │ project3  [✅] [☀️]  "14 sec"               │ ← Status updated!   │
│ │                "2 sec ago"                  │ ← Duration shown!   │
│ └─────────────────────────────────────────────┘                     │
│                                                                      │
│ Project Detail shows:                                               │
│ ┌─────────────────────────────────────────────┐                    │
│ │ Build History                               │                    │
│ │ [✅] #26 - Success - 14s - 2:58 PM ← NEW! │                    │
│ │ [✅] #25 - Success - 9s  - 2:45 PM        │                    │
│ │ [❌] #24 - Failed  - 8s  - 2:15 PM        │                    │
│ └─────────────────────────────────────────────┘                    │
│                                                                     │
│ Pipeline Detail shows:                                             │
│ ┌─────────────────────────────────────────────┐                   │
│ │ Stages:                                      │                   │
│ │ ✅ Git Checkout        14ms                │                   │
│ │ ✅ Execute shell       2.3s                 │                   │
│ │ ✅ Build image         1.8s                 │                   │
│ │ ✅ Deploy              2.1s                 │                   │
│ └─────────────────────────────────────────────┘                   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 **Component Interaction Diagram**

```
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND COMPONENTS                            │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ webhooks.ts (Route Handler)                                         │
│                                                                      │
│ POST /webhook/:projectId                                            │
│   ├─→ Parse request body                                            │
│   ├─→ Validate projectId exists                                     │
│   ├─→ Create Pipeline record                                        │
│   ├─→ Extract stages from project script                            │
│   ├─→ Create Job records for each stage                             │
│   ├─→ Call startPipeline(pipelineId)  [ASYNC]                      │
│   └─→ Return { pipelineId, branch }                                 │
│                                                                      │
└────────────────────┬──────────────────────────────────────────────┘
                     │ calls startPipeline()
                     ▼
┌──────────────────────────────────────────────────────────────────────┐
│ jobRunner.ts (Pipeline Manager & Scheduler)                         │
│                                                                      │
│ startPipeline(pipelineId):                                          │
│   ├─→ Fetch pipeline from database                                  │
│   ├─→ Fetch all jobs for pipeline                                   │
│   ├─→ Update Pipeline.status = "running"                            │
│   │                                                                 │
│   ├─→ FOR EACH JOB (sequentially):                                  │
│   │    ├─→ Update Job.status = "running"                            │
│   │    ├─→ Update Job.startedAt = now()                             │
│   │    ├─→ Queue to workerPool                                      │
│   │    ├─→ WAIT for job to complete (polling database)              │
│   │    ├─→ Update Job.logs, Job.endedAt                             │
│   │    └─→ IF failed, update Pipeline.status = "failed" & STOP      │
│   │                                                                 │
│   └─→ Update Pipeline.status = "success"                            │
│   └─→ Update Pipeline.endedAt = now()                               │
│                                                                      │
└────────────────────┬──────────────────────────────────────────────┘
                     │ queues jobs
                     ▼
┌──────────────────────────────────────────────────────────────────────┐
│ workerPool.ts (4 Parallel Workers + Queue)                          │
│                                                                      │
│ ┌─────────────────────────────────────┐                             │
│ │ Job Queue (FIFO)                    │                             │
│ │ [Job1, Job2, Job3, Job4, Job5, ...] │                             │
│ └────────────────────┬────────────────┘                             │
│                      │ Distribute to available workers              │
│   ┌──────────────────┼──────────────────┬──────────────┐           │
│   │                  │                  │              │           │
│   ▼                  ▼                  ▼              ▼           │
│ ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌──────────┐     │
│ │ WORKER 1  │   │ WORKER 2  │   │ WORKER 3  │   │ WORKER 4 │     │
│ ├───────────┤   ├───────────┤   ├───────────┤   ├──────────┤     │
│ │ Executing │   │ Executing │   │ IDLE      │   │ IDLE     │     │
│ │ Job1      │   │ Job2      │   │ (waiting) │   │ (waiting)│     │
│ │ 2.3s      │   │ 1.7s      │   └───────────┘   └──────────┘     │
│ └───────────┘   └───────────┘                                     │
│                                                                    │
│ executeJob(job):                                                   │
│   1. Random delay: sleep(random 200-700ms)                        │
│   2. Log: "[WORKER X] Executing: {job.stageName}"                 │
│   3. Execute shell command from job                              │
│   4. Capture stdout/stderr                                        │
│   5. Random execution time: 1-4 seconds                           │
│   6. 5% random failure chance                                     │
│   7. Update database:                                             │
│      - job.status = success/failed                                │
│      - job.logs = captured output                                 │
│      - job.endedAt = now()                                        │
│   8. Remove job from queue                                        │
│   9. Pick next job from queue                                     │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
                     │ writes to
                     ▼
┌──────────────────────────────────────────────────────────────────────┐
│ db.ts (Prisma ORM - Database Interface)                             │
│                                                                      │
│ Read Operations:                                                     │
│   - getProject(id)                                                   │
│   - getPipeline(id)                                                  │
│   - getJobs(pipelineId)                                              │
│                                                                      │
│ Write Operations:                                                    │
│   - createPipeline(data)                                             │
│   - createJob(data)                                                  │
│   - updateJob(id, { status, logs, startedAt, endedAt })             │
│   - updatePipeline(id, { status, endedAt })                         │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
                     │ stores/retrieves
                     ▼
┌──────────────────────────────────────────────────────────────────────┐
│ SQLite Database (dev.db)                                            │
│                                                                      │
│ Tables:                                                              │
│ ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│ │ User             │  │ Project          │  │ Pipeline         │   │
│ ├──────────────────┤  ├──────────────────┤  ├──────────────────┤   │
│ │ id (PK)          │  │ id (PK)          │  │ id (PK)          │   │
│ │ name             │  │ userId (FK)      │  │ projectId (FK)   │   │
│ │ email            │  │ name             │  │ status           │   │
│ │ password_hash    │  │ type             │  │ triggerType      │   │
│ └──────────────────┘  │ script           │  │ startedAt        │   │
│                       │ repoUrl          │  │ endedAt          │   │
│                       │ parentId (FK)    │  │ createdAt        │   │
│                       └──────────────────┘  └──────────────────┘   │
│                                                                      │
│ ┌──────────────────┐                                                │
│ │ Job              │                                                │
│ ├──────────────────┤                                                │
│ │ id (PK)          │                                                │
│ │ pipelineId (FK)  │                                                │
│ │ stageName        │                                                │
│ │ status           │                                                │
│ │ logs (TEXT)      │                                                │
│ │ startedAt        │                                                │
│ │ endedAt          │                                                │
│ │ createdAt        │                                                │
│ └──────────────────┘                                                │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 **Frontend Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│              FRONTEND (React + TypeScript + Vite)               │
│                   Runs on localhost:5173                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ App.tsx (Main Router)                                                │
│                                                                      │
│ Routes:                                                              │
│ ├─→ /login                → Login.tsx                               │
│ ├─→ /register             → Register.tsx                            │
│ ├─→ /                      → Dashboard.tsx                          │
│ ├─→ /project/:id          → ProjectDetail.tsx                       │
│ ├─→ /pipeline/:id         → PipelineDetail.tsx                      │
│ ├─→ /new                  → NewItem.tsx                             │
│ ├─→ /build-history        → BuildHistory.tsx                        │
│ └─→ /manage-nodes         → ManageNodes.tsx                         │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ Dashboard.tsx (Main Overview)                                        │
│                                                                      │
│ Features:                                                            │
│ • Fetch projects from API every 3 seconds                            │
│ • Display projects table with:                                       │
│   - Status icon (⚙️ ✅ ❌ ⊘)                                         │
│   - Weather icon (☀️ ⛅ 🌧️ ⛈️)                                        │
│   - Last Success / Last Failure timestamps                           │
│   - Duration of last build                                           │
│   - Play button [▶️] to trigger webhook                              │
│ • Click project name → ProjectDetail                                 │
│ • Click [▶️] → Trigger webhook & navigate to PipelineDetail         │
│                                                                      │
│ Auto-refresh: setInterval(fetchProjects, 3000)                       │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ ProjectDetail.tsx (Build History)                                    │
│                                                                      │
│ Features:                                                            │
│ • Fetch single project & all pipelines every 3 seconds               │
│ • Display:                                                           │
│   - Project name & status                                            │
│   - List of all pipeline executions (builds)                         │
│   - Each build shows: status, duration, timestamp                    │
│ • Click build number → PipelineDetail                                │
│ • [▶️] RUN button → Trigger new webhook                              │
│                                                                      │
│ Auto-refresh: setInterval(fetchData, 3000)                           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ PipelineDetail.tsx (Job Stages & Logs)                               │
│                                                                      │
│ Two-Column Layout:                                                   │
│                                                                      │
│ LEFT: Stage List              │  RIGHT: Console Output               │
│ ┌─────────────────────────┐   │  ┌──────────────────────┐           │
│ │ Stages                  │   │  │ Terminal Output      │           │
│ ├─────────────────────────┤   │  ├──────────────────────┤           │
│ │ ✅ Git Checkout         │   │  │ [GIT] Starting...    │           │
│ │ ✅ Build                │◄──┼─→│ [GIT] Cloning...     │           │
│ │ ⚙️  Test                │   │  │ [GIT] ✅ Done (2.3s) │           │
│ │ ⊘  Deploy               │   │  │                      │           │
│ └─────────────────────────┘   │  │ (Click stage to see  │           │
│                               │  │  its logs)           │           │
│ Features:                       │  │                      │           │
│ • Fetch jobs every 2 seconds    │  │ Auto-scroll to      │           │
│ • Click stage → show its logs   │  │ latest log entry    │           │
│ • Status icons update in real-  │  │                     │           │
│   time as worker executes       │  │ AI Assistant:       │           │
│                                 │  │ (Analyzes failures) │           │
│                                 │  └──────────────────────┘           │
│                                                                      │
│ Auto-refresh: setInterval(fetchJobs, 2000)                          │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ API Integration (api.ts)                                             │
│                                                                      │
│ GET  /api/projects                  → Fetch all projects             │
│ GET  /api/projects/:id              → Fetch single project           │
│ GET  /api/pipelines/:id             → Fetch all pipelines (builds)   │
│ GET  /api/jobs/:pipelineId          → Fetch jobs for pipeline        │
│                                                                      │
│ POST /webhook/:projectId            → Trigger pipeline (webhook)    │
│ POST /api/projects                  → Create new project             │
│ POST /api/jobs/ai-analyze           → Analyze logs with AI           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 **Worker Pool Execution Flow**

```
┌──────────────────────────────────────────────────────────────────┐
│        WORKER POOL: 4 PARALLEL WORKERS WITH RANDOMNESS          │
└──────────────────────────────────────────────────────────────────┘

TIME → ═════════════════════════════════════════════════════════════

  0ms  ┌─────────────────────────────────────────────────────────┐
       │ 🚀 [PIPELINE START] Starting pipeline abc123...        │
       │ 📋 [JOB QUEUED] "Git Checkout" - Queue size: 1         │
       │ 📋 [JOB QUEUED] "Execute shell" - Queue size: 2        │
       └─────────────────────────────────────────────────────────┘

 200ms ┌─────────────────────────────────────────────────────────┐
       │ 👷 [WORKER 1] Executing: "Git Checkout"                │
       │    (Random delay completed, starting execution)         │
       └─────────────────────────────────────────────────────────┘

 450ms ┌─────────────────────────────────────────────────────────┐
       │ 👷 [WORKER 2] Executing: "Execute shell"               │
       │ 👷 [WORKER 1] Still executing... (1.85s elapsed)        │
       │    (Workers are parallel!)                              │
       └─────────────────────────────────────────────────────────┘

 700ms ┌─────────────────────────────────────────────────────────┐
       │ 👷 [WORKER 1] Still executing... (2.5s elapsed)        │
       │ 👷 [WORKER 2] Still executing... (1.25s elapsed)        │
       └─────────────────────────────────────────────────────────┘

1600ms ┌─────────────────────────────────────────────────────────┐
       │ ✅ [WORKER 2] SUCCESS: "Execute shell" (1715ms)         │
       │    Job updated in database:                             │
       │    - logs: captured output                              │
       │    - status: success                                    │
       │    - endedAt: 1626ms                                    │
       │ 👷 [WORKER 2] Picks next job from queue (if any)       │
       └─────────────────────────────────────────────────────────┘

2341ms ┌─────────────────────────────────────────────────────────┐
       │ ✅ [WORKER 1] SUCCESS: "Git Checkout" (2341ms)          │
       │    ← Different execution time than Worker 2!            │
       │    Job updated in database                              │
       └─────────────────────────────────────────────────────────┘

2341ms ┌─────────────────────────────────────────────────────────┐
       │ 📊 [WORKER POOL STATUS]                                 │
       │    Total Workers: 4                                     │
       │    Busy: 0/4                                            │
       │    Queue Size: 0                                        │
       │    ───────────────────                                  │
       │    Worker 1: IDLE (Completed: 1)                        │
       │    Worker 2: IDLE (Completed: 1)                        │
       │    Worker 3: IDLE (Completed: 0)                        │
       │    Worker 4: IDLE (Completed: 0)                        │
       │                                                         │
       │ 🎉 [PIPELINE SUCCESS] Pipeline abc123... completed!     │
       └─────────────────────────────────────────────────────────┘


RANDOMNESS DEMONSTRATED:
═════════════════════════

✅ RANDOM EXECUTION TIMES (1-4 seconds per job):
   Worker 1: 2341ms
   Worker 2: 1715ms   ← Different!
   Worker 3: 2888ms   ← Different!
   Worker 4: 1450ms   ← Different!

✅ RANDOM DELAYS (200-700ms before execution):
   Worker 1: 200ms delay
   Worker 2: 450ms delay   ← Different!
   Worker 3: 320ms delay   ← Different!
   Worker 4: 670ms delay   ← Different!

✅ RANDOM FAILURES (5% chance per job):
   Most pipelines: ✅ Success
   ~5% of pipelines: ❌ Failed randomly
   
✅ PARALLEL EXECUTION:
   Multiple workers executing simultaneously
   Queue manages jobs when all workers busy
```

---

## 📈 **Queue Management Flow**

```
┌──────────────────────────────────────────────────────────────┐
│              QUEUE MANAGEMENT (FIFO)                         │
└──────────────────────────────────────────────────────────────┘

SCENARIO: 7 Jobs, 4 Workers

INITIAL STATE:
┌─────────────────────────────────────────────────────┐
│ Job Queue: [J1, J2, J3, J4, J5, J6, J7]            │
│ All queued, no workers available yet                │
└─────────────────────────────────────────────────────┘

IMMEDIATE (0-100ms):
┌─────────────────────────────────────────────────────┐
│ Job Queue: [J5, J6, J7]                             │
│                                                     │
│ Worker 1: Executing J1                              │
│ Worker 2: Executing J2                              │
│ Worker 3: Executing J3                              │
│ Worker 4: Executing J4                              │
│                                                     │
│ (3 jobs waiting in queue)                           │
└─────────────────────────────────────────────────────┘

AFTER 2 SECONDS (One worker finishes):
┌─────────────────────────────────────────────────────┐
│ Job Queue: [J6, J7]                                 │
│                                                     │
│ Worker 1: IDLE (just completed J1) ← FREE!         │
│           Picks up J5 from queue                    │
│ Worker 2: Still executing J2                        │
│ Worker 3: Still executing J3                        │
│ Worker 4: Still executing J4                        │
│                                                     │
│ (2 jobs still waiting)                              │
└─────────────────────────────────────────────────────┘

AFTER 4 SECONDS (Two more workers finish):
┌─────────────────────────────────────────────────────┐
│ Job Queue: []  ← EMPTY!                             │
│                                                     │
│ Worker 1: Still executing J5                        │
│ Worker 2: IDLE (completed J2)                       │
│           Picks up J6 from queue                    │
│ Worker 3: IDLE (completed J3)                       │
│           Picks up J7 from queue                    │
│ Worker 4: Still executing J4                        │
│                                                     │
│ (All jobs assigned!)                                │
└─────────────────────────────────────────────────────┘

FINAL STATE (All complete):
┌─────────────────────────────────────────────────────┐
│ Job Queue: []                                       │
│                                                     │
│ Worker 1: IDLE (Completed: J1, J5)                 │
│ Worker 2: IDLE (Completed: J2, J6)                 │
│ Worker 3: IDLE (Completed: J3, J7)                 │
│ Worker 4: IDLE (Completed: J4)                     │
│                                                     │
│ 🎉 All jobs complete!                              │
└─────────────────────────────────────────────────────┘
```

---

## 📊 **Database Schema (Entity Relationship Diagram)**

```
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE SCHEMA                          │
└─────────────────────────────────────────────────────────────┘

           ┌──────────────┐
           │    User      │
           ├──────────────┤
           │ id (PK)      │
           │ name         │
           │ email        │
           │ password_hash│
           │ createdAt    │
           │ updatedAt    │
           └──────┬───────┘
                  │ 1:Many
                  │
                  ▼
        ┌──────────────────────┐
        │     Project          │
        ├──────────────────────┤
        │ id (PK)              │
        │ userId (FK)  ────────┼─→ User
        │ name                 │
        │ type                 │
        │ repoUrl              │
        │ script               │
        │ parentId (FK)  ┐     │
        │ createdAt      │     │
        │ updatedAt      │     │
        │                │     │
        └──────┬─────────┘     │
               │1:Many         │
               │ (nested)    ──┘ (self-reference for folders)
               │
               ▼
        ┌──────────────────────┐
        │     Pipeline         │
        ├──────────────────────┤
        │ id (PK)              │
        │ projectId (FK) ──────┼─→ Project
        │ status               │
        │ triggerType          │
        │ startedAt            │
        │ endedAt              │
        │ createdAt            │
        │ updatedAt            │
        │                      │
        └──────┬───────────────┘
               │ 1:Many
               │
               ▼
        ┌──────────────────────┐
        │       Job            │
        ├──────────────────────┤
        │ id (PK)              │
        │ pipelineId (FK) ─────┼─→ Pipeline
        │ stageName            │
        │ status               │
        │ logs (TEXT)          │
        │ startedAt            │
        │ endedAt              │
        │ createdAt            │
        │ updatedAt            │
        └──────────────────────┘


RELATIONSHIPS:
══════════════

User (1) ──→ (Many) Project
  User can own many projects

Project (1) ──→ (Many) Pipeline
  Project can have many pipeline runs

Project (1) ──→ (Many) Project (self-reference for nested folders)
  Projects can be nested (folders contain projects)

Pipeline (1) ──→ (Many) Job
  Each pipeline run creates multiple jobs (stages)

DATA FLOW:
══════════

1. User creates Project
   → User.id → Project.userId
   → Project stored in database

2. Webhook triggers Project
   → Pipeline created with Project.id
   → Pipeline.projectId references Project

3. Pipeline execution creates Jobs
   → For each stage, create Job with Pipeline.id
   → Job.pipelineId references Pipeline

4. Worker executes Job
   → Job updated with logs, status, timestamps
   → Database stores results
   → Data persists forever
```

---

## 🚀 **Request/Response Flow**

```
┌─────────────────────────────────────────────────────────────┐
│         HTTP REQUEST/RESPONSE FLOW                          │
└─────────────────────────────────────────────────────────────┘

1️⃣  FRONTEND TRIGGERS PIPELINE
    ─────────────────────────────

    Frontend (React)
    │
    ├─→ Button click: handleTrigger(projectId)
    │
    ├─→ HTTP POST
    │   POST /webhook/:projectId
    │   Content-Type: application/json
    │   Body: { "ref": "refs/heads/main" }
    │
    └─→ Response: 200 OK
        {
          "message": "Pipeline triggered successfully",
          "pipelineId": "abc-123-def",
          "branch": "main"
        }


2️⃣  FRONTEND POLLS FOR UPDATES
    ──────────────────────────

    setInterval every 3 seconds:
    
    GET /api/projects
    ↓
    Response: Array of projects with:
    - id, name, type
    - pipelines: [ { id, status, startedAt, endedAt } ]
    
    GET /api/projects/:id
    ↓
    Response: Single project with full details
    
    GET /api/jobs/:pipelineId
    ↓
    Response: Array of jobs with:
    - id, stageName, status, logs, startedAt, endedAt


3️⃣  FRONTEND DISPLAYS LIVE DATA
    ───────────────────────────

    Dashboard:
    - Shows status icon (⚙️ running or ✅ success)
    - Shows duration
    
    Project Detail:
    - Shows all past builds
    - Build history with durations
    
    Pipeline Detail:
    - Shows all stages (left)
    - Shows logs for selected stage (right)
    - Auto-refresh every 2 seconds
```

---

## 📋 **Key Design Decisions**

```
┌─────────────────────────────────────────────────────────────┐
│         ARCHITECTURE DESIGN DECISIONS                       │
└─────────────────────────────────────────────────────────────┘

✅ 4 PARALLEL WORKERS
   ├─ Not 1 worker (no parallelism)
   ├─ Not unlimited (resource management)
   └─ 4 is optimal for CI/CD simulation

✅ FIFO QUEUE
   ├─ Simple, fair job distribution
   ├─ No job starvation
   └─ Easy to understand

✅ DATABASE-FIRST DESIGN
   ├─ All state in database (persistent)
   ├─ Workers are stateless (can be killed anytime)
   ├─ Easy recovery from crashes
   └─ Audit trail of all jobs

✅ REAL-TIME LOGGING
   ├─ Workers capture stdout/stderr
   ├─ Logs stored in database immediately
   ├─ Frontend polls for live updates
   └─ Better debugging experience

✅ RANDOMNESS FOR REALISM
   ├─ Random delays (200-700ms)
   ├─ Random execution times (1-4s)
   ├─ 5% random failure rate
   ├─ Simulates real CI/CD variability
   └─ Proves non-deterministic behavior

✅ WEBHOOK TRIGGER
   ├─ Simulates GitHub/GitLab webhooks
   ├─ Can be triggered via curl/API
   ├─ Asynchronous (returns immediately)
   └─ Real-world simulation

✅ FRONTEND POLLING
   ├─ Simple REST API calls
   ├─ No WebSockets needed
   ├─ Works with any backend
   ├─ Frontend refreshes every 3 seconds
   └─ Trade-off: slight delay vs simplicity

✅ TYPESCRIPT + NODE.JS
   ├─ Type safety
   ├─ Fast execution
   ├─ Great tooling
   └─ Easy to extend

✅ PRISMA ORM
   ├─ Type-safe database queries
   ├─ Auto-migrations
   ├─ Great developer experience
   └─ Works with SQLite/PostgreSQL
```

---

## 📞 **Summary Table**

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Webhook** | Express.js Route | Receives triggers from GitHub/GitLab |
| **Job Runner** | Node.js Service | Orchestrates job execution |
| **Worker Pool** | 4x Parallel Workers | Executes jobs with randomness |
| **Database** | SQLite + Prisma | Persistent storage of jobs/logs |
| **Frontend** | React + TypeScript | Real-time UI with polling |
| **Queue** | In-memory Array (FIFO) | Buffers jobs when workers busy |

---

This is the complete **PipelineX Architecture**! 🚀


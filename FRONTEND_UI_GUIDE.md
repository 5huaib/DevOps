# 🎨 Frontend UI Guide - Where to See Worker Simulation

This guide shows you **exactly where in the frontend UI** you can observe the effects of worker simulation in real-time.

---

## 📍 Navigation Map

```
http://localhost:5173 (Dashboard)
    ↓
    ├─→ Click Play Button [▶️] → Triggers Webhook
    │
    ├─→ Click Project Name → Project Detail Page
    │    ├─→ Shows Build History (all past executions)
    │    └─→ Click Build #X → Pipeline Execution Detail
    │         ├─→ LEFT: Stages (Job List)
    │         └─→ RIGHT: Console Output (Logs)
    │
    └─→ Auto-refresh every 3 seconds
```

---

## 🎯 **Screen 1: Dashboard (Main Overview)**

**URL:** `http://localhost:5173`

**What You See:**
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ All  [+]                                                            ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ S  W    Name        Last Success  Last Failure  Duration       [▶]  ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ ⚙️  ☀️  project3    2 sec ago     N/A           In progress    [▶️]  ┃ ← WORKER RUNNING
┃ ✅ ☀️  newProject  45 sec ago    N/A           14 sec         [▶️]  ┃ ← WORKER COMPLETED
┃ ❌ ⛈️  testProject 1 day ago     30 min ago    5 sec          [▶️]  ┃ ← WORKER FAILED
┃ ⊘  ⊘  emptyProj   N/A           N/A           N/A            [▶️]  ┃ ← NEVER BUILT
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### **What Each Column Shows (Worker Results):**

#### **Column 1: S (Status Icon)**
```
⚙️  = Running (Worker currently executing jobs)
✅ = Success (Worker completed all jobs successfully)
❌ = Failed  (Worker encountered an error)
⊘  = Not Built (Never triggered)
```
**→ Click to navigate to Project Detail**

#### **Column 2: W (Weather Icon)**
```
☀️  = Sunny/Healthy    (>80% success rate historically)
⛅ = Partly Cloudy    (60-80% success rate)
🌧️  = Rainy/Unhealthy (20-60% success rate)
⛈️  = Stormy/Failing   (<20% success rate)
```
**→ Shows historical health based on past worker executions**

#### **Column 3: Name**
- Project name (clickable link)
- **→ Shows which project the worker was assigned to**

#### **Column 4: Last Success**
```
"45 sec ago" = Worker finished successfully 45 seconds ago
"N/A"        = Worker has never succeeded for this project
```
**→ Timestamp of most recent successful worker completion**

#### **Column 5: Last Failure**
```
"30 min ago" = Worker encountered failure 30 minutes ago
"N/A"        = Worker has never failed for this project
```
**→ Timestamp of most recent worker failure**

#### **Column 6: Duration**
```
"14 sec"     = Worker took 14 seconds to complete all jobs
"In progress" = Worker currently executing (time still running)
```
**→ Total time from first job start to last job completion**

#### **Column 7: Play Button [▶️]**
```
Click to trigger a NEW pipeline
→ New webhook request sent to backend
→ Worker pool queues jobs
→ Dashboard refreshes, status changes ⚙️
→ After 10-20 seconds, status changes ✅ or ❌
```

### **Live Demo: Watch Status Change**

1. **Click play button [▶️]** next to any project
2. **Watch the "S" column** for that project
3. **You'll see:** ⊘ → ⚙️ (running) → ✅ (success) OR ❌ (failed)
4. **Duration column** will show "In progress" then change to seconds
5. **Last Success** will update to "1 sec ago" (if successful)

---

## 🎯 **Screen 2: Project Detail (Build History)**

**URL:** `http://localhost:5173/project/[PROJECT_ID]`

**How to get here:**
- From Dashboard, click any project name

**What You See:**
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ ← Project: project3                                         [▶️ RUN] ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ Status: ⚙️ Running                                                   ┃
┃ Last Build: Build #24 (2023-12-15 14:32:45)                       ┃
┃                                                                      ┃
┃ 📋 Build History                                                    ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ [✅] #26 - Success   - 12s - 2:58 PM ◄ Most recent                 ┃
┃ [✅] #25 - Success   - 9s  - 2:45 PM                               ┃
┃ [❌] #24 - Failed    - 8s  - 2:15 PM ◄ Failed build                ┃
┃ [✅] #23 - Success   - 15s - 1:52 PM                               ┃
┃ [⚙️]  #22 - Running   - ... - 1:15 PM ◄ Currently running           ┃
┃ [✅] #21 - Success   - 11s - 12:45 PM                              ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### **What This Shows About Worker Simulation:**

| Element | What It Means |
|---------|--------------|
| **Multiple Build Records** | Each = one pipeline execution from worker pool |
| **Variable Durations** (12s, 9s, 8s, 15s, 11s) | **Randomness**: Each worker run takes different time |
| **Mix of ✅ and ❌** | **Failure Simulation**: Some builds randomly fail (~5%) |
| **Timestamps** | **Persistence**: Data stored in database, survives restarts |
| **"Running" Status** | **Currently Executing**: Worker actively running jobs |
| **Status Icons** | **Job Completion**: Shows which worker completed/failed |

### **Key Point to Show Evaluator:**

```
"Notice the durations: 12s, 9s, 8s, 15s, 11s
None of them are the same!
This is because each worker has:
- Random execution time per job (1-4 seconds)
- Random delay between jobs (200-700ms)
- 5% chance of random failure

So every build takes a different amount of time - just like real CI/CD!"
```

### **Click to See Details:**
- **Click any build** (e.g., "#26") → See Pipeline Execution Detail
- Shows individual job stages and logs from that worker run

---

## 🎯 **Screen 3: Pipeline Execution Detail (Job Stages & Logs)**

**URL:** `http://localhost:5173/pipeline/[PIPELINE_ID]`

**How to get here:**
- From Project Detail, click any build number
- OR from Dashboard, click play button [▶️] (auto-navigates here)

**Layout: Two-Column View**

```
┏━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  LEFT: STAGES   ┃          RIGHT: CONSOLE OUTPUT             ┃
┣━━━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ Stages          ┃ Terminal: Git Checkout                    ┃
┃ ─────────────── ┃ ────────────────────────────────────────  ┃
┃ ✅ Git Checkout ┃ [GIT] Cloning repository...               ┃
┃ ✅ Build       ┃ [GIT] Checking out main branch...          ┃
┃ ⚙️  Test       ┃ [GIT] ✅ Checkout completed (1234ms)       ┃
┃ ⊘  Deploy      ┃                                             ┃
┃                 ┃ (Click "Test" to see its logs)             ┃
┃                 ┃                                             ┃
┃ 📊 Status:      ┃                                             ┃
┃ ⚙️ Running      ┃                                             ┃
┗━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### **LEFT: Stages List (Jobs)**

Shows all jobs in the pipeline:
```
✅ Git Checkout     ← Worker 1 completed this successfully
✅ Build            ← Worker 2 completed this successfully  
⚙️  Test            ← Worker 3 currently executing
⊘  Deploy           ← Not started yet (waiting in queue)
```

**What This Proves About Worker Simulation:**
- Each stage executed by a worker
- Different completion status (✅ success, ⚙️ running, ⊘ pending)
- Jobs complete in order (Pipeline Manager controls sequencing)

### **RIGHT: Console Output (Logs)**

When you **click a stage**, you see its logs:
```
Terminal: Git Checkout
────────────────────────────────────────
[GIT] Cloning repository...
[GIT] Checking out main branch...
[GIT] ✅ Checkout completed (1234ms)
```

**What This Proves About Worker Simulation:**
- **Captured Output**: Worker captured real execution output
- **Timestamps**: Shows execution duration (1234ms = 1.2 seconds)
- **Status Icons**: Shows completion status (✅ success)
- **Real Logs**: Not fake data - actual job execution output

### **Auto-refresh During Execution:**

If you're watching while a job is running:
```
Time 0s:
[TEST] Running test suite...

Time 2s (auto-refresh):
[TEST] Test case 1: PASS
[TEST] Test case 2: PASS

Time 4s (auto-refresh):
[TEST] Test case 3: PASS
[TEST] ✅ All tests passed (2847ms)
```

**Point Out:**
```
"The logs are updating in real-time!
The frontend polls every 2 seconds for new log data.
This proves the worker is executing and updating the database in real-time."
```

---

## 🔄 **How to See Multiple Workers in Action**

### **Scenario: Trigger 4 Pipelines Simultaneously**

**Step 1: Terminal - Trigger 4 pipelines**
```bash
PROJECT_ID="<your-project-id>"
for i in {1..4}; do
  curl -s -X POST http://localhost:5001/webhook/$PROJECT_ID \
    -H "Content-Type: application/json" \
    -d '{"ref": "refs/heads/main"}' > /dev/null
  echo "Pipeline $i triggered"
  sleep 1
done
```

**Step 2: Frontend - Watch Dashboard**
```
After 1 second (first refresh):
┃ ⚙️  project3    ... (Status: Running)
┃ ⊘  project3    ... (Status: Not started yet)
┃ ⊘  project3    ... (Status: Not started yet)
┃ ⊘  project3    ... (Status: Not started yet)

After 3 seconds (second refresh):
┃ ⚙️  project3    ... (Worker 1 running)
┃ ⚙️  project3    ... (Worker 2 running)
┃ ⚙️  project3    ... (Worker 3 running)
┃ ⚙️  project3    ... (Worker 4 running)
       ↑
    All 4 running simultaneously!
```

**Point Out to Evaluator:**
```
"See how all 4 status indicators are ⚙️ (running) at the same time?
That's our 4-worker pool executing jobs in parallel!
If we only had 1 worker, they would be sequential - one at a time.
But here, all 4 are running simultaneously."
```

### **Step 3: Watch Completion Sequence**

After 10-15 seconds:
```
┃ ✅ project3    ... 12 sec  (Worker 1 done)
┃ ✅ project3    ... 11 sec  (Worker 2 done)
┃ ✅ project3    ... 14 sec  (Worker 3 done)
┃ ✅ project3    ... 9 sec   (Worker 4 done)
```

**Notice:**
- All completed with **different durations** (12s, 11s, 14s, 9s)
- This is **randomness** in action
- Duration = time for that worker to execute all jobs for that pipeline

---

## 📊 **Real-time Observation Checklist**

When you trigger a pipeline, watch for these events in the UI:

### **First 2-3 Seconds (Job Queueing):**
- [ ] Dashboard shows status ⚙️ (running)
- [ ] Project Detail shows new build #X with ⚙️
- [ ] Pipeline Detail shows first stages with ⚙️ or ✅

### **Next 5-10 Seconds (Execution):**
- [ ] Console Output shows logs appearing in real-time
- [ ] Different stages show different completion statuses
- [ ] Some stages might show ✅ (completed), others ⚙️ (running)

### **Final 1-2 Seconds (Completion):**
- [ ] All stages show ✅ (success) or ❌ (failed)
- [ ] Dashboard status changes ⚙️ → ✅ or ❌
- [ ] Duration column shows final time (e.g., "14 sec")
- [ ] Last Success updated to "1 sec ago"

### **Randomness Proof:**
- [ ] Run same pipeline multiple times
- [ ] Notice different durations each time
- [ ] Some completions might show ❌ (failure)
- [ ] Different stages sometimes fail randomly

---

## 🎯 **What to Show vs. What Happens Behind the Scenes**

| In Frontend UI | Behind the Scenes (Worker) |
|---|---|
| Status: ⚙️ | Worker pool picked up job, executing on one of 4 workers |
| Status: ✅ | Worker completed job successfully, updated database |
| Duration: "14 sec" | Total time = (job end time - job start time) × number of jobs |
| Logs appearing | Worker executing command, capturing stdout, updating database |
| Multiple ⚙️ | Multiple workers executing different jobs simultaneously |
| Random ❌ | Worker randomly failed (5% failure rate) |
| Different durations | Random execution times per job (1-4 seconds) |

---

## 💡 **Key Points for Evaluator**

### **1. Real-time Status Updates**
```
"The dashboard updates every 3 seconds automatically.
Watch the status icon - it changes as workers progress.
This proves the backend is updating the database in real-time."
```

### **2. Multiple Workers Proof**
```
"When I trigger 4 pipelines at once, you see 4 ⚙️ icons.
Each represents a different worker executing jobs.
If we only had 1 worker, they'd be sequential (one at a time).
But here they're all running - that's parallel execution!"
```

### **3. Randomness Proof**
```
"Look at the durations: 12s, 9s, 14s, 11s
They're all different! This is randomness in action.
Each worker has random delays and execution times.
Every run takes different time - just like real CI/CD."
```

### **4. Data Persistence**
```
"Refresh the page. All the data is still there.
The database stores every build, every job, every log.
Even if the backend crashes, we won't lose this data."
```

### **5. Queue Management**
```
"When all 4 workers are busy, new jobs wait in the queue.
Once a worker finishes, it picks the next job from the queue.
This is visible in the backend logs - jobs progress through the queue."
```

---

## 🚀 **Quick Navigation**

| Want to see... | Where to look | What to expect |
|---|---|---|
| **Real-time status updates** | Dashboard, Status column | Changes ⚙️ → ✅ |
| **Worker execution history** | Project Detail, Build History | List of all runs |
| **Variable execution times** | Project Detail, Build History durations | Different times each run |
| **Actual job logs** | Pipeline Detail, Console tab | Real job output |
| **All 4 workers busy** | Dashboard, trigger 4 pipelines | 4 ⚙️ at same time |
| **Random failures** | Build History or Dashboard | Some ❌ mixed with ✅ |
| **Data persistence** | Refresh page or restart backend | All data still there |

---

**Next:** See `DEMO_GUIDE.md` for step-by-step demo instructions!


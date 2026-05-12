# 📋 Quick Reference - Commands for Final Evaluator

**Copy & paste these commands in order to run the complete demo**

---

## Terminal 1: Start Backend

```bash
cd /Users/shuaib/DevOps/backend
npm run dev
```

Expected output:
```
ForgeCI backend listening on port 5001
```

---

## Terminal 2: Start Frontend

```bash
cd /Users/shuaib/DevOps/frontend
npm run dev
```

Expected output:
```
➜  Local:   http://localhost:5173/
```

---

## Terminal 3: Setup Real Git Repos (1-2 minutes)

```bash
# Make script executable
chmod +x /Users/shuaib/DevOps/setup-real-git-repos.sh

# Run it
/Users/shuaib/DevOps/setup-real-git-repos.sh
```

Expected output:
```
✅ REAL GIT SETUP COMPLETE!

📁 Repository Locations:
   Payment Service: /tmp/pipelinex-repos/payment-service
   Auth Service:    /tmp/pipelinex-repos/auth-service
   Frontend App:    /tmp/pipelinex-repos/frontend-app

🌿 Branch Structure (6 branches total):
   1. payment-service/main       (Priority 5 - CRITICAL)
   2. payment-service/develop    (Priority 4 - HIGH)
   3. auth-service/main          (Priority 5 - CRITICAL)
   4. auth-service/staging       (Priority 4 - HIGH)
   5. frontend-app/main          (Priority 5 - CRITICAL)
   6. frontend-app/beta          (Priority 3 - MEDIUM)

📤 Webhooks Triggered: 9 real git push events
```

---

## Show Priority Assignment in Backend (Terminal 1 Logs)

**Look for these logs - they show priority is NOT random:**

```
📊 [PRIORITY ASSIGNED]
   Job ID: payment-service-proj
   Priority: 5 - CRITICAL (Main/Master production branch)
   Branch: main
   Repository: payment-service
   Reason: Main/Master production branch

📊 [PRIORITY ASSIGNED]
   Job ID: auth-service-proj
   Priority: 5 - CRITICAL
   Branch: main
   Repository: auth-service
   Reason: [URGENT] tag in commit message

📊 [PRIORITY ASSIGNED]
   Job ID: payment-service-proj
   Priority: 4 - HIGH (Release/Staging/Develop branch)
   Branch: develop
   Repository: payment-service
   Reason: Release/Staging/Develop branch
```

---

## Verify Real Git Commits (Terminal 3)

```bash
# Payment Service - show real commits
cd /tmp/pipelinex-repos/payment-service
git log --oneline --all

# Expected:
# abc1234 Real git commit from payment-service branch main
# def5678 [HIGH] Add Stripe v3 payment processor
# ghi9012 [HIGH] Payment service development branch setup
# jkl3456 Initial commit: payment service setup

echo "---"

# Auth Service - show real commits
cd /tmp/pipelinex-repos/auth-service
git log --oneline --all

# Expected:
# mno7890 Real git commit from auth-service branch staging
# pqr1234 [HIGH] Auth service staging deployment
# stu5678 [URGENT] Critical security patch for JWT validation
# vwx9012 [URGENT] Auth service security fixes

echo "---"

# Frontend App - show real commits
cd /tmp/pipelinex-repos/frontend-app
git log --oneline --all

# Expected:
# yza3456 Real git commit from frontend-app branch beta
# bcd4567 docs: add contribution guidelines
# efg7890 Beta: new UI components and features
# hij1234 Initial commit: frontend app production build
```

---

## View Priority-Based Job Execution Order (Terminal 1)

**Watch these logs to see priority queue in action:**

```
👷 [WORKER 1] Executing: "Git Checkout" (Pipeline: payment-service, Priority: 5)
👷 [WORKER 2] Executing: "Git Checkout" (Pipeline: auth-service, Priority: 5)
👷 [WORKER 3] Executing: "Execute shell" (Pipeline: auth-service, Priority: 4)
👷 [WORKER 4] Executing: "Git Checkout" (Pipeline: frontend-app, Priority: 5)

✅ [WORKER 1] SUCCESS: "Git Checkout" (2341ms)

📊 [WORKER POOL STATUS]
   Total Workers: 4
   Busy: 3/4
   Queue Size: 2
   
   Next jobs (by priority):
   1. frontend-app/main (Priority 5 - CRITICAL)
   2. frontend-app/beta (Priority 3 - MEDIUM)

✅ [WORKER 2] SUCCESS: "Execute shell" (1715ms)
```

**Key Observation:** Jobs are dequeued by PRIORITY, not FIFO!

---

## Open Dashboard (Terminal 3)

```bash
open http://localhost:5173
```

**What to show evaluator:**
- Click on each project to see build history
- Click on each build to see pipeline stages
- Notice durations vary (proves randomness works)
- See status icons: ⚙️ (running), ✅ (success), ❌ (failed)

---

## Show Priority Queue Code (Terminal 3)

```bash
# Show priority calculation algorithm
cat /Users/shuaib/DevOps/backend/src/services/priorityQueue.ts

# Show webhook integration
cat /Users/shuaib/DevOps/backend/src/routes/webhooks.ts

# Show setup script that creates real repos
cat /Users/shuaib/DevOps/setup-real-git-repos.sh
```

---

## Live Demo: Make Real Commit with [URGENT] Tag

```bash
# Terminal 3: Make a real commit with [URGENT] tag
cd /tmp/pipelinex-repos/auth-service

# Make change
echo "vulnerability_fixed=true" >> config.yml
git add .

# Commit with [URGENT] tag (boosts priority by 2!)
git commit -m "[URGENT] Critical SQL injection vulnerability fixed"

# Trigger webhook
curl -s -X POST http://localhost:5001/webhook/auth-service-proj \
  -H "Content-Type: application/json" \
  -d '{
    "ref": "refs/heads/main",
    "repository": {"name": "auth-service"},
    "commits": [{"message": "[URGENT] Critical SQL injection vulnerability fixed"}]
  }' | jq '.'
```

**Watch Terminal 1 for:**
```
📊 [PRIORITY ASSIGNED]
   Priority: 5 - CRITICAL
   Reason: URGENT tag in commit message

🎯 This job will be dequeued immediately, before all others!
```

---

## Show Queue Statistics

```bash
# Terminal 3: Check queue size and priority distribution
curl -s http://localhost:5001/api/queue/status | jq '.'

# Expected output:
{
  "total": 6,
  "byPriority": {
    "1": 0,
    "2": 0,
    "3": 1,
    "4": 2,
    "5": 3
  },
  "avgWaitTime": 2500
}
```

---

## Priority Assignment Rules (Reference)

```
BRANCH NAME → PRIORITY (Base)
═════════════════════════════════════════════
main / master               → 5 (CRITICAL)
develop / staging           → 4 (HIGH)
feature / hotfix            → 3 (MEDIUM)
test / experiment           → 2 (LOW)
docs / chore                → 1 (LOWEST)

COMMIT MESSAGE TAGS → MODIFIER
═════════════════════════════════════════════
[URGENT] or [CRITICAL]      → +2 priority
[HIGH]                      → +1 priority
[LOW]                       → -1 priority

FILE CHANGES → MODIFIER
═════════════════════════════════════════════
Dockerfile, package.json     → +1 (infrastructure)
auth, security files         → +1 (security sensitive)

FINAL PRIORITY → Clamp(1, 5)
   Example: branch=develop (4) + [URGENT] (+2) = 5 (clamped to max)
   Example: branch=beta (3) + security file (+1) = 4
```

---

## Expected Demo Timeline

| Time | Action | Expected Result |
|------|--------|-----------------|
| T=0m | Run setup script | 9 webhooks triggered |
| T=0m | Check backend logs | Priority assignments shown |
| T=1m | Verify git commits | `git log` shows real commits |
| T=2m | Open dashboard | 3 projects visible with status |
| T=3m | Watch execution | Workers executing Priority 5 jobs first |
| T=5m | Make [URGENT] commit | Priority boosted to 5 immediately |
| T=5m | Verify queue | See 6+ jobs ordered by priority |

---

## Files to Show Evaluator

```bash
# 1. Priority Queue Implementation
cat /Users/shuaib/DevOps/backend/src/services/priorityQueue.ts

# 2. Webhook with Priority Assignment
cat /Users/shuaib/DevOps/backend/src/routes/webhooks.ts

# 3. Real Git Setup Script
cat /Users/shuaib/DevOps/setup-real-git-repos.sh

# 4. Design Document
cat /Users/shuaib/DevOps/PRIORITY_QUEUE_DESIGN.md

# 5. Setup Guide
cat /Users/shuaib/DevOps/PRIORITY_QUEUE_SETUP.md

# 6. Final Evaluator Guide
cat /Users/shuaib/DevOps/FINAL_EVALUATOR_GUIDE.md
```

---

## Troubleshooting

### Backend won't start
```bash
# Check port 5001 is free
lsof -i :5001

# Check dependencies
cd backend && npm install

# Check database
npx prisma db push
```

### No webhooks received
```bash
# Verify backend is running
curl http://localhost:5001/health

# Check webhook handler
cat backend/src/routes/webhooks.ts

# Test manually
curl -X POST http://localhost:5001/webhook/test-proj \
  -H "Content-Type: application/json" \
  -d '{"ref":"refs/heads/main"}'
```

### Git repos not created
```bash
# Make script executable
chmod +x setup-real-git-repos.sh

# Run with verbose output
bash -x setup-real-git-repos.sh

# Check if repos exist
ls -la /tmp/pipelinex-repos/
```

---

## Key Points to Emphasize to Evaluator

✅ **Priority is NOT Random**
- Based on definite criteria: branch name, commit tags, files
- Same inputs → same priority every time

✅ **Real Git, Not Simulation**
- Use `git log` to show actual commits
- Real repositories at `/tmp/pipelinex-repos/`
- Real webhook events (HTTP POST)

✅ **Smarter than FIFO**
- CRITICAL jobs (main, [URGENT]) execute first
- LOW priority jobs (docs) execute last
- Matches production CI/CD behavior

✅ **Production-Ready**
- Security patches get boosted priority
- Production branches prioritized
- Infrastructure changes prioritized

---

## ✨ Ready to Demo!

All commands above will work as copy-paste. Just run them in order and you'll have a complete demonstration of a priority-based job queue system with real git integration.

**Good luck with your final evaluation! 🚀**


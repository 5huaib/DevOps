# 🚀 Quick Start Guide - Priority Queue & Webhooks Demo

**For Final Evaluators - Complete Demonstration in 5 Minutes**

---

## ⚡ Step 1: Start Backend & Frontend (2 minutes)

**Terminal 1: Backend**
```bash
cd /Users/shuaib/DevOps/backend
npm run dev
```
✅ Wait for: `listening on port 5001`

**Terminal 2: Frontend**
```bash
cd /Users/shuaib/DevOps/frontend
npm run dev
```
✅ Wait for: `http://localhost:5173` is ready

---

## ⚡ Step 2: Set Up Real Git Repositories (2 minutes)

**Terminal 3: Run setup script**
```bash
chmod +x /Users/shuaib/DevOps/setup-real-git-repos.sh
/Users/shuaib/DevOps/setup-real-git-repos.sh
```

✅ What this does:
- Creates 3 real git repositories in `/tmp/pipelinex-repos/`
- Creates 6 branches (2 per repo)
- Makes real git commits with timestamps
- Triggers 9+ webhooks to demonstrate priority

✅ Wait for final summary showing: "All real git repositories and webhooks are ready!"

---

## ⚡ Step 3: Verify Real Git Commits (1 minute)

**Check real commits exist:**
```bash
cd /tmp/pipelinex-repos/payment-service && git log --oneline --all
cd /tmp/pipelinex-repos/auth-service && git log --oneline --all
cd /tmp/pipelinex-repos/frontend-app && git log --oneline --all
```

✅ You should see real commits with actual timestamps

---

## ⚡ Step 4: Verify Priority Assignment

**Check backend logs for priority assignment:**

Look in Terminal 1 (backend) for messages like:
```
📊 [PRIORITY ASSIGNED]
   Job ID: payment-service-proj
   Priority: 5 - CRITICAL (Main/Hotfix)
   Branch: main
   Repository: payment-service
   Reason: Main/Master production branch
```

✅ Each webhook should show a priority assignment

---

## ⚡ Step 5: View Queue Status

**Check current queue in Terminal 3:**
```bash
curl http://localhost:5001/webhook/queue | jq .
```

✅ You should see:
- Multiple jobs queued
- Jobs sorted by priority (5, 4, 3, 2, 1)
- Worker status

**Example output:**
```json
{
  "queueSize": 5,
  "stats": {
    "total": 5,
    "byPriority": {
      "1": 0,
      "2": 0,
      "3": 1,
      "4": 2,
      "5": 2
    }
  },
  "jobs": [
    {
      "priority": 5,
      "repo": "auth-service",
      "branch": "main"
    }
  ]
}
```

---

## ⚡ Step 6: View Dashboard

**Open in browser:**
```
http://localhost:5173
```

✅ You should see:
- 3 projects listed (payment-service, auth-service, frontend-app)
- Jobs with status icons
- Jobs grouped by priority
- Real-time updates

---

## ✅ Verification Checklist

Copy this and verify all points:

### Priority Queue System ✓
- [ ] Priority queue implemented
- [ ] Dequeues highest priority first (not FIFO)
- [ ] Jobs execute in order: 5→4→3→2→1
- [ ] Within same priority: FIFO maintained

### Real Git Repositories ✓
- [ ] 3 repositories exist in `/tmp/pipelinex-repos/`
- [ ] payment-service with main + develop
- [ ] auth-service with main + staging
- [ ] frontend-app with main + beta
- [ ] ALL 6 branches verified with `git branch -a`

### Real Git Commits ✓
- [ ] Real commits visible with `git log --oneline --all`
- [ ] Commits have actual timestamps
- [ ] Commit messages are real (not generic "test")
- [ ] At least 3 commits per repository

### Priority Assignment (Deterministic) ✓
- [ ] Backend logs show "[PRIORITY ASSIGNED]" messages
- [ ] Each shows: Job ID, Priority, Branch, Repository, Reason
- [ ] Priority NOT random (deterministic)
- [ ] Same commit twice = Same priority both times

### Webhooks Working ✓
- [ ] `/webhook/health` returns 200 OK
- [ ] `/webhook/queue` shows jobs
- [ ] `/webhook/status/:projectId` returns pipeline history
- [ ] Can manually trigger webhook with curl

### Priority-Based Execution ✓
- [ ] CRITICAL (5) jobs execute first
- [ ] HIGH (4) jobs execute second
- [ ] MEDIUM (3), LOW (2), LOWEST (1) follow
- [ ] NOT in order received (not FIFO)

### Deterministic Criteria ✓
- [ ] main branch → Priority 5
- [ ] develop/staging branch → Priority 4
- [ ] feature/hotfix branch → Priority 3
- [ ] test/experiment branch → Priority 2
- [ ] docs/chore branch → Priority 1
- [ ] [URGENT] tag → +2 priority
- [ ] [HIGH] tag → +1 priority
- [ ] Security files → +1 priority
- [ ] Infrastructure files → +1 priority
- [ ] Critical repos → Minimum priority 3

### Frontend Integration ✓
- [ ] Dashboard loads: `http://localhost:5173`
- [ ] All 3 projects visible
- [ ] Status updates in real-time
- [ ] Jobs shown with priority indicators

---

## 📝 Test Priority Ordering

**Terminal 3: Send test webhooks with different priorities**

```bash
# Send 5 webhooks in random order, observe execution order

# Priority 1 (LOW)
curl -X POST http://localhost:5001/webhook/test-proj \
  -H "Content-Type: application/json" \
  -d '{"ref":"refs/heads/docs/readme","repository":{"name":"test"},"commits":[{"id":"1","message":"Doc update","added":[],"modified":[],"removed":[]}]}'

# Priority 5 (CRITICAL)
curl -X POST http://localhost:5001/webhook/test-proj \
  -H "Content-Type: application/json" \
  -d '{"ref":"refs/heads/main","repository":{"name":"test"},"commits":[{"id":"2","message":"[URGENT] Fix bug","added":[],"modified":[],"removed":[]}]}'

# Priority 2 (LOW)
curl -X POST http://localhost:5001/webhook/test-proj \
  -H "Content-Type: application/json" \
  -d '{"ref":"refs/heads/test/experiment","repository":{"name":"test"},"commits":[{"id":"3","message":"Test","added":[],"modified":[],"removed":[]}]}'

# Priority 4 (HIGH)
curl -X POST http://localhost:5001/webhook/test-proj \
  -H "Content-Type: application/json" \
  -d '{"ref":"refs/heads/develop","repository":{"name":"test"},"commits":[{"id":"4","message":"New feature","added":[],"modified":[],"removed":[]}]}'

# Priority 3 (MEDIUM)
curl -X POST http://localhost:5001/webhook/test-proj \
  -H "Content-Type: application/json" \
  -d '{"ref":"refs/heads/feature/dashboard","repository":{"name":"test"},"commits":[{"id":"5","message":"Dashboard","added":[],"modified":[],"removed":[]}]}'
```

✅ **Expected execution order: 5 → 4 → 3 → 2 → 1** (regardless of send order)

---

## 🔍 Deep Inspection Commands

### Inspect Real Git Data
```bash
# View all commits in payment-service
cd /tmp/pipelinex-repos/payment-service
git log --all --oneline --graph

# View specific branch
git log develop --oneline

# View all branches
git branch -a

# See which commits are on which branch
git branch -a --contains <commit-id>

# View commit details
git show <commit-id>
```

### Inspect Priority Queue
```bash
# Get detailed queue state
curl http://localhost:5001/webhook/queue | jq '.jobs | sort_by(-.priority)'

# Get project-specific status
curl http://localhost:5001/webhook/status/payment-service-proj | jq '.pipelines'

# Get worker stats
curl http://localhost:5001/webhook/queue | jq '.workerStatus'
```

### Inspect Backend Logs
```bash
# Watch for priority assignments (Terminal 1)
# Look for: "[PRIORITY ASSIGNED]"

# Watch for webhook triggers (Terminal 1)
# Look for: "[WEBHOOK RECEIVED]"

# Watch for job execution (Terminal 1)
# Look for: "[WORKER X]"
```

---

## 🎯 Key Demonstrations

### Demo 1: Priority Override with Tags
```bash
# Regular develop branch = Priority 4
curl -X POST http://localhost:5001/webhook/demo1 \
  -H "Content-Type: application/json" \
  -d '{
    "ref": "refs/heads/develop",
    "repository": {"name": "test"},
    "commits": [{
      "id": "abc123",
      "message": "Add new feature",
      "added": ["feature.js"],
      "modified": [],
      "removed": []
    }]
  }'

# Same branch + [URGENT] tag = Priority 5
curl -X POST http://localhost:5001/webhook/demo2 \
  -H "Content-Type: application/json" \
  -d '{
    "ref": "refs/heads/develop",
    "repository": {"name": "test"},
    "commits": [{
      "id": "def456",
      "message": "[URGENT] Critical fix for develop",
      "added": ["security.js"],
      "modified": [],
      "removed": []
    }]
  }'
```

✅ **Expectation:** demo2 will execute before demo1 (despite same branch)

### Demo 2: Repository Criticality
```bash
# Regular repo, feature branch = Priority 3
curl -X POST http://localhost:5001/webhook/demo3 \
  -H "Content-Type: application/json" \
  -d '{
    "ref": "refs/heads/feature/ui",
    "repository": {"name": "blog-service"},
    "commits": [{"id": "111", "message": "New UI", "added": [], "modified": [], "removed": []}]
  }'

# Critical repo (auth-service), feature branch = Priority 3+
curl -X POST http://localhost:5001/webhook/demo4 \
  -H "Content-Type: application/json" \
  -d '{
    "ref": "refs/heads/feature/auth",
    "repository": {"name": "auth-service"},
    "commits": [{"id": "222", "message": "Auth feature", "added": [], "modified": [], "removed": []}]
  }'
```

✅ **Expectation:** Both are Priority 3, but auth-service has minimum priority guarantee

### Demo 3: Security File Detection
```bash
# Regular file change = Priority 3
curl -X POST http://localhost:5001/webhook/demo5 \
  -H "Content-Type: application/json" \
  -d '{
    "ref": "refs/heads/develop",
    "repository": {"name": "test"},
    "commits": [{
      "id": "333",
      "message": "Update readme",
      "added": ["README.md"],
      "modified": [],
      "removed": []
    }]
  }'

# Security file = Priority 4 (boosted)
curl -X POST http://localhost:5001/webhook/demo6 \
  -H "Content-Type: application/json" \
  -d '{
    "ref": "refs/heads/develop",
    "repository": {"name": "test"},
    "commits": [{
      "id": "444",
      "message": "Fix auth vulnerability",
      "added": ["auth.ts"],
      "modified": [],
      "removed": []
    }]
  }'
```

✅ **Expectation:** demo6 (security file) gets boosted priority

---

## 🐛 Troubleshooting

### Backend not starting?
```bash
cd /Users/shuaib/DevOps/backend
npm install
npx prisma db push
npm run dev
```

### Webhooks not triggering?
```bash
# Check backend is running
curl http://localhost:5001/webhook/health

# Check project was created
curl http://localhost:5001/webhook/queue
```

### Git repos not created?
```bash
ls -la /tmp/pipelinex-repos/

# If empty, run setup script again
/Users/shuaib/DevOps/setup-real-git-repos.sh
```

### Priority not assigned correctly?
```bash
# Check backend logs for "[PRIORITY ASSIGNED]"
# Verify branch name matches exactly
# Check commit message for tags: [URGENT], [HIGH], [LOW]
```

---

## 📊 Summary

| Feature | Status | Evidence |
|---------|--------|----------|
| Priority Queue | ✅ Implemented | Backend logs show priority assignment |
| Real Git Repos | ✅ 3 repos with 6 branches | `/tmp/pipelinex-repos/` |
| Real Commits | ✅ Actual git history | `git log --oneline --all` |
| Deterministic Priority | ✅ Rule-based | Same input = Same priority |
| Webhooks | ✅ Fully functional | HTTP 202 responses |
| Queue Ordering | ✅ Priority-based | Jobs execute 5→4→3→2→1 |
| Not FIFO | ✅ Proven | High priority jobs jump queue |
| Dashboard Integration | ✅ Real-time | `http://localhost:5173` |
| Production Ready | ✅ Error handling | Proper HTTP status codes |

---

## 🎓 Learning Outcomes

After this demo, you will have seen:

1. ✅ **Real git integration** - Actual repositories in filesystem
2. ✅ **Real commits** - Actual git history with timestamps
3. ✅ **Deterministic priority** - Rule-based, not random
4. ✅ **Webhook processing** - Live HTTP webhook handling
5. ✅ **Priority-based scheduling** - Jobs execute by priority, not FIFO
6. ✅ **Queue management** - Multiple jobs queued and processed
7. ✅ **Worker pool** - Parallel job execution
8. ✅ **Dashboard integration** - Real-time UI updates

---

## 📞 Questions?

Refer to:
- `WEBHOOK_IMPLEMENTATION.md` - Detailed webhook API docs
- `PRIORITY_QUEUE_DESIGN.md` - Priority system design
- `FINAL_EVALUATOR_GUIDE.md` - Comprehensive evaluation guide
- Backend logs - Real-time system behavior


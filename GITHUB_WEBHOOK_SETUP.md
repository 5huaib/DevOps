# 🔗 GitHub Webhook Setup Guide for PipelineX

Complete step-by-step guide to configure GitHub webhooks and link real repositories to the PipelineX CI/CD system.

---

## 📋 Overview

This guide shows how to:
1. Create 3 real GitHub repositories (payment-service, auth-service, frontend-app)
2. Configure webhooks in GitHub settings
3. Link them to PipelineX backend
4. Trigger real builds with actual git commits

---

## ✅ Prerequisites

Before starting, ensure:
- [ ] GitHub account created (https://github.com)
- [ ] PipelineX backend running on `http://localhost:5001`
- [ ] PipelineX frontend running on `http://localhost:5173`
- [ ] Your machine has internet access (for webhook callbacks)
- [ ] ngrok or similar tool (optional, for local tunnel)

---

## 🚀 Part 1: Create GitHub Repositories

### Step 1.1: Create First Repository (Payment Service)

**On GitHub.com:**

1. Click **+** icon → **New repository**
2. **Repository name:** `payment-service`
3. **Description:** Payment processing microservice for PipelineX CI/CD demo
4. **Visibility:** Public (webhooks work easier)
5. **Initialize with:**
   - ✅ Add a README file
   - ✅ Add .gitignore (Node)
6. Click **Create repository**

**Screenshot locations:**
```
Step 1: Top right corner, click "+" 
Step 2: Fill in repository details
Step 3: Scroll down, check "Add a README file"
Step 4: Click green "Create repository" button
```

---

### Step 1.2: Create Second Repository (Auth Service)

1. Click **+** icon → **New repository**
2. **Repository name:** `auth-service`
3. **Description:** Authentication microservice for PipelineX CI/CD demo
4. **Visibility:** Public
5. **Initialize with:**
   - ✅ Add a README file
   - ✅ Add .gitignore (Node)
6. Click **Create repository**

---

### Step 1.3: Create Third Repository (Frontend App)

1. Click **+** icon → **New repository**
2. **Repository name:** `frontend-app`
3. **Description:** Frontend application for PipelineX CI/CD demo
4. **Visibility:** Public
5. **Initialize with:**
   - ✅ Add a README file
   - ✅ Add .gitignore (Node)
6. Click **Create repository**

---

## 🔧 Part 2: Configure Local Git Remotes

After creating repositories on GitHub, configure local remotes. Replace `YOUR_USERNAME` with your actual GitHub username.

```bash
# Navigate to the local repos directory
cd /tmp/pipelinex-repos

# ========================================
# Repository 1: Payment Service
# ========================================
cd payment-service

# Add GitHub as remote
git remote add origin https://github.com/YOUR_USERNAME/payment-service.git

# Create main branch and push
git branch -M main
git push -u origin main

# Push develop branch
git push -u origin develop

# Verify remotes
git remote -v
# Output should show:
# origin  https://github.com/YOUR_USERNAME/payment-service.git (fetch)
# origin  https://github.com/YOUR_USERNAME/payment-service.git (push)

# ========================================
# Repository 2: Auth Service
# ========================================
cd ../auth-service

git remote add origin https://github.com/YOUR_USERNAME/auth-service.git
git branch -M main
git push -u origin main
git push -u origin staging

git remote -v

# ========================================
# Repository 3: Frontend App
# ========================================
cd ../frontend-app

git remote add origin https://github.com/YOUR_USERNAME/frontend-app.git
git branch -M main
git push -u origin main
git push -u origin beta

git remote -v
```

**Verify all 3 repos on GitHub:**
- Visit `https://github.com/YOUR_USERNAME/payment-service`
- Visit `https://github.com/YOUR_USERNAME/auth-service`
- Visit `https://github.com/YOUR_USERNAME/frontend-app`

✅ Should see 2 branches each (main + develop/staging/beta)

---

## 🔐 Part 3: Expose Local Backend via ngrok (For Real Webhooks)

GitHub webhooks can only send to publicly accessible URLs. Use ngrok to expose your local backend.

### Step 3.1: Install ngrok

**macOS:**
```bash
# Using Homebrew
brew install ngrok

# Or download from: https://ngrok.com/download
```

**Linux:**
```bash
# Download
wget https://bin.equinox.io/c/4VmDzA7iaHg/ngrok-stable-linux-amd64.zip
unzip ngrok-stable-linux-amd64.zip
sudo mv ngrok /usr/local/bin/
```

---

### Step 3.2: Create ngrok Account (Free)

1. Go to https://ngrok.com
2. Click **Sign up** (free tier available)
3. Create account with email
4. Go to **Dashboard** → **Your Authtoken**
5. Copy the token
6. Run in terminal:
   ```bash
   ngrok authtoken YOUR_AUTHTOKEN_HERE
   ```

---

### Step 3.3: Start ngrok Tunnel

In a new terminal:

```bash
# Expose local port 5001 (PipelineX backend)
ngrok http 5001

# Output will show:
# Forwarding   https://abc123.ngrok.io -> http://localhost:5001
# Copy this URL - you'll need it for webhook settings
```

**Keep this terminal open!** The ngrok tunnel must stay active while testing webhooks.

**Example output:**
```
Session Status                online
Account                       your_email@gmail.com
Version                       3.0.0
Region                        United States (us)
Latency                        15ms
Web Interface                  http://127.0.0.1:4040
Forwarding                     https://a1b2c3d4e5f6.ngrok.io -> http://localhost:5001
```

📝 **Copy this URL:** `https://a1b2c3d4e5f6.ngrok.io` (your actual URL will be different)

---

## 🪝 Part 4: Add GitHub Webhooks

Now configure GitHub to send webhooks to your PipelineX backend.

### Step 4.1: Configure Webhook for Payment Service

1. **Go to GitHub:** https://github.com/YOUR_USERNAME/payment-service
2. Click **Settings** (top right)
3. Left sidebar → **Webhooks**
4. Click **Add webhook**

**Fill in the form:**

```
Payload URL:        https://YOUR_NGROK_URL/webhook/payment-service-proj
Content type:       application/json
Secret:             (optional - leave empty for demo)
Which events:       ✅ Push events
                    ✅ Pull request events
Active:             ✅ (enabled)
```

5. Click **Add webhook**
6. You should see a ✅ green checkmark indicating successful delivery

**Screenshot guide:**
```
Settings → Webhooks → Add webhook
├─ Payload URL: https://abc123.ngrok.io/webhook/payment-service-proj
├─ Content type: application/json
├─ Events: Just the push event
└─ Click "Add webhook"
```

---

### Step 4.2: Configure Webhook for Auth Service

1. **Go to GitHub:** https://github.com/YOUR_USERNAME/auth-service
2. Click **Settings** (top right)
3. Left sidebar → **Webhooks**
4. Click **Add webhook**

**Fill in the form:**

```
Payload URL:        https://YOUR_NGROK_URL/webhook/auth-service-proj
Content type:       application/json
Secret:             (optional - leave empty for demo)
Which events:       ✅ Push events
                    ✅ Pull request events
Active:             ✅ (enabled)
```

5. Click **Add webhook**

---

### Step 4.3: Configure Webhook for Frontend App

1. **Go to GitHub:** https://github.com/YOUR_USERNAME/frontend-app
2. Click **Settings** (top right)
3. Left sidebar → **Webhooks**
4. Click **Add webhook**

**Fill in the form:**

```
Payload URL:        https://YOUR_NGROK_URL/webhook/frontend-app-proj
Content type:       application/json
Secret:             (optional - leave empty for demo)
Which events:       ✅ Push events
                    ✅ Pull request events
Active:             ✅ (enabled)
```

5. Click **Add webhook**

---

## ✅ Part 5: Test Webhook Deliveries

After adding webhooks, GitHub automatically sends a test delivery.

### Step 5.1: Check Webhook Deliveries

For each repository:

1. **Go to GitHub repo** → **Settings** → **Webhooks**
2. Click on your webhook URL
3. Scroll down to **Recent Deliveries**
4. You should see at least 1 delivery (the test)
5. Click on it to see:
   - ✅ **Status:** 200 (success) or 202 (accepted)
   - Response headers
   - Payload data

**What success looks like:**
```
Status: 200 OK
Response time: 150ms
Response body: {"message":"Pipeline triggered successfully",...}
```

---

## 🚀 Part 6: Trigger Real Builds with Git Commits

Now trigger builds by making actual commits to GitHub branches.

### Step 6.1: Create Projects in PipelineX

First, create corresponding projects in PipelineX (or use existing demo projects).

**Via PipelineX UI:**
1. Open http://localhost:5173
2. Login with demo account or create new
3. Create 3 projects:
   - **Project 1:** payment-service
   - **Project 2:** auth-service  
   - **Project 3:** frontend-app
4. Note the **Project IDs** (you'll see them in dashboard URLs)

---

### Step 6.2: Make a Real Git Commit to Main Branch

**Trigger Priority 5 (CRITICAL):**

```bash
cd /tmp/pipelinex-repos/payment-service

# Switch to main branch
git checkout main

# Make a real change
echo "# Updated: $(date)" >> README.md

# Commit with message (message affects priority)
git commit -m "[URGENT] Critical production fix applied"

# Push to GitHub (this triggers webhook)
git push origin main
```

**What happens:**
1. ✅ Commit is pushed to GitHub
2. 🔗 GitHub sends webhook to ngrok URL
3. 📥 PipelineX backend receives webhook
4. 📊 Priority calculated: **5 (CRITICAL)** (main branch + [URGENT] tag)
5. 🚀 Pipeline starts immediately
6. 📊 Dashboard updates in real-time

---

### Step 6.3: Make a Real Git Commit to Develop Branch

**Trigger Priority 4 (HIGH):**

```bash
cd /tmp/pipelinex-repos/payment-service

# Switch to develop branch
git checkout develop

# Make a real change
echo "feature: payment processor v2" >> README.md

# Commit
git commit -m "[HIGH] Add new payment processor"

# Push to GitHub
git push origin develop
```

**Expected Priority:** 4 (HIGH)

---

### Step 6.4: Make a Documentation Commit

**Trigger Priority 1 (LOWEST):**

```bash
cd /tmp/pipelinex-repos/frontend-app

# Make a doc change
echo "# Contributing Guidelines" > CONTRIBUTING.md

# Commit
git commit -m "docs: add contribution guide"

# Push to GitHub
git push origin main
```

**Expected Priority:** 1 (LOWEST) (docs branch or commit message)

---

## 📊 Part 7: Priority Assignment Rules

When you make commits, PipelineX automatically assigns priority based on:

```
PRIORITY CALCULATION:
═════════════════════

Base Priority (Branch):
├─ main/master               → 5 (CRITICAL)
├─ develop/staging/release/* → 4 (HIGH)
├─ feature/*/hotfix/*        → 3 (MEDIUM)
├─ test/*/experiment/*       → 2 (LOW)
└─ docs/*/chore/*            → 1 (LOWEST)

Modifiers (from commit message):
├─ [URGENT] or [CRITICAL]    → +2 (boost priority)
├─ [HIGH]                    → +1 (boost priority)
└─ [LOW]                     → -1 (reduce priority)

File Changes (auto-detection):
├─ package.json, Dockerfile  → +1 (infrastructure)
└─ auth, security files      → +1 (security)

Repository Importance:
├─ payment-service           → Minimum 3
└─ auth-service              → Minimum 3
```

---

## 🔍 Part 8: Monitor Pipeline Execution

### In Backend Terminal:

You'll see logs like:

```
📊 [PRIORITY ASSIGNED]
   Job ID: pipeline-xyz123
   Priority: 5 - CRITICAL (Main/Hotfix)
   Branch: main
   Repository: payment-service
   Reason: URGENT tag in commit message

👷 [WORKER 1] Executing: "Git Checkout" (Pipeline: pipeline-xy...)
✅ [WORKER 1] SUCCESS: "Git Checkout" (1250ms)

👷 [WORKER 2] Executing: "Execute shell" (Pipeline: pipeline-xy...)
✅ [WORKER 2] SUCCESS: "Execute shell" (980ms)

🎉 [PIPELINE SUCCESS] Pipeline pipeline-xyz123 completed successfully!
```

### In Frontend Dashboard:

1. Open http://localhost:5173
2. See projects with status:
   - ⚙️ Running (blue)
   - ✅ Success (green)
   - ❌ Failed (red)
3. Click on project to see pipelines
4. Click on pipeline to see jobs
5. Jobs appear sorted by **Priority** (not FIFO)

---

## 📝 Part 9: Webhook Payload Format

PipelineX accepts standard GitHub webhook payloads:

```json
{
  "ref": "refs/heads/main",
  "before": "abc123...",
  "after": "def456...",
  "repository": {
    "id": 12345,
    "name": "payment-service",
    "full_name": "username/payment-service",
    "private": false,
    "html_url": "https://github.com/username/payment-service",
    "description": "Payment service for PipelineX"
  },
  "pusher": {
    "name": "username",
    "email": "user@example.com"
  },
  "commits": [
    {
      "id": "abc123def456",
      "tree_id": "xyz789",
      "message": "[URGENT] Critical production fix",
      "timestamp": "2026-05-12T10:30:00Z",
      "url": "https://github.com/username/payment-service/commit/abc123",
      "author": {
        "name": "Developer",
        "email": "dev@example.com"
      },
      "added": ["new-file.js"],
      "removed": [],
      "modified": ["package.json", "src/index.ts"]
    }
  ]
}
```

---

## 🐛 Troubleshooting

### Issue: Webhook shows 404 error

**Solution:**
```
1. Check ngrok tunnel is running: Look for "Forwarding" line
2. Verify webhook URL matches: https://YOUR_NGROK_URL/webhook/PROJECT_ID
3. Ensure backend is running on port 5001
4. Check backend logs for errors
```

### Issue: Webhook shows 500 error

**Solution:**
```
1. Check backend terminal for error messages
2. Verify PipelineX database is set up: npx prisma db push
3. Ensure webhook URL format is correct
4. Check that project ID exists in PipelineX
```

### Issue: Webhook not triggering on push

**Solution:**
```
1. Verify webhook is "Active" (green checkmark)
2. Go to Settings → Webhooks → Recent Deliveries
3. Click a delivery to see response
4. Try manual test: Click "Redeliver" button
5. Ensure ngrok tunnel is still active
```

### Issue: ngrok URL keeps changing

**Solution:**
```
1. Use ngrok authtoken (free tier keeps same URL for 2 hours)
2. Or upgrade to paid ngrok plan for permanent URL
3. Update webhook URL in GitHub settings when URL changes
4. Use custom domain if available in ngrok
```

---

## 📋 Verification Checklist

- [ ] 3 GitHub repositories created (payment-service, auth-service, frontend-app)
- [ ] Each repo has 2 branches (main + develop/staging/beta)
- [ ] ngrok tunnel active and forwarding to localhost:5001
- [ ] 3 webhooks added in GitHub settings
- [ ] All webhooks show "Recent Deliveries" with 200/202 status
- [ ] PipelineX backend running and accessible
- [ ] PipelineX frontend dashboard loads
- [ ] Made at least 1 test commit to main branch
- [ ] Backend shows "📊 [PRIORITY ASSIGNED]" logs
- [ ] Dashboard shows pipeline executing
- [ ] Jobs execute in priority order (not FIFO)
- [ ] Backend logs show worker execution

---

## 🎯 Success Criteria

Your setup is working when:

✅ You make a real commit to GitHub
✅ GitHub webhook fires (check Recent Deliveries)
✅ PipelineX backend receives webhook
✅ Backend logs show priority assignment
✅ Priority is calculated correctly
✅ Dashboard shows pipeline running
✅ Jobs execute in priority order
✅ All 3 repos trigger builds independently
✅ Different branches get different priorities

---

## 📚 Next Steps

1. **Run demo script:** `/Users/shuaib/DevOps/setup-real-git-repos.sh`
2. **Monitor dashboard:** http://localhost:5173
3. **Check backend logs:** Terminal where backend is running
4. **Make manual commits:** Test different branches and commit messages
5. **Verify priority:** Confirm jobs execute by priority, not FIFO

---

## 🔗 Quick Reference URLs

| Component | URL |
|-----------|-----|
| PipelineX Frontend | http://localhost:5173 |
| PipelineX Backend | http://localhost:5001 |
| Backend Health | http://localhost:5001/health |
| Payment Service Repo | https://github.com/YOUR_USERNAME/payment-service |
| Auth Service Repo | https://github.com/YOUR_USERNAME/auth-service |
| Frontend App Repo | https://github.com/YOUR_USERNAME/frontend-app |
| ngrok Web Interface | http://127.0.0.1:4040 |

---

## 📞 Support

If you encounter issues:

1. Check **Backend Logs** for error messages
2. Visit **ngrok Web Interface** (http://127.0.0.1:4040) to see all webhook requests
3. Check **GitHub Recent Deliveries** for webhook response codes
4. Verify **Database:** `npx prisma db push` in backend directory
5. Restart services if needed

---

**Document Version:** 1.0
**Last Updated:** May 12, 2026
**Status:** ✅ Complete and Ready for Use

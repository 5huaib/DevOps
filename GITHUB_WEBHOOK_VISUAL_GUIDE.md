# 📸 GitHub Settings Visual Guide - Step by Step

Complete visual walkthrough of GitHub webhook configuration.

---

## STEP 1: Create New Repository

### Screen 1.1: Click the "+" Menu
```
Location: TOP RIGHT corner of GitHub.com
┌─────────────────────────────────────┐
│  GitHub logo  Search  [+]  Profile  │ ← Click here
└─────────────────────────────────────┘
                      ↓
             Dropdown menu appears:
             • New repository
             • New codespace
             • Import repository
             • New gist
             • New organization
```

**Click:** "New repository"

---

### Screen 1.2: Repository Creation Form
```
┌─────────────────────────────────────────────────────────┐
│  Create a new repository                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Owner: YOUR_USERNAME                                   │
│                                                         │
│ Repository name *                                      │
│ ┌─────────────────────────────────────┐               │
│ │ payment-service                     │               │
│ └─────────────────────────────────────┘               │
│                                                         │
│ Description (optional)                                 │
│ ┌─────────────────────────────────────┐               │
│ │ Payment processing microservice for│ │
│ │ PipelineX CI/CD demo                │
│ └─────────────────────────────────────┘               │
│                                                         │
│ Visibility                                             │
│ ⦿ Public    ○ Private                                  │
│                                                         │
│ Initialize this repository with:                       │
│ ☑ Add a README file                                    │
│ ☑ Add .gitignore    [Node ▼]                          │
│ ☑ Choose a license                                     │
│                                                         │
│                    [Cancel]  [Create repository]       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Fill in:**
- Repository name: `payment-service`
- Description: `Payment processing microservice`
- Visibility: **Public** (important for webhooks)
- ✅ Add a README file
- ✅ Add .gitignore (Node)

**Click:** "Create repository" (green button)

---

### Screen 1.3: Repository Created
```
After creation, you'll see:
┌─────────────────────────────────────────────────────────┐
│ YOUR_USERNAME / payment-service                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ⭐ Star  🔀 Fork  👁️ Watch                              │
│                                                         │
│ Main branch: main    [Branches: 1]                     │
│                                                         │
│ Code  Issues  Pull requests  Discussions  ...          │
│                                                         │
│ README.md displayed here...                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Repeat Steps 1.1-1.3 for:**
- `auth-service`
- `frontend-app`

---

## STEP 2: Push Local Branches to GitHub

After creating 3 repos on GitHub, push your local branches:

### Command Line (Terminal)

```bash
# ============================================
# PAYMENT SERVICE
# ============================================
cd /tmp/pipelinex-repos/payment-service

git remote add origin https://github.com/YOUR_USERNAME/payment-service.git
git branch -M main
git push -u origin main
git push -u origin develop

echo "✅ Payment service pushed"

# ============================================
# AUTH SERVICE
# ============================================
cd ../auth-service

git remote add origin https://github.com/YOUR_USERNAME/auth-service.git
git branch -M main
git push -u origin main
git push -u origin staging

echo "✅ Auth service pushed"

# ============================================
# FRONTEND APP
# ============================================
cd ../frontend-app

git remote add origin https://github.com/YOUR_USERNAME/frontend-app.git
git branch -M main
git push -u origin main
git push -u origin beta

echo "✅ Frontend app pushed"
```

**Verify on GitHub:** Visit each repo, click "Branches" button - should see 2 branches each.

---

## STEP 3: Start ngrok Tunnel

### Screen 3.1: Terminal Setup

```bash
# Terminal 1: Start ngrok
ngrok http 5001

# Output:
Session Status                online
Account                       your_email@gmail.com
Version                       3.0.0
Region                        United States (us)
Latency                        15ms
Web Interface                  http://127.0.0.1:4040
Forwarding                     https://a1b2c3d4e5f6.ngrok.io -> http://localhost:5001
Connections                    ttl    opn    tot    lost
                                0      0      0      0
```

**Copy this URL:** `https://a1b2c3d4e5f6.ngrok.io` (yours will be different)

⚠️ **Keep this terminal open!**

---

## STEP 4: Add Webhook - Payment Service

### Screen 4.1: Go to Repository Settings

```
On GitHub (payment-service repo):

Location: TOP RIGHT of repository page
┌──────────────────────────────────┐
│ Code  Issues  Pull requests  ...  │
│ ... Settings ← CLICK HERE        │
└──────────────────────────────────┘
```

**Click:** Settings tab

---

### Screen 4.2: Navigate to Webhooks

```
Left sidebar menu in Settings:
┌──────────────────────────────┐
│ General                      │
│ Collaborators                │
│ Manage access                │
│ Moderation options           │
│ Code security and analysis   │
├──────────────────────────────┤
│ Webhooks ← CLICK HERE        │
│ Deploy keys                  │
│ Secrets and variables        │
│ Actions                      │
│ Pages                        │
│ Environments                 │
└──────────────────────────────┘
```

**Click:** Webhooks

---

### Screen 4.3: Webhooks Page

```
┌─────────────────────────────────────────────────────────┐
│ Webhooks                                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Add webhook when your integration is ready.            │
│                                                         │
│                   [Add webhook]  ← CLICK HERE          │
│                                                         │
│ Recent Deliveries                                      │
│ (will show after webhooks are added)                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Click:** "Add webhook" (green button)

---

### Screen 4.4: Add New Webhook Form

```
┌─────────────────────────────────────────────────────────┐
│ Add webhook                                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Payload URL *                                          │
│ ┌─────────────────────────────────────┐               │
│ │ https://a1b2c3d4e5f6.ngrok.io/webhoo│
│ │k/payment-service-proj               │
│ └─────────────────────────────────────┘               │
│                                                         │
│ Content type                                           │
│ [application/json ▼]                                   │
│                                                         │
│ Secret (optional)                                      │
│ ┌─────────────────────────────────────┐               │
│ │                                     │  ← Leave empty │
│ └─────────────────────────────────────┘               │
│                                                         │
│ Which events would you like to trigger this webhook?   │
│ ⦿ Just the push event                                  │
│ ○ Let me select individual events                      │
│                                                         │
│ ☑ Active  (webhook is active)                          │
│                                                         │
│              [Cancel]  [Add webhook]                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Fill in:**

| Field | Value |
|-------|-------|
| **Payload URL** | `https://YOUR_NGROK_URL/webhook/payment-service-proj` |
| **Content type** | `application/json` |
| **Secret** | (leave empty) |
| **Events** | `Just the push event` |
| **Active** | ✅ (checked) |

**Example Payload URL:**
```
https://a1b2c3d4e5f6.ngrok.io/webhook/payment-service-proj
↑
Replace this with YOUR ngrok URL
```

**Click:** "Add webhook"

---

### Screen 4.5: Webhook Added Successfully

```
After clicking "Add webhook", you'll see:

┌─────────────────────────────────────────────────────────┐
│ Webhooks                                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Recent Deliveries                                      │
│                                                         │
│ Your webhook was just triggered!                       │
│                                                         │
│ ✅ https://a1b2c3d4e5f6.ngrok.io/webhook/...          │
│    Success (200) · now · (refresh to see details)     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

✅ **Success!** Green checkmark = webhook working

---

## STEP 5: Verify Webhook Delivery

### Screen 5.1: Click on Delivery

```
In Recent Deliveries section:

┌─────────────────────────────────────────────────────────┐
│ Recent Deliveries                                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ✅ https://a1b2c3d4e5f6.ngrok.io/webhook/...          │
│    Success (200) · 2 seconds ago                       │
│    [Click here to expand]                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Click on the delivery** to see details:

```
┌─────────────────────────────────────────────────────────┐
│ Request details                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Status: 200 OK  ✅                                      │
│ Duration: 145 ms                                       │
│                                                         │
│ Request                                                │
│ POST /webhook/payment-service-proj                    │
│ Headers: Content-Type: application/json                │
│                                                         │
│ Response                                               │
│ 200 OK                                                 │
│ Body: {"message":"Pipeline triggered...}              │
│                                                         │
│ [Redeliver]  [View Payload]                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

✅ **Status 200** = Success!

---

## STEP 6: Add Webhooks for Other Repos

**Repeat Steps 4.1-4.5 for auth-service and frontend-app:**

### Auth Service Webhook:
```
Settings → Webhooks → Add webhook

Payload URL: https://YOUR_NGROK_URL/webhook/auth-service-proj
Content type: application/json
Events: Just the push event
Active: ✅
```

### Frontend App Webhook:
```
Settings → Webhooks → Add webhook

Payload URL: https://YOUR_NGROK_URL/webhook/frontend-app-proj
Content type: application/json
Events: Just the push event
Active: ✅
```

---

## STEP 7: Test with Real Commit

### Screen 7.1: Make a Real Commit and Push

```bash
# Make real change to payment-service
cd /tmp/pipelinex-repos/payment-service
git checkout main

# Edit a file
echo "Production fix applied on $(date)" >> README.md

# Commit with priority tag
git commit -m "[URGENT] Critical production fix"

# Push to GitHub
git push origin main
```

---

### Screen 7.2: Watch Recent Deliveries Update

```
Go back to GitHub Settings → Webhooks

You should see a NEW delivery in "Recent Deliveries":

┌─────────────────────────────────────────────────────────┐
│ Recent Deliveries                                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ✅ https://a1b2c3d4e5f6.ngrok.io/webhook/...          │
│    Success (200) · just now  ← NEW DELIVERY           │
│                                                         │
│ ✅ https://a1b2c3d4e5f6.ngrok.io/webhook/...          │
│    Success (200) · 2 minutes ago  (first test)        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### Screen 7.3: Check Backend Logs

In the terminal running backend (`npm run dev`), you'll see:

```
📊 [PRIORITY ASSIGNED]
   Job ID: pipeline-abc123xyz
   Priority: 5 - CRITICAL (Main/Hotfix)
   Branch: main
   Repository: payment-service
   Reason: URGENT tag in commit message

👷 [WORKER 1] Executing: "Git Checkout" (Pipeline: pipeline-ab...)
✅ [WORKER 1] SUCCESS: "Git Checkout" (1250ms)

👷 [WORKER 2] Executing: "Execute shell" (Pipeline: pipeline-ab...)
✅ [WORKER 2] SUCCESS: "Execute shell" (980ms)

🎉 [PIPELINE SUCCESS] Pipeline pipeline-abc123xyz completed successfully!
```

✅ **End to End Working!**

---

## STEP 8: Monitor Dashboard

### Screen 8.1: View Pipeline Status

```
Open: http://localhost:5173

Dashboard shows:
┌─────────────────────────────────────────────────────────┐
│ PipelineX Dashboard                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Projects                                                │
│                                                         │
│ 📦 payment-service         ⚙️ Running                    │
│    Latest: #1 (main)                                    │
│    Triggered 2 seconds ago                              │
│                                                         │
│ 📦 auth-service            ✅ Success                    │
│    Latest: #2 (staging)                                 │
│    Completed 5 minutes ago                              │
│                                                         │
│ 📦 frontend-app            ⚙️ Running                    │
│    Latest: #3 (beta)                                    │
│    Triggered 1 minute ago                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Summary Checklist

- [ ] Created 3 GitHub repositories
- [ ] Pushed local branches to GitHub (6 branches total)
- [ ] ngrok tunnel running and active
- [ ] Added webhook to payment-service (Settings → Webhooks)
- [ ] Added webhook to auth-service
- [ ] Added webhook to frontend-app
- [ ] All webhooks show 200 status in Recent Deliveries
- [ ] Made test commit to GitHub
- [ ] Backend logs show priority assignment
- [ ] Dashboard shows pipeline executing
- [ ] Jobs execute in priority order

---

## 🚀 You're Ready!

All webhooks are configured. Now:

1. **Make commits to different branches** to see priority scheduling
2. **Use commit message tags** to boost priority:
   - `[URGENT]` → Priority 5
   - `[HIGH]` → Priority +1
   - `[LOW]` → Priority -1
3. **Monitor backend logs** to see priority calculations
4. **Check dashboard** to see pipelines executing
5. **Verify jobs execute in priority order**, not FIFO

---

**Questions?** See `GITHUB_WEBHOOK_SETUP.md` for detailed troubleshooting.

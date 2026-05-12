# 🚀 Quick GitHub Webhook Setup - Reference Card

Quick reference guide for setting up GitHub webhooks. See `GITHUB_WEBHOOK_SETUP.md` for detailed steps.

---

## 1️⃣ Create 3 GitHub Repositories

```bash
# On GitHub.com, create these 3 repos (all public):
1. payment-service
2. auth-service
3. frontend-app
```

---

## 2️⃣ Setup Local Git Remotes

```bash
# For each local repo, add GitHub remote and push branches

# Example for payment-service:
cd /tmp/pipelinex-repos/payment-service
git remote add origin https://github.com/YOUR_USERNAME/payment-service.git
git branch -M main
git push -u origin main
git push -u origin develop

# Repeat for auth-service and frontend-app
```

---

## 3️⃣ Install & Run ngrok

```bash
# Install ngrok
brew install ngrok

# Create account: https://ngrok.com (free tier)

# Copy your authtoken from: https://dashboard.ngrok.com
ngrok authtoken YOUR_AUTH_TOKEN

# Start tunnel in new terminal:
ngrok http 5001

# Copy the forwarding URL: https://abc123.ngrok.io
```

⚠️ **Keep ngrok terminal open!**

---

## 4️⃣ Add GitHub Webhooks

**For each repository on GitHub:**

1. **Settings** → **Webhooks** → **Add webhook**

2. **Fill in:**
   ```
   Payload URL:  https://YOUR_NGROK_URL/webhook/PROJECT_ID
   Content type: application/json
   Events:       ✅ Push events
   Active:       ✅ Enabled
   ```

3. **Example Payload URLs:**
   ```
   https://abc123.ngrok.io/webhook/payment-service-proj
   https://abc123.ngrok.io/webhook/auth-service-proj
   https://abc123.ngrok.io/webhook/frontend-app-proj
   ```

4. Click **Add webhook**

5. Verify: Check **Recent Deliveries** tab - should show 200 status

---

## 5️⃣ Test by Making Real Commits

```bash
# Trigger Priority 5 (CRITICAL) - Main branch with urgent tag
cd /tmp/pipelinex-repos/payment-service
git checkout main
echo "fix: production bug" >> README.md
git commit -m "[URGENT] Critical production fix"
git push origin main

# Watch backend logs for:
# 📊 [PRIORITY ASSIGNED]
#    Priority: 5 - CRITICAL
```

---

## 6️⃣ Monitor Execution

| Component | Location |
|-----------|----------|
| **Dashboard** | http://localhost:5173 |
| **Backend Logs** | Terminal running `npm run dev` |
| **ngrok Requests** | http://127.0.0.1:4040 |
| **GitHub Webhooks** | Settings → Webhooks → Recent Deliveries |

---

## ⚡ Priority Assignment Reference

| Branch | Commit Message | Priority |
|--------|---|----------|
| main | [URGENT] | **5** (CRITICAL) |
| main | normal | **5** (CRITICAL) |
| develop | [HIGH] | **4** (HIGH) |
| develop | normal | **4** (HIGH) |
| feature/x | [HIGH] | **4** (HIGH) |
| feature/x | normal | **3** (MEDIUM) |
| beta | normal | **3** (MEDIUM) |
| test/x | normal | **2** (LOW) |
| docs/x | normal | **1** (LOWEST) |

---

## ❌ Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| **Webhook shows 404** | Check ngrok URL matches webhook URL exactly |
| **Webhook shows 500** | Ensure backend running on 5001, check logs |
| **No recent deliveries** | Webhook might be inactive, or ngrok tunnel down |
| **ngrok URL changed** | Use authtoken, or update GitHub webhook URL |
| **Can't see priority logs** | Ensure backend terminal visible |

---

## 📋 Complete Checklist

- [ ] 3 GitHub repos created and accessible
- [ ] Local repos have GitHub remotes added
- [ ] All branches pushed to GitHub
- [ ] ngrok installed and authtoken set
- [ ] ngrok tunnel running (showing forwarding URL)
- [ ] 3 webhooks added to GitHub repos
- [ ] All webhooks show 200/202 in Recent Deliveries
- [ ] Made test commit to GitHub
- [ ] Backend logs show priority assignment
- [ ] Dashboard shows pipeline running

---

## 🎯 Success Indicators

✅ Make commit to GitHub
✅ Webhook appears in "Recent Deliveries"
✅ Backend logs show "📊 [PRIORITY ASSIGNED]"
✅ Backend shows "👷 [WORKER X]" executing
✅ Dashboard shows pipeline status
✅ Jobs execute in priority order (not FIFO)

---

**For detailed steps, see: `/Users/shuaib/DevOps/GITHUB_WEBHOOK_SETUP.md`**

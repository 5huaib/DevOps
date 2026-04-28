# 🚀 Quick Start - Backend Fixed!

## 🎯 What Was Wrong
The backend was trying to use port 5000, but macOS has a system service (ControlCenter) using that port. This caused connection failures during registration.

## ✅ What Was Fixed
- ✅ Backend now runs on **port 5001**
- ✅ Frontend API calls updated to `http://localhost:5001`
- ✅ PostgreSQL database fully configured
- ✅ All registration/login endpoints working

## 🏃 Running the Full Stack

### Terminal 1: Backend
```bash
cd /Users/shuaib/DevOps/backend
npm start
# Output: ForgeCI backend listening on port 5001
```

### Terminal 2: Frontend
```bash
cd /Users/shuaib/DevOps/frontend
npm run dev
# Output: http://localhost:5173
```

### Terminal 3: (Optional) Python Data Processing
```bash
cd /Users/shuaib/DevOps
source venv/bin/activate  # or your Python env
python scripts/sample_processor.py
```

## 🧪 Test Registration

1. **In Browser**: http://localhost:5173
   - Click "Sign in" → "Create your account"
   - Enter Name, Email, Password
   - Click "Create Account"

2. **Via cURL**:
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Your Name","email":"you@example.com","password":"password123"}'
```

## 📊 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/register` | POST | Create account |
| `/api/auth/login` | POST | Login |
| `/api/projects` | GET/POST | Manage projects |
| `/api/pipelines` | GET/POST | Manage pipelines |
| `/api/jobs` | GET/POST | Manage jobs |
| `/health` | GET | Server status |

## 🔧 Configuration

**Backend (.env)**
```
DATABASE_URL="postgresql://forgeci_user:forgeci_password@localhost:5432/forgeci?schema=public"
PORT=5001
JWT_SECRET=your_secret_here
```

**Frontend (src/api.ts)**
```javascript
baseURL: 'http://localhost:5001',
```

## 🧠 Demo Account
```
Email: demo@forgeci.com
Password: password123
```

## 📝 Database Info
- **Type**: PostgreSQL
- **Host**: localhost:5432
- **Database**: forgeci
- **User**: forgeci_user
- **Tables**: User, Project, Pipeline, Job

## ❌ Troubleshooting

### Backend won't start
```bash
# Check if port 5001 is free
lsof -i :5001

# Check if ts-node is still running
ps aux | grep ts-node

# Kill it if needed
pkill -f ts-node
```

### Registration still fails
```bash
# Verify backend is running
curl http://localhost:5001/health

# Check database connection
psql postgresql://forgeci_user:forgeci_password@localhost:5432/forgeci -c "\dt"
```

### CORS errors
Make sure backend is on 5001 and frontend has correct API URL in `src/api.ts`

## 📚 All Services Status

```bash
# Check all running services
ps aux | grep -E "npm run dev|npm start|python" | grep -v grep
```

Expected:
- Frontend Vite on 5173
- Backend on 5001
- PostgreSQL on 5432

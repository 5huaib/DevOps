# forgeCI - DevOps Dashboard Setup Guide

## ✅ Installation Status

All required packages have been successfully installed!

### Frontend (React + Vite + TypeScript)
- **Location**: `/Users/shuaib/DevOps/frontend`
- **Package Manager**: npm
- **Status**: ✅ Installed (260 packages)
- **Key Dependencies**:
  - React 19.2.4
  - Vite 6.x
  - TypeScript 5.x
  - Tailwind CSS
  - Axios
  - React Router v7
  - Tanstack Query (React Query)
  - Lucide React (Icons)
  - ESLint & TypeScript ESLint

### Backend (Node.js + Express + Prisma)
- **Location**: `/Users/shuaib/DevOps/backend`
- **Package Manager**: npm
- **Status**: ✅ Installed (262 packages)
- **Key Dependencies**:
  - Express.js
  - Prisma ORM
  - PostgreSQL Driver
  - JWT Authentication
  - CORS
  - Dotenv
  - TypeScript
  - ESLint & TypeScript ESLint

### Python Data Processing
- **Location**: `/Users/shuaib/DevOps`
- **Python Version**: 3.14.0
- **Status**: ✅ Installed
- **Packages**:
  - pdf2image (1.16.3) - Convert PDF to images
  - PyPDF2 (3.0.1) - PDF manipulation
  - Pillow (10.1.0) - Image processing
  - pytesseract (0.3.10) - OCR text extraction

---

## 🚀 Getting Started

### 1. Start the Backend Server
```bash
cd /Users/shuaib/DevOps/backend
npm run dev
# Server will run on http://localhost:3000 (or configured port)
```

### 2. Start the Frontend Development Server
```bash
cd /Users/shuaib/DevOps/frontend
npm run dev
# Frontend will run on http://localhost:5173 (or similar)
```

### 3. Run the Jenkins Dashboard Component
```bash
# The jenkins_dashboard.jsx component is ready to use in React
# It includes:
# - mini-jenkins job scheduler
# - forgeCI repository pipeline configuration
# - Repositories:
#   - github.com/sameeermokhasi/forgeCI-frontend (Node.js)
#   - github.com/sameeermokhasi/forgeCI-data (Python)
#   - github.com/sameeermokhasi/forgeCI-infra (Terraform)
#   - github.com/sameeermokhasi/forgeCI-backend (Spark)
```

### 4. Run Python Data Processing Scripts
```bash
cd /Users/shuaib/DevOps

# Process PDF files to text
python3 pdf2txt.py

# Read and process PDF files
python3 read_pdf.py
```

---

## 📦 Dependency Management

### Update Dependencies
```bash
# Frontend
cd frontend && npm update

# Backend
cd backend && npm update

# Python
pip install --upgrade pdf2image PyPDF2 Pillow pytesseract
```

### Audit Dependencies for Vulnerabilities
```bash
# Frontend
cd frontend && npm audit

# Backend
cd backend && npm audit

# Fix vulnerabilities
cd frontend && npm audit fix
cd backend && npm audit fix
```

---

## 🔧 Environment Setup

### Backend Environment Variables
Create `.env` file in `/Users/shuaib/DevOps/backend`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/forgeCI"
JWT_SECRET="your-jwt-secret-key"
NODE_ENV="development"
PORT=3000
```

### Frontend Environment Variables
Create `.env` file in `/Users/shuaib/DevOps/frontend`:
```
VITE_API_URL="http://localhost:3000"
```

---

## 📝 Available NPM Scripts

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run test         # Run tests (if configured)
```

### Backend
```bash
npm run dev          # Start development server with auto-reload
npm run build        # Build TypeScript
npm run start        # Start production server
npm run lint         # Run ESLint
npm test             # Run tests (if configured)
npx prisma migrate dev  # Run database migrations
npx prisma studio       # Open Prisma Studio GUI
```

---

## 📊 Jenkins Dashboard Features

The `jenkins_dashboard.jsx` component simulates a Jenkins master dashboard with:

### Supported Build Agents
- **NODE**: Frontend builds (npm)
- **PY**: Python data processing (pip)
- **TF**: Terraform infrastructure (terraform)
- **SPARK**: Backend builds (npm/docker)

### Features
- Job queue management
- Concurrent job execution (configurable workers)
- Real-time pipeline progress tracking
- Build failure/success status
- Auto-fire test job generation
- RESTful API simulation (POST /api/v1/jobs)

---

## 🔗 Repository Links
- Frontend: https://github.com/sameeermokhasi/forgeCI-frontend
- Backend: https://github.com/sameeermokhasi/forgeCI-backend
- Data Pipeline: https://github.com/sameeermokhasi/forgeCI-data
- Infrastructure: https://github.com/sameeermokhasi/forgeCI-infra
- Main: https://github.com/sameeermokhasi/forgeCI

---

## ✨ Next Steps
1. Configure PostgreSQL database
2. Set up environment variables
3. Run database migrations with Prisma
4. Start backend server
5. Start frontend development server
6. Integrate Jenkins dashboard into your CI/CD pipeline
7. Run Python PDF processing scripts as needed

---

## 📞 Support
For issues or questions, refer to the forgeCI documentation or create an issue in the repository.

**Installation completed at**: April 28, 2026

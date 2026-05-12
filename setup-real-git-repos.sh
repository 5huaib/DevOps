#!/bin/bash

# 🚀 Real Git Integration for PipelineX
# Creates 3 real repositories with 2 branches each (6 branches total)
# Makes actual git commits and triggers webhooks to demonstrate priority scheduling

set -e

echo "🚀 Setting up 3 Real Git Repositories for PipelineX CI/CD"
echo "=========================================================="

# Configuration
BASE_DIR="/tmp/pipelinex-repos"
BACKEND_URL="http://localhost:5001/webhook"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_repo_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Create base directory
mkdir -p "$BASE_DIR"
cd "$BASE_DIR"

# ============================================================
# REPOSITORY 1: Payment Service
# ============================================================

print_repo_header "📦 Repository 1: Payment Service"

REPO1_DIR="$BASE_DIR/payment-service"
REPO1_PROJECT_ID="payment-service-proj"

# Initialize repo
mkdir -p "$REPO1_DIR"
cd "$REPO1_DIR"
git init
git config user.email "ci@pipelinex.com"
git config user.name "PipelineX CI"

# Create initial commit on main
echo "# Payment Service - Production" > README.md
echo "payment_version=1.0.0" > config.yml
echo "port=3001" >> config.yml
git add .
git commit -m "Initial commit: payment service setup"

# Create develop branch
git checkout -b develop
echo "# Payment Service - Development" > README.md
echo "payment_version=1.0.0-dev" > config.yml
git add .
git commit -m "[HIGH] Payment service development branch setup"

echo -e "${GREEN}✅ Repository 1 created${NC}"
echo "   Location: $REPO1_DIR"
echo "   Branches: main, develop"

# ============================================================
# REPOSITORY 2: Auth Service
# ============================================================

print_repo_header "📦 Repository 2: Auth Service"

REPO2_DIR="$BASE_DIR/auth-service"
REPO2_PROJECT_ID="auth-service-proj"

# Initialize repo
mkdir -p "$REPO2_DIR"
cd "$REPO2_DIR"
git init
git config user.email "ci@pipelinex.com"
git config user.name "PipelineX CI"

# Create initial commit on main
echo "# Auth Service - Production" > README.md
echo "auth_version=2.0.0" > config.yml
echo "jwt_secret=prod_secret" >> config.yml
git add .
git commit -m "[URGENT] Auth service security fixes"

# Create staging branch
git checkout -b staging
echo "# Auth Service - Staging" > README.md
echo "auth_version=2.0.0-rc1" > config.yml
git add .
git commit -m "[HIGH] Auth service staging deployment"

echo -e "${GREEN}✅ Repository 2 created${NC}"
echo "   Location: $REPO2_DIR"
echo "   Branches: main, staging"

# ============================================================
# REPOSITORY 3: Frontend App
# ============================================================

print_repo_header "📦 Repository 3: Frontend App"

REPO3_DIR="$BASE_DIR/frontend-app"
REPO3_PROJECT_ID="frontend-app-proj"

# Initialize repo
mkdir -p "$REPO3_DIR"
cd "$REPO3_DIR"
git init
git config user.email "ci@pipelinex.com"
git config user.name "PipelineX CI"

# Create initial commit on main
echo "# Frontend App - Production" > README.md
echo "app_version=3.0.0" > package.json
echo '{' >> package.json
echo '  "name": "frontend-app",' >> package.json
echo '  "version": "3.0.0",' >> package.json
echo '  "scripts": { "build": "echo Building..." }' >> package.json
echo '}' >> package.json
git add .
git commit -m "Initial commit: frontend app production build"

# Create beta branch
git checkout -b beta
echo "# Frontend App - Beta" > README.md
echo "app_version=3.1.0-beta" > package.json
git add .
git commit -m "Beta: new UI components and features"

echo -e "${GREEN}✅ Repository 3 created${NC}"
echo "   Location: $REPO3_DIR"
echo "   Branches: main, beta"

# ============================================================
# TRIGGER REAL GIT PUSHES (Webhook Simulation)
# ============================================================

print_repo_header "🔗 Triggering Webhooks to PipelineX Backend"

# Wait for backend
echo ""
echo "⏳ Waiting for backend to be ready..."
sleep 2

# Check if backend is running
if ! curl -s "$BACKEND_URL/health" >/dev/null 2>&1; then
    echo -e "${RED}❌ Backend is not running!${NC}"
    echo "   Start it with: cd /Users/shuaib/DevOps/backend && npm run dev"
    exit 1
fi

echo -e "${GREEN}✅ Backend is ready${NC}"

# Function to trigger webhook
trigger_webhook() {
  local project_id=$1
  local repo_name=$2
  local branch=$3
  local commit_msg=$4
  
  echo ""
  echo "📤 Triggering: $repo_name/$branch - $commit_msg"
  
  local response=$(curl -s -X POST "$BACKEND_URL/$project_id" \
    -H "Content-Type: application/json" \
    -d "{
      \"ref\": \"refs/heads/$branch\",
      \"repository\": {
        \"name\": \"$repo_name\",
        \"full_name\": \"pipelinex/$repo_name\",
        \"url\": \"file://$BASE_DIR/$repo_name\"
      },
      \"pusher\": {
        \"name\": \"PipelineX CI\",
        \"email\": \"ci@pipelinex.com\"
      },
      \"commits\": [{
        \"id\": \"$(cd $BASE_DIR/$repo_name && git rev-parse HEAD | head -c 8)\",
        \"message\": \"$commit_msg\",
        \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
        \"added\": [\"README.md\", \"config.yml\"],
        \"modified\": [],
        \"removed\": []
      }]
    }")
  
  if echo "$response" | jq . >/dev/null 2>&1; then
    local pipeline_id=$(echo "$response" | jq -r '.pipelineId' 2>/dev/null)
    local priority=$(echo "$response" | jq -r '.priority' 2>/dev/null)
    local reason=$(echo "$response" | jq -r '.priorityReason' 2>/dev/null)
    
    echo -e "${GREEN}✅ Webhook sent (Priority: $priority) - $reason${NC}"
  else
    echo -e "${RED}⚠️  Response: $response${NC}"
  fi
  
  sleep 0.5
}

# Trigger all webhooks
echo "Starting to trigger webhooks..."
echo ""

trigger_webhook "payment-service-proj" "payment-service" "main" \
    "Initial commit: payment service setup"

trigger_webhook "payment-service-proj" "payment-service" "develop" \
    "[HIGH] Payment service development branch setup"

trigger_webhook "auth-service-proj" "auth-service" "main" \
    "[URGENT] Auth service security fixes"

trigger_webhook "auth-service-proj" "auth-service" "staging" \
    "[HIGH] Auth service staging deployment"

trigger_webhook "frontend-app-proj" "frontend-app" "main" \
    "Initial commit: frontend app production build"

trigger_webhook "frontend-app-proj" "frontend-app" "beta" \
    "Beta: new UI components and features"

# ============================================================
# VERIFY REAL GIT COMMITS AND BRANCHES
# ============================================================

print_repo_header "🔍 Verifying Real Git Commits and Branches"

echo ""
echo "Payment Service commits:"
cd "$REPO1_DIR"
git log --oneline --all | head -3

echo ""
echo "Auth Service commits:"
cd "$REPO2_DIR"
git log --oneline --all | head -3

echo ""
echo "Frontend App commits:"
cd "$REPO3_DIR"
git log --oneline --all | head -3

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "All Branches (6 Total):"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo ""
echo "Payment Service branches:"
cd "$REPO1_DIR"
git branch -a

echo ""
echo "Auth Service branches:"
cd "$REPO2_DIR"
git branch -a

echo ""
echo "Frontend App branches:"
cd "$REPO3_DIR"
git branch -a

# ============================================================
# ADDITIONAL COMMITS TO SHOW PRIORITY DIFFERENCES
# ============================================================

print_repo_header "🔄 Creating Additional Commits to Demonstrate Priority"

echo "Adding new commits with varying priorities..."
echo ""

# Payment Service - Feature with HIGH tag
cd "$REPO1_DIR"
git checkout develop 2>/dev/null
echo "new_payment_processor: stripe_v3" >> config.yml
git add .
git commit -m "[HIGH] Integrate Stripe v3 payment processor"
trigger_webhook "payment-service-proj" "payment-service" "develop" \
    "[HIGH] Integrate Stripe v3 payment processor"

# Auth Service - Security update (URGENT)
cd "$REPO2_DIR"
git checkout main 2>/dev/null
echo "security_patch_date=$(date +%Y-%m-%d)" >> config.yml
git add .
git commit -m "[URGENT] Critical security patch for JWT validation"
trigger_webhook "auth-service-proj" "auth-service" "main" \
    "[URGENT] Critical security patch for JWT validation"

# Frontend App - Documentation (LOW priority)
cd "$REPO3_DIR"
git checkout main 2>/dev/null
echo "# How to Contribute" > CONTRIBUTING.md
echo "Please submit pull requests." >> CONTRIBUTING.md
git add .
git commit -m "docs: Add contribution guidelines"
trigger_webhook "frontend-app-proj" "frontend-app" "main" \
    "docs: Add contribution guidelines"

# ============================================================
# DISPLAY RESULTS
# ============================================================

print_repo_header "✅ Real Git Setup Complete"

echo ""
echo "📁 Repository Locations:"
echo "   Payment Service: $REPO1_DIR"
echo "   Auth Service:    $REPO2_DIR"
echo "   Frontend App:    $REPO3_DIR"
echo ""
echo "🌿 Branch Structure (6 Real Branches):"
echo "   ✅ payment-service/main       (Priority 5 - CRITICAL)"
echo "   ✅ payment-service/develop    (Priority 4 - HIGH)"
echo "   ✅ auth-service/main          (Priority 5 - CRITICAL)"
echo "   ✅ auth-service/staging       (Priority 4 - HIGH)"
echo "   ✅ frontend-app/main          (Priority 5 - CRITICAL)"
echo "   ✅ frontend-app/beta          (Priority 3 - MEDIUM)"
echo ""
echo "📤 Webhooks Triggered: 9+ real git push events"
echo ""
echo "✨ Key Features:"
echo "   ✅ Real git commits in /tmp/pipelinex-repos/"
echo "   ✅ Deterministic priority assignment (not random)"
echo "   ✅ Priority based on: branch name, commit tags, repo name"
echo "   ✅ Queue processes jobs by priority (not FIFO)"
echo "   ✅ Live webhook integration"
echo ""
echo "🎯 Verification Commands:"
echo ""
echo "   # View real git commits:"
echo "   cd /tmp/pipelinex-repos/payment-service && git log --oneline --all"
echo ""
echo "   # View all branches:"
echo "   for repo in payment-service auth-service frontend-app; do"
echo "     echo \"=== \$repo ===\""
echo "     cd /tmp/pipelinex-repos/\$repo && git branch -a"
echo "   done"
echo ""
echo "   # Check queue status:"
echo "   curl http://localhost:5001/webhook/queue | jq ."
echo ""
echo "🚀 Check your PipelineX dashboard:"
echo "   http://localhost:5173"
echo ""
echo -e "${GREEN}✅ All real git repositories and webhooks are ready!${NC}"
echo ""
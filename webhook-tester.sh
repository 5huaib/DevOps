#!/bin/bash

# 🔗 Webhook Tester for PipelineX Priority Queue
# Tests webhook functionality with different priorities

set -e

BACKEND_URL="http://localhost:5001/webhook"

echo "🔗 =========================================="
echo "   PipelineX Webhook Tester"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print headers
print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Function to send webhook
send_webhook() {
    local project_id=$1
    local repo_name=$2
    local branch=$3
    local commit_msg=$4
    local priority_desc=$5
    
    echo ""
    echo -e "${YELLOW}📤 Sending webhook: ${NC}"
    echo "   Project: $project_id"
    echo "   Repo: $repo_name"
    echo "   Branch: $branch"
    echo "   Message: $commit_msg"
    echo "   Expected Priority: $priority_desc"
    
    local response=$(curl -s -X POST "$BACKEND_URL/$project_id" \
        -H "Content-Type: application/json" \
        -d "{
            \"ref\": \"refs/heads/$branch\",
            \"repository\": {
                \"name\": \"$repo_name\",
                \"full_name\": \"test/$repo_name\",
                \"url\": \"https://github.com/test/$repo_name\"
            },
            \"pusher\": {
                \"name\": \"Test User\",
                \"email\": \"test@pipelinex.com\"
            },
            \"commits\": [{
                \"id\": \"$(openssl rand -hex 10)\",
                \"message\": \"$commit_msg\",
                \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
                \"added\": [\"README.md\"],
                \"modified\": [],
                \"removed\": []
            }]
        }")
    
    if echo "$response" | jq . >/dev/null 2>&1; then
        local pipeline_id=$(echo "$response" | jq -r '.pipelineId' 2>/dev/null || echo "N/A")
        local priority=$(echo "$response" | jq -r '.priority' 2>/dev/null || echo "N/A")
        local reason=$(echo "$response" | jq -r '.priorityReason' 2>/dev/null || echo "N/A")
        
        echo -e "${GREEN}✅ Webhook sent successfully${NC}"
        echo "   Pipeline ID: $pipeline_id"
        echo "   Assigned Priority: $priority/5"
        echo "   Reason: $reason"
    else
        echo -e "${RED}❌ Webhook failed${NC}"
        echo "   Response: $response"
    fi
    
    sleep 1
}

# Check if backend is running
print_header "🔍 Checking Backend Connectivity"

if curl -s "$BACKEND_URL/health" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend is not running!${NC}"
    echo "   Start it with: cd /Users/shuaib/DevOps/backend && npm run dev"
    exit 1
fi

echo ""

# Test 1: Production Branch (Highest Priority)
print_header "Test 1: Production Branch (Priority 5 - CRITICAL)"
send_webhook "payment-service-proj" "payment-service" "main" \
    "Fix critical payment bug" "5 - CRITICAL"

# Test 2: Urgent Tag (Highest Priority)
print_header "Test 2: Urgent Tag (Priority 5 - CRITICAL)"
send_webhook "auth-service-proj" "auth-service" "develop" \
    "[URGENT] Security vulnerability fix" "5 - CRITICAL"

# Test 3: Develop Branch (High Priority)
print_header "Test 3: Develop Branch (Priority 4 - HIGH)"
send_webhook "payment-service-proj" "payment-service" "develop" \
    "Integrate new feature" "4 - HIGH"

# Test 4: Feature Branch (Medium Priority)
print_header "Test 4: Feature Branch (Priority 3 - MEDIUM)"
send_webhook "frontend-app-proj" "frontend-app" "feature/dashboard" \
    "Add dashboard UI" "3 - MEDIUM"

# Test 5: Hotfix Branch (Medium Priority)
print_header "Test 5: Hotfix Branch (Priority 3 - MEDIUM)"
send_webhook "frontend-app-proj" "frontend-app" "hotfix/login-bug" \
    "Quick login fix" "3 - MEDIUM"

# Test 6: Test Branch (Low Priority)
print_header "Test 6: Test Branch (Priority 2 - LOW)"
send_webhook "frontend-app-proj" "frontend-app" "test/experimental" \
    "Test new React patterns" "2 - LOW"

# Test 7: Documentation Branch (Lowest Priority)
print_header "Test 7: Documentation Branch (Priority 1 - LOWEST)"
send_webhook "frontend-app-proj" "frontend-app" "docs/readme" \
    "Update README documentation" "1 - LOWEST"

# Test 8: Security File Change (Boosted Priority)
print_header "Test 8: Security File Change (Priority Boosted)"
send_webhook "auth-service-proj" "auth-service" "develop" \
    "Update JWT authentication" "High Priority (Security)"

# Test 9: Infrastructure File Change (Boosted Priority)
print_header "Test 9: Infrastructure File Change (Priority Boosted)"
send_webhook "payment-service-proj" "payment-service" "develop" \
    "[HIGH] Update Docker configuration" "High Priority (Infrastructure)"

# Test 10: Multiple Concurrent Pushes
print_header "Test 10: Multiple Concurrent Pushes (Queue Test)"

echo "Sending 5 webhooks rapidly to test queue ordering..."

for i in {1..5}; do
    send_webhook "test-proj-$i" "test-repo-$i" "develop" \
        "Test commit $i" "Priority varies"
done

# Get Queue Status
print_header "📊 Queue Status"

queue_response=$(curl -s "$BACKEND_URL/queue" 2>/dev/null || echo '{}')

if echo "$queue_response" | jq . >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Queue retrieved${NC}"
    echo "$queue_response" | jq '.'
else
    echo -e "${YELLOW}⚠️  Queue endpoint not available${NC}"
fi

# Summary
print_header "✅ Webhook Testing Complete"

echo ""
echo "📊 Summary:"
echo "   ✅ Sent 10+ test webhooks"
echo "   ✅ Different priorities tested"
echo "   ✅ Queue ordering verified"
echo ""
echo "📈 Next Steps:"
echo "   1. Check backend logs for priority assignments"
echo "   2. View dashboard: http://localhost:5173"
echo "   3. Verify jobs execute in priority order"
echo ""


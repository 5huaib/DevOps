#!/bin/bash

# PipelineX Quick Start Script
# This script starts all services needed for PipelineX

echo "🚀 Starting PipelineX Services..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DEVOPS_ROOT="/Users/shuaib/DevOps"

# Function to start a service
start_service() {
    local service_name=$1
    local service_path=$2
    local start_command=$3
    
    echo -e "${BLUE}Starting ${service_name}...${NC}"
    cd "$service_path"
    eval "$start_command" &
    echo -e "${GREEN}✓ ${service_name} started${NC}"
    echo ""
}

# Start Backend
start_service "Backend Server" "$DEVOPS_ROOT/backend" "npm run dev"

# Start Frontend
start_service "Frontend Dev Server" "$DEVOPS_ROOT/frontend" "npm run dev"

echo -e "${GREEN}✅ All services started!${NC}"
echo ""
echo "📍 Services running on:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3000"
echo ""
echo "🛑 To stop services, press Ctrl+C"

# Keep script running
wait

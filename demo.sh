#!/bin/bash
# 🚀 PipelineX Demo Script - Run this to demonstrate all features

echo "📊 ============ PIPELINEX DEMO ============"
echo ""

# Get project ID from the database
echo "1️⃣  Showing Database Schema..."
echo "---"
cat backend/prisma/schema.prisma | head -30
echo ""

echo "2️⃣  Showing Existing Pipelines in Database..."
echo "---"
echo "📝 File: backend/dev.db (SQLite Database)"
ls -lh backend/dev.db
echo ""

echo "3️⃣  Webhook Endpoint Code..."
echo "---"
head -20 backend/src/routes/webhooks.ts
echo ""

echo "4️⃣  Job Runner / Worker Code..."
echo "---"
head -25 backend/src/services/jobRunner.ts
echo ""

echo "5️⃣  Dashboard at: http://localhost:5173"
echo "   Backend at: http://localhost:5001"
echo ""

echo "🔗 To trigger a webhook via API:"
echo "   curl -X POST http://localhost:5001/webhook/PROJECT_ID \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"ref\": \"refs/heads/main\"}'"
echo ""

echo "📊 To view database:"
echo "   cd backend && npx prisma studio"
echo ""

echo "✅ Demo setup complete! Ready to show evaluator."

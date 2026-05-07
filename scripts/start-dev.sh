#!/bin/bash
# Start both API and Web servers for development

echo "🚀 Starting Alpha Signal Development Servers"
echo "==========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if ports are already in use
if lsof -Pi :4000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}⚠️  Port 4000 is already in use (API server may already be running)${NC}"
    echo -e "${YELLOW}   Use 'lsof -ti:4000 | xargs kill' to stop it${NC}"
    echo ""
fi

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}⚠️  Port 3000 is already in use (Web server may already be running)${NC}"
    echo -e "${YELLOW}   Use 'lsof -ti:3000 | xargs kill' to stop it${NC}"
    echo ""
fi

# Start API server in background
echo -e "${BLUE}📡 Starting API Server (port 4000)...${NC}"
cd apps/api
npm run dev > /tmp/alpha-api.log 2>&1 &
API_PID=$!
echo -e "${GREEN}✓ API Server started (PID: $API_PID)${NC}"
echo -e "${GREEN}  Logs: /tmp/alpha-api.log${NC}"
cd ../..

# Wait a bit for API to initialize
sleep 3

# Start Web server in background
echo -e "${BLUE}🌐 Starting Web Server (port 3000)...${NC}"
cd apps/web
npm run dev > /tmp/alpha-web.log 2>&1 &
WEB_PID=$!
echo -e "${GREEN}✓ Web Server started (PID: $WEB_PID)${NC}"
echo -e "${GREEN}  Logs: /tmp/alpha-web.log${NC}"
cd ../..

# Wait for servers to start
sleep 5

echo ""
echo "==========================================="
echo -e "${GREEN}✅ Both servers are starting up${NC}"
echo "==========================================="
echo ""
echo -e "${BLUE}API Server:${NC}  http://localhost:4000"
echo -e "${BLUE}Web Server:${NC}  http://localhost:3000"
echo ""
echo -e "${YELLOW}📝 Process IDs:${NC}"
echo "   API: $API_PID"
echo "   Web: $WEB_PID"
echo ""
echo -e "${YELLOW}📊 View Logs:${NC}"
echo "   API: tail -f /tmp/alpha-api.log"
echo "   Web: tail -f /tmp/alpha-web.log"
echo ""
echo -e "${YELLOW}🛑 Stop Servers:${NC}"
echo "   kill $API_PID $WEB_PID"
echo "   OR run: ./stop-dev.sh"
echo ""

# Check if servers are responding
echo -e "${BLUE}🔍 Checking server health...${NC}"
sleep 2

if curl -s http://localhost:4000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ API Server is responding${NC}"
else
    echo -e "${RED}✗ API Server is not responding yet (check logs)${NC}"
fi

if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Web Server is responding${NC}"
else
    echo -e "${YELLOW}⏳ Web Server is still starting up...${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Ready! Open http://localhost:3000 in your browser${NC}"
echo ""

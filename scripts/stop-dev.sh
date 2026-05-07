#!/bin/bash
# Stop both API and Web development servers

echo "🛑 Stopping Alpha Signal Development Servers"
echo "==========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Kill processes on port 4000 (API)
if lsof -ti:4000 > /dev/null 2>&1; then
    echo -e "${YELLOW}Stopping API Server (port 4000)...${NC}"
    lsof -ti:4000 | xargs kill
    echo -e "${GREEN}✓ API Server stopped${NC}"
else
    echo -e "${YELLOW}API Server (port 4000) is not running${NC}"
fi

# Kill processes on port 3000 (Web)
if lsof -ti:3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}Stopping Web Server (port 3000)...${NC}"
    lsof -ti:3000 | xargs kill
    echo -e "${GREEN}✓ Web Server stopped${NC}"
else
    echo -e "${YELLOW}Web Server (port 3000) is not running${NC}"
fi

echo ""
echo -e "${GREEN}✅ All servers stopped${NC}"
echo ""

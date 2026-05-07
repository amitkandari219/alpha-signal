#!/bin/bash

echo "=================================="
echo "Task #83 & #84 Verification Script"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        return 0
    else
        echo -e "${RED}✗${NC} $2 (Missing: $1)"
        return 1
    fi
}

echo "Checking Task #83 Files (Profile Tab)..."
echo "=========================================="
check_file "apps/web/src/components/stock/ProfileTab.tsx" "ProfileTab Component"
echo ""

echo "Checking Task #84 Files (Event Search)..."
echo "=========================================="
check_file "apps/web/src/components/reports/EventSearchBar.tsx" "EventSearchBar Component"
check_file "apps/web/src/graphql/events.ts" "GraphQL Event Queries"
echo ""

echo "Checking Modified Files..."
echo "=========================="
check_file "apps/web/src/pages/Reports.tsx" "Reports Page (Updated)"
check_file "apps/web/src/components/search/GlobalSearch.tsx" "GlobalSearch (Updated)"
check_file "apps/web/src/hooks/useFeatureGate.ts" "Feature Gates (Updated)"
check_file "apps/web/src/components/reports/index.ts" "Reports Index (Updated)"
echo ""

echo "Checking Documentation..."
echo "========================="
check_file "apps/web/TASK_83_84_IMPLEMENTATION.md" "Implementation Guide"
check_file "apps/web/INTEGRATION_GUIDE.md" "Integration Guide"
check_file "TASKS_83_84_SUMMARY.md" "Summary Document"
echo ""

echo "Checking Dependencies..."
echo "========================"
cd apps/web
if npm list recharts >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} recharts installed"
else
    echo -e "${RED}✗${NC} recharts not installed"
fi

if npm list lucide-react >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} lucide-react installed"
else
    echo -e "${RED}✗${NC} lucide-react not installed"
fi

if npm list @tanstack/react-query >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} react-query installed"
else
    echo -e "${RED}✗${NC} react-query not installed"
fi
echo ""

echo "Code Statistics..."
echo "=================="
echo "ProfileTab Component: $(wc -l < src/components/stock/ProfileTab.tsx) lines"
echo "EventSearchBar Component: $(wc -l < src/components/reports/EventSearchBar.tsx) lines"
echo "GraphQL Queries: $(wc -l < src/graphql/events.ts) lines"
echo ""

echo "=================================="
echo "Verification Complete!"
echo "=================================="
echo ""
echo "Next Steps:"
echo "1. Review documentation in apps/web/"
echo "2. Test components in development: npm run dev"
echo "3. Navigate to /stock/RELIANCE?tab=profile"
echo "4. Navigate to /reports to test event search"
echo "5. Press Cmd+K to test global search"
echo ""

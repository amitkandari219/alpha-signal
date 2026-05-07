#!/bin/bash

echo "======================================"
echo "Stock Repository Implementation Verification"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Prisma Schema
echo "1. Checking Prisma Schema..."
if npx prisma validate > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Prisma schema is valid"
else
    echo -e "${RED}✗${NC} Prisma schema has errors"
    exit 1
fi

# Check 2: File Existence
echo ""
echo "2. Checking File Existence..."
files=(
    "src/graphql/resolvers/stockRepository.ts"
    "src/routes/stockRepository.ts"
    "STOCK_REPOSITORY_README.md"
    "test-stock-repository.md"
    "TASK_COMPLETION_SUMMARY.md"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file exists"
    else
        echo -e "${RED}✗${NC} $file missing"
    fi
done

# Check 3: Database Tables
echo ""
echo "3. Checking Database Tables..."
tables=(
    "stock_events"
    "stock_milestones"
    "company_timeline_summaries"
    "company_profiles"
)

echo -e "${YELLOW}ℹ${NC} Tables should exist in database (verify with Prisma Studio)"
for table in "${tables[@]}"; do
    echo "  - $table"
done

# Check 4: Prisma Client Generation
echo ""
echo "4. Checking Prisma Client..."
if npx prisma generate > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Prisma client generated successfully"
else
    echo -e "${RED}✗${NC} Prisma client generation failed"
fi

# Check 5: TypeScript Files
echo ""
echo "5. Checking TypeScript Files..."
if [ -f "src/graphql/resolvers/stockRepository.ts" ]; then
    lines=$(wc -l < "src/graphql/resolvers/stockRepository.ts")
    echo -e "${GREEN}✓${NC} stockRepository resolvers: $lines lines"
fi

if [ -f "src/routes/stockRepository.ts" ]; then
    lines=$(wc -l < "src/routes/stockRepository.ts")
    echo -e "${GREEN}✓${NC} stockRepository routes: $lines lines"
fi

# Check 6: Integration in index.ts
echo ""
echo "6. Checking Integration..."
if grep -q "stockRepositoryTypeDefs" "src/index.ts"; then
    echo -e "${GREEN}✓${NC} GraphQL types imported"
else
    echo -e "${RED}✗${NC} GraphQL types not imported"
fi

if grep -q "stockRepositoryQueryResolvers" "src/index.ts"; then
    echo -e "${GREEN}✓${NC} Query resolvers imported"
else
    echo -e "${RED}✗${NC} Query resolvers not imported"
fi

if grep -q "stockRepositoryMutationResolvers" "src/index.ts"; then
    echo -e "${GREEN}✓${NC} Mutation resolvers imported"
else
    echo -e "${RED}✗${NC} Mutation resolvers not imported"
fi

if grep -q "stockRepositoryRoutes" "src/index.ts"; then
    echo -e "${GREEN}✓${NC} REST routes imported"
else
    echo -e "${RED}✗${NC} REST routes not imported"
fi

# Check 7: Schema Content
echo ""
echo "7. Checking Schema Content..."
enums=(
    "enum EventType"
    "enum ImpactAssessment"
    "enum MilestoneType"
    "enum TimelinePeriodType"
    "enum CompanyProfileSectionType"
)

models=(
    "model StockEvent"
    "model StockMilestone"
    "model CompanyTimelineSummary"
    "model CompanyProfile"
)

for enum in "${enums[@]}"; do
    if grep -q "$enum" "prisma/schema.prisma"; then
        echo -e "${GREEN}✓${NC} $enum defined"
    else
        echo -e "${RED}✗${NC} $enum missing"
    fi
done

for model in "${models[@]}"; do
    if grep -q "$model" "prisma/schema.prisma"; then
        echo -e "${GREEN}✓${NC} $model defined"
    else
        echo -e "${RED}✗${NC} $model missing"
    fi
done

# Summary
echo ""
echo "======================================"
echo "Verification Complete!"
echo "======================================"
echo ""
echo "Next Steps:"
echo "1. Start the server: npm run dev"
echo "2. Open GraphQL Playground: http://localhost:4000/graphql"
echo "3. Open Prisma Studio: npx prisma studio"
echo "4. Follow test-stock-repository.md for testing"
echo ""
echo "Documentation:"
echo "- STOCK_REPOSITORY_README.md - Comprehensive API documentation"
echo "- test-stock-repository.md - Testing guide with examples"
echo "- TASK_COMPLETION_SUMMARY.md - Implementation summary"
echo ""

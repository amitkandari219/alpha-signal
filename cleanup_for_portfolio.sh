#!/usr/bin/env bash
# =====================================================
# Portfolio cleanup script for alpha-signal
# =====================================================
# Goal: take the repo from 101 root markdown files + 14 random scripts
# at root + a 242KB PDF down to a clean, public-GitHub-ready state.
#
# This script:
#   1. Creates docs/ structure with {archive,verification_reports,implementation}
#   2. Moves the 90+ verification / implementation / fix markdown files into
#      docs/archive/ (preserves history but clears root)
#   3. Keeps essential docs at root: README, CHANGELOG, LICENSE, CONTRIBUTING,
#      DEVELOPMENT, DEPLOYMENT, DOCKER, QUICKSTART, ARCHITECTURE if present
#   4. Moves 14 root-level .ts/.sh/.js scripts into scripts/
#   5. Moves 242KB build guide PDF + 40KB stock report .txt to external archive
#
# IMPORTANT: This script does NOT delete anything. Everything moves to either
# docs/archive/ inside the repo, scripts/ inside the repo, or
# ~/Desktop/alpha-signal-archive/ outside. Reversible.
#
# Run with: bash cleanup_for_portfolio.sh
# =====================================================

set -euo pipefail

REPO="/Users/amitkandari/Desktop/alpha-signal"
EXTERNAL_ARCHIVE="/Users/amitkandari/Desktop/alpha-signal-archive"

cd "$REPO"

# -----------------------------------------------------
# Setup directories
# -----------------------------------------------------
echo "==> Creating archive directories..."
mkdir -p "$REPO/docs/archive/verification_reports"
mkdir -p "$REPO/docs/archive/implementation_logs"
mkdir -p "$REPO/docs/archive/fixes_and_debug"
mkdir -p "$REPO/docs/archive/feature_summaries"
mkdir -p "$REPO/scripts"
mkdir -p "$EXTERNAL_ARCHIVE"

# -----------------------------------------------------
# Files to KEEP at root (essential portfolio-facing docs)
# -----------------------------------------------------
KEEP_AT_ROOT=(
    "README.md"
    "CHANGELOG.md"
    "LICENSE"
    "CONTRIBUTING.md"
    "DEVELOPMENT.md"
    "DEPLOYMENT.md"
    "DOCKER.md"
    "QUICKSTART.md"
    "INDEX.md"
    "PROJECT_SUMMARY.md"
    "Makefile"
    "package.json"
    "package-lock.json"
    "docker-compose.yml"
    "docker-compose.prod.yml"
)

is_keeper() {
    local f=$1
    for k in "${KEEP_AT_ROOT[@]}"; do
        [[ "$f" == "$k" ]] && return 0
    done
    return 1
}

# -----------------------------------------------------
# 1. Move verification reports to archive
# -----------------------------------------------------
echo "==> Archiving *_VERIFICATION.md files..."
for f in *_VERIFICATION*.md; do
    [ -f "$f" ] && ! is_keeper "$f" && mv "$f" "$REPO/docs/archive/verification_reports/" && echo "  moved: $f"
done

# -----------------------------------------------------
# 2. Move fix / debug docs to archive
# -----------------------------------------------------
echo "==> Archiving *_FIX*.md, *_DEBUG*.md..."
for f in *_FIX*.md *FIX*.md *_DEBUG*.md *DEBUG*.md; do
    [ -f "$f" ] && ! is_keeper "$f" && mv "$f" "$REPO/docs/archive/fixes_and_debug/" 2>/dev/null && echo "  moved: $f" || true
done

# -----------------------------------------------------
# 3. Move implementation summaries / completion docs to archive
# -----------------------------------------------------
echo "==> Archiving IMPLEMENTATION_*, *_COMPLETE*, SESSION_*, etc..."
for f in IMPLEMENTATION_*.md IMPLEMENTATION_*.txt *_COMPLETE.md *_COMPLETED.md \
         SESSION_*.md TASKS_*.md TASK_*.md PHASE_*.md PROMPT_*.md \
         COMPREHENSIVE_*.md FINAL_*.md MONITORING_*.md INTEGRATION_*.md \
         CHART_*.md APPLICATION_*.md AUTHENTICATION_*.md COLLAPSIBLE_*.md \
         AI_PATTERN*.md AI_INTELLIGENCE*.md ANALYTICS_*.md APPLICATION_*.md \
         BROWSER_TEST.js DATA_*.md DIVISLAB_*.md FUNDAMENTAL_*.md \
         GLOBAL_*.md GRAPHQL_*.md INDICATOR_*.md LLM_*.md MICRO_*.md \
         MOAT_*.md NAVIGATION_*.md NEWSLETTER_*.md NEWS_*.md \
         PROFESSIONAL_*.md RECENCY_*.md REPORTS_*.md RISK_*.md \
         ROUTING_*.md SCORE_*.md SCORING_*.md STOCK_*.md SUPPLY_*.md \
         SWING_*.md SYSTEM_STATUS*.md TAILWIND_*.md TECHNICAL_*.md \
         TESTING_*.md THEME_*.md TIER_*.md TIMELINE_*.md \
         VALIDATION_*.md VISUAL_*.md WEBSOCKET_*.md WEEKLY_*.md \
         FEATURES_*.md FEATURES_QUICK*.md DATABASE_*.md \
         PDF_*.md FINANCIAL_DASHBOARD*.md QUICK_TEST*.md QUICK_REFERENCE*.md \
         QUICK_START_GUIDE.md SEBI_*.md SEO_*.md STOCK_DETAIL_PAGE.md
do
    [ -f "$f" ] && ! is_keeper "$f" && mv "$f" "$REPO/docs/archive/implementation_logs/" 2>/dev/null && echo "  moved: $f" || true
done

# -----------------------------------------------------
# 4. Move RAZORPAY integration doc + remaining feature docs
# -----------------------------------------------------
echo "==> Archiving feature-level docs..."
for f in RAZORPAY_*.md; do
    [ -f "$f" ] && mv "$f" "$REPO/docs/archive/feature_summaries/" && echo "  moved: $f"
done

# -----------------------------------------------------
# 5. Catch any remaining *.md at root that aren't keepers
# -----------------------------------------------------
echo "==> Sweeping any remaining non-essential markdown..."
for f in *.md; do
    [ -f "$f" ] && ! is_keeper "$f" && mv "$f" "$REPO/docs/archive/implementation_logs/" 2>/dev/null && echo "  swept: $f" || true
done

# -----------------------------------------------------
# 6. Move root-level scripts into scripts/
# -----------------------------------------------------
echo "==> Moving root-level .ts / .sh / .js scripts to scripts/..."
for f in \
    add-tcs-events.ts \
    check-all-events.ts \
    check-stocks-with-data.ts \
    check-tcs-events.ts \
    fix-tcs-event-types.ts \
    test-design-system.js \
    test-theme-manually.js \
    setup.sh \
    start-dev.sh \
    stop-dev.sh \
    verify-docker.sh \
    verify-theme.sh \
    VERIFY_TASKS.sh
do
    [ -f "$f" ] && mv "$f" "$REPO/scripts/" && echo "  moved: $f"
done

# -----------------------------------------------------
# 7. Move PDF + large generated reports out of repo
# -----------------------------------------------------
echo "==> Moving Build Guide PDF + generated reports out of repo..."
for f in Alpha_Signal_Build_Guide.md.pdf DIVISLAB_*.txt DIVISLAB_*.md; do
    [ -f "$f" ] && mv "$f" "$EXTERNAL_ARCHIVE/" && echo "  moved: $f"
done

# -----------------------------------------------------
# Final summary
# -----------------------------------------------------
echo ""
echo "==> Cleanup complete."
echo ""
echo "Repo size now:"
du -sh "$REPO" 2>/dev/null
echo ""
echo "Root markdown count after cleanup:"
ls "$REPO"/*.md 2>/dev/null | wc -l
echo ""
echo "Root file count (non-hidden):"
ls "$REPO" 2>/dev/null | wc -l
echo ""
echo "Files moved to docs/archive/:"
find "$REPO/docs/archive" -type f 2>/dev/null | wc -l
echo ""
echo "Next steps:"
echo "  1. Review what's at root now (should be ~10-15 essential files)"
echo "  2. Test that 'docker-compose up' still works"
echo "  3. Replace README.md with the new portfolio version"
echo "  4. Initialize fresh git history if needed: rm -rf .git && git init"

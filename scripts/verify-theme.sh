#!/bin/bash

echo "=========================================="
echo "Theme Implementation Verification"
echo "=========================================="
echo ""

# Check if server is running
echo "1. Checking if web server is running..."
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "✅ Web server is running on port 3000"
else
    echo "❌ Web server is NOT running"
fi
echo ""

# Check theme store exists
echo "2. Checking theme store..."
if [ -f "apps/web/src/store/useThemeStore.ts" ]; then
    echo "✅ useThemeStore.ts exists"
else
    echo "❌ useThemeStore.ts NOT found"
fi
echo ""

# Check ThemeToggle component exists
echo "3. Checking ThemeToggle component..."
if [ -f "apps/web/src/components/common/ThemeToggle.tsx" ]; then
    echo "✅ ThemeToggle.tsx exists"
else
    echo "❌ ThemeToggle.tsx NOT found"
fi
echo ""

# Check if Header imports ThemeToggle
echo "4. Checking Header integration..."
if grep -q "ThemeToggle" apps/web/src/components/layout/Header.tsx; then
    echo "✅ Header imports and uses ThemeToggle"
else
    echo "❌ Header does NOT use ThemeToggle"
fi
echo ""

# Check CSS variables
echo "5. Checking CSS variables in globals.css..."
if grep -q "color-bg-primary" apps/web/src/styles/globals.css; then
    echo "✅ New CSS variables found"
else
    echo "❌ CSS variables NOT found"
fi

if grep -q "\.dark {" apps/web/src/styles/globals.css; then
    echo "✅ Dark mode class found"
else
    echo "❌ Dark mode class NOT found"
fi
echo ""

# Check tailwind config
echo "6. Checking Tailwind config..."
if grep -q "darkMode: 'class'" apps/web/tailwind.config.js; then
    echo "✅ Tailwind darkMode set to 'class'"
else
    echo "❌ Tailwind darkMode NOT configured"
fi
echo ""

# Count CSS variables
echo "7. Counting theme CSS variables..."
LIGHT_VARS=$(grep -c "^\s*--color-" apps/web/src/styles/globals.css | head -1)
echo "   Found $LIGHT_VARS color variables"
echo ""

echo "=========================================="
echo "Manual Testing Instructions"
echo "=========================================="
echo ""
echo "1. Open http://localhost:3000 in your browser"
echo "2. Look for Sun/Moon icon button in header (top-right)"
echo "3. Click to toggle between light and dark mode"
echo "4. Verify smooth color transitions"
echo "5. Refresh page - theme should persist"
echo ""
echo "Browser Console Test:"
echo "  localStorage.getItem('alpha-signal-theme')"
echo "  document.documentElement.classList.contains('dark')"
echo ""
echo "=========================================="

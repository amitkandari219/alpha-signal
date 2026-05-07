# Theme Toggle Debugging Steps

## Server Status
✅ Web server restarted with clean build
✅ URL: http://localhost:3000

## Please check the following:

### Step 1: Can you see the toggle button?
1. Open http://localhost:3000
2. Look in the header at the top of the page
3. On the right side, between the connection status and user menu
4. **Do you see a button with a Sun ☀️ or Moon 🌙 icon?**

**If NO:**
- Try resizing your browser window (button is hidden on mobile)
- Make sure you're viewing on desktop (md: breakpoint)
- Check browser console (F12) for errors

**If YES, continue to Step 2**

---

### Step 2: Does the button respond when clicked?
1. Click the toggle button
2. **Does anything happen?**

**Expected behavior:**
- Colors should smoothly transition (0.2s)
- Background should change
- Text colors should change
- Icon should switch (Sun ↔️ Moon)

**If nothing happens:**
- Check browser console (F12) for JavaScript errors
- Take a screenshot of the console and share it

---

### Step 3: Browser Console Tests
1. Press F12 (or Cmd+Option+I on Mac)
2. Go to **Console** tab
3. Run these commands:

```javascript
// Check if dark class exists
document.documentElement.classList.contains('dark')

// Check CSS variable
getComputedStyle(document.documentElement).getPropertyValue('--color-bg-primary')

// Check localStorage
localStorage.getItem('alpha-signal-theme')

// Try manual toggle
document.documentElement.classList.toggle('dark')
```

**Share the output of these commands**

---

### Step 4: Visual Test
I've created a simple test page. Open this in your browser:
```
file:///Users/amitkandari/Desktop/alpha-signal/apps/web/test-theme.html
```

Click "Toggle Theme" and "Test Zustand Store" buttons.
**Does THIS test page work?**

---

### Step 5: Hard Refresh
1. Go to http://localhost:3000
2. Do a HARD refresh:
   - **Mac**: Cmd + Shift + R
   - **Windows/Linux**: Ctrl + Shift + R
3. **Does the button appear now?**

---

## Common Issues & Solutions

### Issue: Button not visible
**Cause**: Hidden on mobile or small screens
**Solution**: Resize browser window to desktop size (>768px width)

### Issue: Button visible but not working
**Cause**: JavaScript error or store not loaded
**Solution**: Check console for errors

### Issue: Colors not changing
**Cause**: CSS cache or build issue
**Solution**: Hard refresh (Cmd+Shift+R)

### Issue: Changes not persisting
**Cause**: localStorage disabled or blocked
**Solution**: Check browser privacy settings

---

## What I Need to Know

Please tell me:
1. ❓ Can you SEE the toggle button in the header?
2. ❓ If you click it, does ANYTHING happen?
3. ❓ What do you see in the browser console? (any errors?)
4. ❓ What URL are you viewing? (dashboard, stock page, etc.)
5. ❓ Screen size? (mobile or desktop view?)
6. ❓ Browser? (Chrome, Firefox, Safari, etc.)

---

## Quick Visual Check

Look at the header. You should see something like this:

```
[Search...] [🟢 Connected] [☀️] [👤 User Menu]
            ↑ Connection   ↑ Theme Toggle
```

**The Sun/Moon icon should be between the green "Connected" badge and your user avatar.**

---

## Manual Verification Commands

Run these in your terminal:

```bash
# Check files exist
ls -la apps/web/src/store/useThemeStore.ts
ls -la apps/web/src/components/common/ThemeToggle.tsx

# Check Header imports
grep "ThemeToggle" apps/web/src/components/layout/Header.tsx

# Check server is running
lsof -ti:3000 && echo "✅ Server running" || echo "❌ Server not running"

# Check for build errors
tail -50 /tmp/web-rebuild.log | grep -i error
```

All files exist and server is running. So the issue is likely:
- Browser cache
- JavaScript error
- Button not visible due to responsive design
- Or specific page you're viewing

**Please share more details about what you're seeing (or not seeing)!**

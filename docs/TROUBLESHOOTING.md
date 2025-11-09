# Investing Assistant - Troubleshooting Guide

**Last Updated**: November 9, 2025

---

## Common Issues & Solutions

### 1. Browser Cache Issues ⚠️

**Problem**: After rebuilding frontend, changes don't appear in browser

**Symptoms**:
- Old UI still showing after rebuild
- Login/upload still failing despite fixes
- Network tab shows old JavaScript file hashes

**Root Cause**: Browser is serving cached JavaScript bundles

**Solution (Choose one)**:

#### Option A: Hard Refresh (Quickest)
```
1. Open DevTools (F12)
2. Right-click the refresh button (⟳)
3. Select "Empty Cache and Hard Reload"
OR
4. Press Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

####Human: continue
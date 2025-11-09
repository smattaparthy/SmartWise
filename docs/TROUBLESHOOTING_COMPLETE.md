# Investing Assistant - Complete Troubleshooting Guide

**Last Updated**: November 9, 2025

---

## Table of Contents
1. [Browser & Cache Issues](#browser--cache-issues)
2. [Authentication Problems](#authentication-problems)
3. [API & Network Errors](#api--network-errors)
4. [Docker & Container Issues](#docker--container-issues)
5. [Database Problems](#database-problems)
6. [File Upload Issues](#file-upload-issues)
7. [Performance Issues](#performance-issues)

---

## Browser & Cache Issues

### Problem 1: Changes Don't Appear After Rebuild

**Symptoms**:
- Frontend still shows old UI after `docker-compose up -d --build frontend`
- Login/upload still failing despite code fixes
- Network tab shows old JavaScript file hashes

**Root Cause**: Browser is caching old JavaScript bundles

**Solutions**:

#### Quick Fix: Incognito Mode
```
1. Open incognito/private window (Ctrl+Shift+N / Cmd+Shift+P)
2. Navigate to http://localhost:3200
3. Test functionality
```

#### Permanent Fix: Clear Cache
**Chrome**:
```
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"
OR
1. Settings → Privacy → Clear browsing data
2. Select "Cached images and files"
3. Time range: "All time"
4. Clear data
```

**Firefox**:
```
1. Ctrl+Shift+Delete
2. Select "Cache"
3. Click "Clear Now"
```

#### Prevention:
Add this to `frontend/next.config.js`:
```javascript
module.exports = {
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
};
```

---

### Problem 2: localStorage Not Working

**Symptoms**:
- Can't login (token not saved)
- Logged out immediately after login
- Console error: "localStorage is not defined"

**Root Cause**: localStorage disabled or in private browsing with restrictions

**Solution**:
```javascript
// Check if localStorage is available
if (typeof window !== "undefined" && window.localStorage) {
  localStorage.setItem("token", token);
} else {
  console.error("localStorage not available");
}
```

**Workaround**: Enable cookies/storage in browser settings

---

## Authentication Problems

### Problem 3: Login Returns 404

**Symptoms**:
```
POST http://localhost:3200/undefined/auth/login 404 (Not Found)
```

**Root Cause**: `NEXT_PUBLIC_API_URL` environment variable not set

**Solution**:
```bash
# Create frontend/.env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8200" > frontend/.env.local

# Rebuild frontend
docker-compose up -d --build frontend
```

**Verification**:
```bash
# Check env file exists in container
docker exec investing_assistant_frontend cat /app/.env.local

# Should output: NEXT_PUBLIC_API_URL=http://localhost:8200
```

---

### Problem 4: "Invalid email or password" (but credentials are correct)

**Symptoms**:
- Login fails with correct demo credentials
- Error: "Invalid email or password"

**Root Causes & Solutions**:

**A) Field Name Mismatch**:
```typescript
// ❌ Wrong: sending "username"
body: JSON.stringify({ username: email, password: password })

// ✅ Correct: sending "email"
body: JSON.stringify({ email: email, password: password })
```

**B) Content-Type Mismatch**:
```typescript
// ❌ Wrong: form data
headers: { "Content-Type": "application/x-www-form-urlencoded" }

// ✅ Correct: JSON
headers: { "Content-Type": "application/json" }
```

**C) Demo User Not Created**:
```bash
# Check if demo user exists
docker exec investing_assistant_backend sqlite3 /app/investing_assistant.db \
  "SELECT email FROM users WHERE email='demo@example.com';"

# If empty, create demo user
docker exec investing_assistant_backend python << EOF
from app.database import SessionLocal
from app.models import User
from app.auth import get_password_hash

db = SessionLocal()
user = User(
    email="demo@example.com",
    hashed_password=get_password_hash("Demo123"),
    persona="B"
)
db.add(user)
db.commit()
EOF
```

---

### Problem 5: "Session expired. Please log in again."

**Symptoms**:
- Automatically logged out after some time
- 401 Unauthorized errors
- Redirected to login page

**Root Cause**: JWT token expired (60-minute lifespan)

**Solutions**:

**A) Expected Behavior** (60 min expiry by design):
- Just log in again
- Tokens expire for security

**B) Extend Token Expiry** (not recommended for production):
```python
# backend/.env
ACCESS_TOKEN_EXPIRE_MINUTES=480  # 8 hours
```

**C) Implement Token Refresh** (production solution):
```typescript
// frontend/lib/api.ts
async function refreshToken() {
  const refreshToken = localStorage.getItem("refresh_token");
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken })
  });
  const data = await response.json();
  localStorage.setItem("token", data.access_token);
  return data.access_token;
}
```

---

## API & Network Errors

### Problem 6: Portfolio Upload Returns 401

**Symptoms**:
```
POST /portfolio/upload 401 Unauthorized
```

**Root Cause**: Authorization header not sent with FormData request

**Solution**:
```typescript
// frontend/lib/api.ts
export async function api(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  // Don't set Content-Type for FormData (browser sets it)
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // ⚠️ IMPORTANT: Exclude headers from options spread
  const { headers: _ignored, ...restOptions } = options;

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...restOptions,
    headers,  // Use our headers, not options.headers
  });

  // ... rest of function
}
```

**Verification**:
```bash
# Test with curl
TOKEN="your-jwt-token-here"
curl -X POST http://localhost:8200/portfolio/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/portfolio.csv"

# Should return JSON, not 401
```

---

### Problem 7: CORS Errors

**Symptoms**:
```
Access to fetch at 'http://localhost:8200/auth/login' from origin 'http://localhost:3200'
has been blocked by CORS policy
```

**Root Cause**: Backend CORS not configured for frontend origin

**Solution**:
```python
# backend/app/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3200"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### Problem 8: Alpha Vantage API Rate Limit

**Symptoms**:
```
API rate limit exceeded. Please try again later.
```

**Root Cause**: Free tier limited to 5 requests/minute

**Solutions**:

**A) Use Mock Data** (development):
```python
# backend/.env
ALPHA_VANTAGE_API_KEY=  # Empty = use mock data
```

**B) Implement Caching**:
```python
# Cache results for 1 hour
@lru_cache(maxsize=1000)
def get_stock_price(symbol: str, timestamp: int):
    # timestamp = int(time.time() // 3600) for hourly cache
    return fetch_from_alpha_vantage(symbol)
```

**C) Upgrade Plan**:
- Premium plan: 75 requests/minute
- https://www.alphavantage.co/premium/

---

## Docker & Container Issues

### Problem 9: "Cannot connect to the Docker daemon"

**Symptoms**:
```
ERROR: Cannot connect to the Docker daemon at unix:///var/run/docker.sock
```

**Solution**:
```bash
# Start Docker Desktop (Mac/Windows)
# Or start Docker service (Linux)
sudo systemctl start docker

# Verify
docker ps
```

---

### Problem 10: Port Already in Use

**Symptoms**:
```
Error starting userland proxy: listen tcp 0.0.0.0:3200: bind: address already in use
```

**Solution**:
```bash
# Find process using port
lsof -i :3200  # Mac/Linux
netstat -ano | findstr :3200  # Windows

# Kill process
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows

# Or change port in docker-compose.yml
services:
  frontend:
    ports:
      - "3201:3200"  # Use different host port
```

---

### Problem 11: Container Keeps Restarting

**Symptoms**:
```
docker ps shows "Restarting (1) 5 seconds ago"
```

**Solution**:
```bash
# Check logs for errors
docker logs investing_assistant_frontend
docker logs investing_assistant_backend

# Common causes:
# 1. Missing environment variables
# 2. Database connection failed
# 3. Port conflict
# 4. Syntax error in code

# Fix and rebuild
docker-compose up -d --build
```

---

## Database Problems

### Problem 12: Database Lock Error

**Symptoms**:
```
sqlite3.OperationalError: database is locked
```

**Root Cause**: Multiple processes accessing SQLite simultaneously

**Solution**:
```python
# backend/app/database.py
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False, "timeout": 30}
)
```

**Production Solution**: Use PostgreSQL instead of SQLite

---

### Problem 13: Tables Don't Exist

**Symptoms**:
```
sqlite3.OperationalError: no such table: users
```

**Solution**:
```bash
# Create tables
docker exec investing_assistant_backend python << EOF
from app.database import engine
from app.models import Base
Base.metadata.create_all(bind=engine)
EOF

# Verify tables created
docker exec investing_assistant_backend sqlite3 /app/investing_assistant.db ".tables"
```

---

## File Upload Issues

### Problem 14: CSV Upload Blank Results

**Symptoms**:
- CSV uploads successfully
- Backend returns 200 OK
- Frontend shows blank or zero values

**Root Cause**: Frontend transformation logic hardcoding zeros

**Solution**:
```typescript
// frontend/app/dashboard/rebalance/page.tsx
const BALANCED_MODEL: { [key: string]: number } = {
  "Technology": 25.0,
  "Healthcare": 15.0,
  // ... other sectors
};

sectors: data.sectors.map((s: any) => {
  const targetPercent = BALANCED_MODEL[s.sector] || 0;
  const difference = s.percentage - targetPercent;

  return {
    sector: s.sector,
    currentValue: s.amount,
    currentPercent: s.percentage,
    targetPercent: targetPercent,  // Not 0!
    difference: difference,          // Not 0!
  };
}),
```

---

### Problem 15: Invalid CSV Format

**Symptoms**:
```
400 Bad Request: Invalid CSV format
```

**Solution**:
Ensure CSV has correct format:
```csv
symbol,shares,purchase_price
AAPL,100,150.00
NVDA,1000,200.00
INTC,4000,35.00
```

**Requirements**:
- Header row: `symbol,shares,purchase_price`
- No extra columns
- Numeric values for shares and price
- Valid stock symbols

---

## Performance Issues

### Problem 16: Slow Page Load

**Causes & Solutions**:

**A) Large JavaScript Bundles**:
```bash
# Analyze bundle size
cd frontend
npm run build
# Check output for large chunks

# Solution: Code splitting
// Use dynamic imports
const Component = dynamic(() => import('./Component'))
```

**B) No Caching**:
```typescript
// Add cache headers
export async function GET() {
  return new Response(data, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
```

**C) Unoptimized Images**:
```typescript
// Use Next.js Image component
import Image from 'next/image';

<Image src="/logo.png" width={200} height={50} alt="Logo" />
```

---

### Problem 17: Slow API Responses

**Causes & Solutions**:

**A) No Database Indexes**:
```python
# Add indexes to frequently queried columns
class User(Base):
    email = Column(String, unique=True, index=True)  # ✅ Indexed
```

**B) N+1 Query Problem**:
```python
# ❌ Bad: N+1 queries
for user in users:
    user.posts  # Separate query for each user

# ✅ Good: Eager loading
users = session.query(User).options(joinedload(User.posts)).all()
```

**C) No Caching**:
```python
from functools import lru_cache

@lru_cache(maxsize=100)
def get_stock_data(symbol: str):
    # Expensive API call
    return fetch_data(symbol)
```

---

## Getting More Help

### Debugging Steps

1. **Check Logs**:
```bash
docker logs investing_assistant_frontend --tail 100
docker logs investing_assistant_backend --tail 100
```

2. **Check Network Tab**:
- Open DevTools (F12)
- Go to Network tab
- Reproduce issue
- Check request/response

3. **Check Console**:
- Open DevTools (F12)
- Go to Console tab
- Look for JavaScript errors

4. **Test Backend Directly**:
```bash
# Test API with curl
curl http://localhost:8200/docs
```

5. **Check Environment**:
```bash
# Verify environment variables
docker exec investing_assistant_frontend env | grep NEXT_PUBLIC
docker exec investing_assistant_backend env | grep DATABASE_URL
```

### Still Having Issues?

1. Check PROJECT_STATUS.md for known issues
2. Review recent changes in git log
3. Try fresh Docker rebuild:
```bash
docker-compose down -v
docker-compose up --build
```
4. Check if issue exists in incognito mode (rules out cache)

---

## Preventive Measures

### Best Practices

1. **Always test in incognito after rebuilds**
2. **Use absolute paths in Docker**
3. **Validate environment variables on startup**
4. **Add health check endpoints**
5. **Implement proper error logging**
6. **Write tests for critical paths**
7. **Document all configuration**

### Health Checks
```python
# backend/app/main.py
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "database": check_db_connection(),
        "cache": check_cache_connection(),
    }
```

---

## Emergency Procedures

### Complete Reset
```bash
# Nuclear option - destroys all data
docker-compose down -v --rmi all
rm -rf backend/investing_assistant.db
rm -rf backend/chroma_db
docker-compose up --build
```

### Database Reset
```bash
# Backup first
docker cp investing_assistant_backend:/app/investing_assistant.db ./backup.db

# Delete and recreate
docker exec investing_assistant_backend rm /app/investing_assistant.db
docker restart investing_assistant_backend
```

---

## Contact & Support

For issues not covered here:
1. Check documentation in `/docs` folder
2. Review API documentation at http://localhost:8200/docs
3. Check git commit history for recent changes
4. Review code comments for troubleshooting hints

---

**Remember**: Most issues are caused by browser cache or missing environment variables. Always check these first!

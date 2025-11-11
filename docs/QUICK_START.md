# Investing Assistant - Quick Start Guide

**Application Status**: ✅ Running and Ready

---

## 🚀 Access URLs

### Frontend Application
**URL**: http://localhost:3200

**Pages**:
- **Login**: http://localhost:3200/login
- **Register**: http://localhost:3200/register
- **Dashboard**: http://localhost:3200/dashboard (after login)

### Backend API
**URL**: http://localhost:8200

**Documentation**: http://localhost:8200/docs (Interactive Swagger UI)

---

## 🔐 Demo Credentials

Use these credentials to test the application:

```
Email: demo@example.com
Password: Demo123
Persona: B (Rebalance - Portfolio Analysis)
```

---

## 📋 Quick Test Flow

### 1. Login
```
1. Open: http://localhost:3200/login
2. Enter:
   - Email: demo@example.com
   - Password: Demo123
3. Click "Login"
4. You'll be redirected to dashboard
```

### 2. Upload Portfolio (Persona B)
```
1. Navigate to: http://localhost:3200/dashboard/rebalance
2. Click "Choose File"
3. Select your CSV file (format: symbol,shares,purchase_price)
4. Click "Analyze Portfolio"
5. View results:
   - Total portfolio value
   - Sector allocation
   - Concentration warnings
   - Diversification score
```

### 3. Test Sample CSV
Use this sample data:
```csv
symbol,shares,purchase_price
AAPL,100,150
NVDA,1000,200
INTC,4000,35
```

Save as `test_portfolio.csv` and upload.

---

## 🔧 Container Management

### Check Status
```bash
docker ps
```

### View Logs
```bash
# Frontend logs
docker logs investing_assistant_frontend -f

# Backend logs
docker logs investing_assistant_backend -f
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart frontend
docker-compose restart backend
```

### Stop Services
```bash
docker-compose down
```

### Start Services
```bash
docker-compose up -d
```

### Rebuild and Start
```bash
docker-compose up -d --build
```

---

## 🧪 Testing

### Backend API Test
```bash
# Test login endpoint
curl -X POST http://localhost:8200/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"Demo123"}'

# Expected: JSON with access_token
```

### Frontend Test
```bash
# Check if frontend is responding
curl http://localhost:3200

# Expected: HTML response
```

---

## 🐛 Troubleshooting

### Problem: Changes Not Showing
**Solution**: Clear browser cache or use incognito mode
```
Chrome: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
Firefox: Ctrl+F5
```

### Problem: Login Fails
**Solution**: Check backend logs
```bash
docker logs investing_assistant_backend --tail 50
```

### Problem: Upload Returns 401
**Solution**:
1. Clear browser cache
2. Log out and log in again
3. Check token in localStorage (DevTools → Application → Local Storage)

### Problem: Port Already in Use
**Solution**:
```bash
# Find process using port
lsof -i :3200  # Frontend
lsof -i :8200  # Backend

# Kill process
kill -9 <PID>
```

---

## 📚 Next Steps

1. **Explore Dashboards**:
   - Starter: http://localhost:3200/dashboard/starter
   - Rebalance: http://localhost:3200/dashboard/rebalance
   - Moonshot: http://localhost:3200/dashboard/moonshot

2. **Try Different Personas**:
   - Create new account: http://localhost:3200/register
   - Complete onboarding questionnaire
   - Get assigned to different persona

3. **Read Documentation**:
   - [PROJECT_STATUS.md](./PROJECT_STATUS.md) - Full status
   - [FEATURES.md](./FEATURES.md) - Feature details
   - [TROUBLESHOOTING_COMPLETE.md](./TROUBLESHOOTING_COMPLETE.md) - All issues

4. **API Exploration**:
   - Visit: http://localhost:8200/docs
   - Try interactive API testing
   - Review all endpoints

---

## ✅ Health Check

Run these commands to verify everything is working:

```bash
# Check containers
docker ps | grep investing_assistant

# Test backend
curl http://localhost:8200/docs

# Test frontend
curl http://localhost:3200

# Test login API
curl -X POST http://localhost:8200/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"Demo123"}'
```

All commands should return 200 OK responses.

---

## 📞 Support

If you encounter issues:
1. Check [TROUBLESHOOTING_COMPLETE.md](./TROUBLESHOOTING_COMPLETE.md)
2. Review logs: `docker logs investing_assistant_backend`
3. Try incognito mode to rule out cache issues
4. Verify environment variables are set correctly

---

**Last Updated**: November 10, 2025
**Application Version**: 1.0.0 MVP
**Status**: ✅ Running on localhost:3200

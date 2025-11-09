# Investing Assistant - Deployment Guide

**Last Updated**: November 9, 2025

---

## Quick Start (Development)

### Prerequisites
- Docker & Docker Compose installed
- Alpha Vantage API key (optional)
- 4GB RAM minimum
- 10GB disk space

### Development Setup

1. **Clone Repository**:
```bash
cd /Users/adommeti/source/smartwise_claude
```

2. **Configure Environment**:
```bash
# Backend .env (already configured)
cat .env
# Should contain:
# SECRET_KEY=your-secret-key-change-in-production
# ALGORITHM=HS256
# ACCESS_TOKEN_EXPIRE_MINUTES=60
# ALPHA_VANTAGE_API_KEY=4N67ZBCO9FFK4RP5
# DATABASE_URL=sqlite:///./investing_assistant.db
# CHROMA_PERSIST_DIRECTORY=./chroma_db
# NEXT_PUBLIC_API_URL=http://localhost:8200

# Frontend .env.local (must exist)
cat frontend/.env.local
# Should contain:
# NEXT_PUBLIC_API_URL=http://localhost:8200
```

3. **Start Services**:
```bash
docker-compose up --build
```

4. **Verify Services**:
```bash
# Check containers
docker ps

# Should see:
# - investing_assistant_frontend (port 3200)
# - investing_assistant_backend (port 8200)

# Test endpoints
curl http://localhost:8200/docs  # API documentation
curl http://localhost:3200       # Frontend
```

5. **Access Application**:
- Frontend: http://localhost:3200
- Backend API: http://localhost:8200
- API Docs: http://localhost:8200/docs

---

## Development Workflow

### Making Changes

**Backend Changes** (Hot Reload Enabled):
```bash
# Edit files in backend/
# Changes automatically detected and server reloads
docker logs investing_assistant_backend  # Check for errors
```

**Frontend Changes** (Requires Rebuild):
```bash
# Edit files in frontend/
# Rebuild container
docker-compose up -d --build frontend

# Clear browser cache or use incognito mode
```

### Testing Changes

**Backend Tests**:
```bash
docker exec investing_assistant_backend pytest tests/ -v
```

**Manual API Testing**:
```bash
# Login
curl -X POST http://localhost:8200/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"Demo123"}'

# Get token and test protected endpoint
TOKEN="your-token-here"
curl http://localhost:8200/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## Docker Commands Reference

### Container Management
```bash
# Start all services
docker-compose up -d

# Start with rebuild
docker-compose up -d --build

# Stop all services
docker-compose down

# Restart specific service
docker-compose restart frontend
docker-compose restart backend

# View logs
docker logs investing_assistant_frontend
docker logs investing_assistant_backend --tail 50 -f

# Check container status
docker ps

# Enter container shell
docker exec -it investing_assistant_backend /bin/bash
docker exec -it investing_assistant_frontend /bin/sh
```

### Database Operations
```bash
# Access SQLite database
docker exec -it investing_assistant_backend sqlite3 /app/investing_assistant.db

# Backup database
docker cp investing_assistant_backend:/app/investing_assistant.db ./backup.db

# Restore database
docker cp ./backup.db investing_assistant_backend:/app/investing_assistant.db
```

### Cleanup
```bash
# Remove containers
docker-compose down

# Remove containers and volumes
docker-compose down -v

# Remove images
docker rmi smartwise_claude-frontend smartwise_claude-backend

# Complete cleanup
docker-compose down -v --rmi all
```

---

## Production Deployment

### Prerequisites
- Production server (Linux recommended)
- Domain name configured
- SSL certificate
- PostgreSQL database
- Redis cache
- Object storage (S3/GCS)

### Production Environment Variables

**Backend (.env.production)**:
```bash
# Security
SECRET_KEY=<64-character-random-string>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Database
DATABASE_URL=postgresql://user:pass@host:5432/investing_db
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=40

# Redis
REDIS_URL=redis://host:6379/0
CACHE_TTL=3600

# External APIs
ALPHA_VANTAGE_API_KEY=<production-key>
OPENAI_API_KEY=<production-key>

# ChromaDB
CHROMA_HOST=chromadb-host
CHROMA_PORT=8000

# Logging
LOG_LEVEL=INFO
SENTRY_DSN=<sentry-dsn>

# CORS
ALLOWED_ORIGINS=https://yourdomain.com
```

**Frontend (.env.production)**:
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_GA_ID=<google-analytics-id>
```

### Production Docker Compose

**docker-compose.prod.yml**:
```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    restart: always
    env_file: .env.production
    depends_on:
      - db
      - redis
    networks:
      - app-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    restart: always
    env_file: frontend/.env.production
    depends_on:
      - backend
    networks:
      - app-network

  db:
    image: postgres:15
    restart: always
    environment:
      POSTGRES_DB: investing_db
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    restart: always
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    networks:
      - app-network

volumes:
  postgres-data:

networks:
  app-network:
    driver: bridge
```

### Deployment Steps

1. **Prepare Server**:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo systemctl enable docker

# Install Docker Compose
sudo apt install docker-compose -y
```

2. **Clone & Configure**:
```bash
git clone <your-repo-url> /opt/investing-assistant
cd /opt/investing-assistant

# Create production environment files
cp .env.example .env.production
cp frontend/.env.example frontend/.env.production

# Edit with production values
nano .env.production
nano frontend/.env.production
```

3. **SSL Setup**:
```bash
# Using Let's Encrypt
sudo apt install certbot -y
sudo certbot certonly --standalone -d yourdomain.com -d api.yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/*.pem ./ssl/
```

4. **Deploy**:
```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up -d --build

# Verify services
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

5. **Database Migration**:
```bash
# Run migrations
docker-compose -f docker-compose.prod.yml exec backend python -m alembic upgrade head

# Create initial demo user
docker-compose -f docker-compose.prod.yml exec backend python scripts/create_demo_user.py
```

### Production Nginx Configuration

**nginx.conf**:
```nginx
upstream backend {
    server backend:8200;
}

upstream frontend {
    server frontend:3200;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# Frontend
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Backend API
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;
}
```

### Monitoring & Maintenance

**Health Checks**:
```bash
# Check service health
curl https://api.yourdomain.com/health
curl https://yourdomain.com

# Monitor logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend

# Check resource usage
docker stats
```

**Database Backups**:
```bash
# Daily backup script (add to cron)
#!/bin/bash
BACKUP_DIR=/backups
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U investing_user investing_db | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

**Updates & Rollbacks**:
```bash
# Pull latest changes
git pull origin main

# Build new images
docker-compose -f docker-compose.prod.yml build

# Zero-downtime deployment
docker-compose -f docker-compose.prod.yml up -d --no-deps --build backend
docker-compose -f docker-compose.prod.yml up -d --no-deps --build frontend

# Rollback if needed
git checkout <previous-commit>
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## Performance Optimization

### Frontend Optimization
- Enable CDN for static assets
- Implement service worker caching
- Use image optimization
- Enable gzip compression
- Minimize bundle size

### Backend Optimization
- Enable Redis caching
- Use connection pooling
- Implement query optimization
- Add API rate limiting
- Enable response compression

### Database Optimization
- Add proper indexes
- Use query optimization
- Implement read replicas
- Enable connection pooling
- Regular VACUUM operations

---

## Security Checklist

Production security requirements:

- [ ] HTTPS enabled everywhere
- [ ] Strong SECRET_KEY (64+ characters)
- [ ] Database credentials secured
- [ ] API rate limiting enabled
- [ ] CORS properly configured
- [ ] Security headers added
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Input validation
- [ ] File upload restrictions
- [ ] Error messages sanitized
- [ ] Logging configured
- [ ] Monitoring enabled
- [ ] Backup system configured
- [ ] Firewall rules set
- [ ] SSH key-based access only
- [ ] Regular security updates

---

## Scaling Considerations

### Horizontal Scaling
- Load balancer (Nginx/HAProxy)
- Multiple frontend instances
- Multiple backend instances
- Database read replicas
- Redis cluster
- CDN for static files

### Vertical Scaling
- Increase CPU/RAM as needed
- Optimize database queries
- Implement caching strategies
- Profile application bottlenecks

---

## Monitoring & Logging

### Recommended Tools
- **Application**: Sentry (error tracking)
- **Infrastructure**: Prometheus + Grafana
- **Logs**: ELK Stack or Loki
- **Uptime**: UptimeRobot
- **Performance**: New Relic or DataDog

### Key Metrics to Monitor
- Response time (< 500ms target)
- Error rate (< 1% target)
- CPU usage (< 70% average)
- Memory usage (< 80% average)
- Database connections
- API rate limits
- User activity

---

## Disaster Recovery

### Backup Strategy
- **Database**: Daily full backups, hourly incremental
- **User files**: Replicated to S3/GCS
- **Configuration**: Version controlled
- **Retention**: 30 days minimum

### Recovery Procedures
1. Restore database from latest backup
2. Deploy application from git tag
3. Verify all services operational
4. Test critical user flows
5. Notify users if needed

---

## Cost Estimation (Monthly)

### Development
- Local machine: $0
- Alpha Vantage API: $0 (free tier)

### Production (Small Scale)
- VPS (4 cores, 8GB RAM): $40
- PostgreSQL managed: $25
- Redis managed: $15
- Domain + SSL: $15/year
- **Total**: ~$80/month

### Production (Medium Scale)
- Cloud infrastructure: $200-500
- Managed databases: $100-200
- CDN: $20-50
- Monitoring: $50-100
- APIs: $50-200
- **Total**: ~$420-1050/month

---

## Support Resources

- Documentation: `/docs` folder
- API Reference: http://localhost:8200/docs
- GitHub Issues: <repo-url>/issues
- Email: support@yourdomain.com

---

## Disclaimer

⚠️ This application is for educational purposes. Not financial advice. Consult licensed financial advisors before making investment decisions.

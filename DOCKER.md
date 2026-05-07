# Docker Guide for Alpha Signal

Complete guide for running Alpha Signal with Docker.

## 🐳 **Why Docker?**

Docker provides:
- ✅ Consistent development environment
- ✅ Full stack with one command
- ✅ PostgreSQL + Redis included
- ✅ No local installation needed
- ✅ Production-like setup
- ✅ Easy team onboarding

---

## 📋 **Prerequisites**

### **Install Docker Desktop**

#### **macOS**
```bash
# Download from website
open https://www.docker.com/products/docker-desktop/

# Or using Homebrew
brew install --cask docker
```

#### **Windows**
1. Download: https://www.docker.com/products/docker-desktop/
2. Run installer
3. Enable WSL 2 (if prompted)
4. Restart computer

#### **Linux**
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### **Verify Installation**
```bash
docker --version
docker-compose --version
```

Expected output:
```
Docker version 24.x.x
Docker Compose version v2.x.x
```

---

## 🚀 **Quick Start with Docker**

### **Option 1: Full Stack (Recommended)**

Start everything with one command:

```bash
docker-compose up
```

This starts:
- ✅ Web app → http://localhost:3000
- ✅ API server → http://localhost:4000
- ✅ PostgreSQL database → localhost:5432
- ✅ Redis cache → localhost:6379
- ✅ Analytics worker

### **Option 2: Background Mode**

Run services in background:

```bash
docker-compose up -d
```

View logs:
```bash
docker-compose logs -f
```

### **Option 3: Specific Services**

Start only what you need:

```bash
# Database only
docker-compose up postgres redis -d

# Web + API only
docker-compose up web api -d

# Everything except analytics
docker-compose up web api postgres redis -d
```

---

## 🔧 **Docker Commands Reference**

### **Starting Services**

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Rebuild and start
docker-compose up --build

# Start specific service
docker-compose up web
```

### **Stopping Services**

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data!)
docker-compose down -v

# Stop specific service
docker-compose stop api
```

### **Viewing Logs**

```bash
# All services
docker-compose logs

# Follow logs (real-time)
docker-compose logs -f

# Specific service
docker-compose logs api

# Last 50 lines
docker-compose logs --tail=50
```

### **Rebuilding**

```bash
# Rebuild all images
docker-compose build

# Rebuild specific service
docker-compose build api

# Force rebuild (no cache)
docker-compose build --no-cache

# Rebuild and restart
docker-compose up --build
```

### **Checking Status**

```bash
# List running containers
docker-compose ps

# View resource usage
docker stats

# View container details
docker-compose exec api env
```

---

## 🗄️ **Database with Docker**

### **Using PostgreSQL**

When using Docker, PostgreSQL is available at:
- **Host**: `localhost` (from host machine)
- **Host**: `postgres` (from other containers)
- **Port**: `5432`
- **Database**: `alphasignal`
- **User**: `alphasignal`
- **Password**: Check `.env` file

### **Switch from SQLite to PostgreSQL**

**Step 1:** Update Prisma schema
```prisma
// apps/api/prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Step 2:** Update `.env`
```bash
DATABASE_URL=postgresql://alphasignal:alphasignal_dev_password@localhost:5432/alphasignal
```

**Step 3:** Start PostgreSQL
```bash
docker-compose up postgres -d
```

**Step 4:** Run migrations
```bash
cd apps/api
npx prisma migrate dev
npx prisma generate
```

**Step 5:** Seed database
```bash
npx tsx prisma/seed.ts
```

### **Access PostgreSQL**

```bash
# Via docker-compose
docker-compose exec postgres psql -U alphasignal -d alphasignal

# Direct connection
psql -h localhost -U alphasignal -d alphasignal

# Using GUI tool
# Host: localhost
# Port: 5432
# Database: alphasignal
# Username: alphasignal
# Password: (from .env)
```

### **Database Commands**

```sql
-- List tables
\dt

-- Describe table
\d stocks

-- Query stocks
SELECT * FROM stocks;

-- Exit
\q
```

---

## 🔴 **Redis with Docker**

### **Access Redis**

```bash
# Redis CLI via docker-compose
docker-compose exec redis redis-cli -a alphasignal_redis_dev

# Common commands
PING              # Test connection
KEYS *            # List all keys
GET key_name      # Get value
SET key value     # Set value
DEL key           # Delete key
FLUSHALL          # Clear all (⚠️ careful!)
```

### **Redis for Caching**

Update API to use Redis:
```typescript
// apps/api/src/index.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Cache example
const cachedData = await redis.get('stocks:all');
if (cachedData) {
  return JSON.parse(cachedData);
}

const stocks = await prisma.stock.findMany();
await redis.set('stocks:all', JSON.stringify(stocks), 'EX', 60);
```

---

## 🐍 **Analytics Worker with Docker**

### **Start Worker**

```bash
docker-compose up analytics-worker
```

### **View Worker Logs**

```bash
docker-compose logs -f analytics-worker
```

### **Execute Task**

From API, enqueue a task:
```typescript
// Using Redis as broker
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

await redis.lpush('celery', JSON.stringify({
  task: 'src.tasks.fetch_stock_data',
  args: ['RELIANCE', 'NSE'],
  kwargs: {},
  id: crypto.randomUUID(),
}));
```

### **Monitor Tasks**

```bash
# Shell into worker
docker-compose exec analytics-worker bash

# Check Celery status
celery -A src.celery_app status

# Inspect active tasks
celery -A src.celery_app inspect active

# View registered tasks
celery -A src.celery_app inspect registered
```

---

## 🛠️ **Development Workflows**

### **Hybrid Development**

Run infrastructure in Docker, code locally:

```bash
# Start only databases
docker-compose up postgres redis -d

# Run apps locally
npm run dev              # Web + API
cd apps/analytics && celery -A src.celery_app worker
```

**Benefits:**
- ✅ Fast hot reload
- ✅ Easy debugging
- ✅ Full database features

### **Full Docker Development**

Everything in containers:

```bash
# Start all services
docker-compose up

# Make code changes (will auto-reload in containers)

# View logs
docker-compose logs -f api
```

---

## 🔍 **Debugging in Docker**

### **Shell Access**

```bash
# API container
docker-compose exec api sh

# Web container
docker-compose exec web sh

# Analytics worker
docker-compose exec analytics-worker bash

# PostgreSQL
docker-compose exec postgres bash
```

### **View Container Details**

```bash
# Inspect container
docker-compose exec api env

# Check file system
docker-compose exec api ls -la

# Check process
docker-compose exec api ps aux
```

### **Live Code Editing**

Code changes sync automatically via volumes:
```yaml
# docker-compose.yml
volumes:
  - ./apps/api/src:/app/apps/api/src  # Live sync
```

---

## 📊 **Docker Compose Services**

### **Service Overview**

| Service | Port | Description |
|---------|------|-------------|
| **web** | 3000 | React frontend with Nginx |
| **api** | 4000 | Fastify + GraphQL API |
| **postgres** | 5432 | PostgreSQL 16 + TimescaleDB |
| **redis** | 6379 | Redis 7 cache/broker |
| **analytics-worker** | - | Celery background tasks |

### **Service Dependencies**

```
web → api → postgres
            ↓
      analytics-worker → redis
            ↓
          postgres
```

### **Health Checks**

All services have health checks:
```bash
# Check health status
docker-compose ps
```

Healthy services show `(healthy)` status.

---

## 🔐 **Environment Variables**

### **Docker-Specific Variables**

```bash
# .env
# Database (Docker networking)
DATABASE_URL=postgresql://alphasignal:alphasignal_dev_password@postgres:5432/alphasignal

# Redis (Docker networking)
REDIS_URL=redis://:alphasignal_redis_dev@redis:6379

# Note: Use service names (postgres, redis) not localhost!
```

### **Host vs Container**

From **host machine** (your Mac):
```bash
DATABASE_URL=postgresql://...@localhost:5432/alphasignal
REDIS_URL=redis://:...@localhost:6379
```

From **inside containers**:
```bash
DATABASE_URL=postgresql://...@postgres:5432/alphasignal
REDIS_URL=redis://:...@redis:6379
```

---

## 💾 **Data Persistence**

### **Docker Volumes**

Data persists in Docker volumes:
```bash
# List volumes
docker volume ls | grep alpha-signal

# Inspect volume
docker volume inspect alpha-signal_postgres_data

# Backup volume
docker run --rm -v alpha-signal_postgres_data:/data -v $(pwd):/backup ubuntu tar czf /backup/postgres-backup.tar.gz /data
```

### **Database Backups**

```bash
# Backup
docker-compose exec -T postgres pg_dump -U alphasignal alphasignal > backup.sql

# Restore
cat backup.sql | docker-compose exec -T postgres psql -U alphasignal alphasignal

# Or use Makefile
make backup-db
make restore-db FILE=backup.sql
```

---

## 🧹 **Cleanup**

### **Remove Everything**

```bash
# Stop and remove containers
docker-compose down

# Remove volumes too (⚠️ deletes data!)
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Complete cleanup
docker system prune -a --volumes
```

### **Rebuild Fresh**

```bash
# Complete rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

---

## 🚨 **Troubleshooting**

### **Port Already in Use**

```bash
# Find what's using port
lsof -i :3000
lsof -i :4000
lsof -i :5432

# Kill process
kill -9 <PID>

# Or stop docker services
docker-compose down
```

### **Container Won't Start**

```bash
# View logs
docker-compose logs service-name

# Rebuild
docker-compose build service-name
docker-compose up service-name

# Check docker status
docker ps -a
```

### **Database Connection Issues**

```bash
# Check if postgres is running
docker-compose ps postgres

# Check postgres logs
docker-compose logs postgres

# Verify connection
docker-compose exec postgres pg_isready -U alphasignal

# Test connection from API
docker-compose exec api sh
# Inside container:
# npm install -g pg-cli
# psql $DATABASE_URL
```

### **Out of Memory**

```bash
# Check resource usage
docker stats

# Increase Docker Desktop memory
# Docker Desktop → Settings → Resources → Memory
# Recommended: 4GB minimum, 8GB ideal
```

### **Slow Build Times**

```bash
# Use BuildKit
export DOCKER_BUILDKIT=1
docker-compose build

# Clear build cache
docker builder prune
```

---

## 🎯 **Best Practices**

### **Development**

1. ✅ Use volumes for live code reload
2. ✅ Keep .env file secure (in .gitignore)
3. ✅ Use docker-compose for local dev
4. ✅ Use health checks
5. ✅ Review logs regularly

### **Production**

1. ✅ Use multi-stage builds
2. ✅ Use specific image versions (not :latest)
3. ✅ Scan images for vulnerabilities
4. ✅ Use secrets management
5. ✅ Set resource limits
6. ✅ Use orchestration (Kubernetes, Docker Swarm)

### **Security**

1. ✅ Don't run as root in containers
2. ✅ Use minimal base images
3. ✅ Scan dependencies
4. ✅ Keep images updated
5. ✅ Use Docker secrets for sensitive data

---

## 📚 **Additional Resources**

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)

---

## 🎓 **Docker Commands Cheatsheet**

```bash
# Start
docker-compose up                    # Start all
docker-compose up -d                 # Background
docker-compose up --build            # Rebuild & start

# Stop
docker-compose down                  # Stop all
docker-compose down -v               # Remove volumes
docker-compose stop api              # Stop specific

# Logs
docker-compose logs -f               # Follow all
docker-compose logs api              # Specific service
docker-compose logs --tail=100       # Last 100 lines

# Status
docker-compose ps                    # List services
docker stats                         # Resource usage
docker system df                     # Disk usage

# Shell
docker-compose exec api sh           # API shell
docker-compose exec postgres psql    # PostgreSQL

# Clean
docker system prune                  # Clean unused
docker volume prune                  # Clean volumes
docker image prune                   # Clean images
```

---

**Need help? Check the [main README](README.md) or open an [issue](https://github.com/amitkandari219/alpha-signal/issues)!**

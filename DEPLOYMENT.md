# Alpha Signal - Production Deployment Guide

Complete guide for deploying Alpha Signal to production on a VPS or dedicated server.

## 📋 Table of Contents

1. [Server Requirements](#server-requirements)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [First-Time Setup](#first-time-setup)
4. [Domain & SSL Configuration](#domain--ssl-configuration)
5. [Daily Operations](#daily-operations)
6. [Monitoring & Health Checks](#monitoring--health-checks)
7. [Troubleshooting](#troubleshooting)
8. [Scaling](#scaling)
9. [Security](#security)
10. [Backup & Recovery](#backup--recovery)

---

## 🖥️ Server Requirements

### Minimum Requirements

- **OS**: Ubuntu 22.04 LTS or newer
- **CPU**: 4 cores
- **RAM**: 8 GB
- **Storage**: 100 GB SSD
- **Network**: 100 Mbps

### Recommended Production Requirements

- **OS**: Ubuntu 24.04 LTS
- **CPU**: 8 cores
- **RAM**: 16 GB
- **Storage**: 250 GB NVMe SSD
- **Network**: 1 Gbps
- **Backup Storage**: 500 GB (separate volume)

### Software Prerequisites

```bash
# Docker Engine 24.x or newer
docker --version

# Docker Compose V2
docker compose version

# Git
git --version

# Make
make --version
```

---

## ✅ Pre-Deployment Checklist

### 1. Security Setup

- [ ] Generate production secrets using `make generate-secrets`
- [ ] Create `.env.production` from template
- [ ] Configure firewall rules (UFW)
- [ ] Set up SSH key authentication (disable password auth)
- [ ] Configure fail2ban
- [ ] Update system packages

### 2. API Keys & Credentials

- [ ] **Razorpay**: Get production API key and secret from https://dashboard.razorpay.com
- [ ] **Claude API**: Get production API key from https://console.anthropic.com
- [ ] **Database**: Generate strong password for PostgreSQL
- [ ] **JWT Secret**: Generate 64-character random string
- [ ] **Admin Keys**: Generate API keys for monitoring endpoints

### 3. Domain & DNS

- [ ] Purchase domain (e.g., alphasignal.in)
- [ ] Point DNS A records to server IP
  - `@` → Server IP
  - `www` → Server IP
  - `api` → Server IP (optional subdomain)
- [ ] Wait for DNS propagation (check with `dig alphasignal.in`)

### 4. Code & Dependencies

- [ ] Push latest code to GitHub main branch
- [ ] Run tests locally: `npm test`
- [ ] Run linting: `npm run lint`
- [ ] Security audit: `npm audit --production`

---

## 🚀 First-Time Setup

### Step 1: Server Setup

```bash
# SSH into your production server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose V2
apt install docker-compose-plugin

# Install other tools
apt install -y git make curl wget ufw fail2ban

# Create application directory
mkdir -p /opt/alphasignal
cd /opt/alphasignal
```

### Step 2: Configure Firewall

```bash
# Allow SSH
ufw allow 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable
ufw status
```

### Step 3: Clone Repository

```bash
# Clone from GitHub
git clone https://github.com/yourusername/alpha-signal.git /opt/alphasignal
cd /opt/alphasignal

# Set up production branch tracking
git checkout main
git pull origin main
```

### Step 4: Generate Secrets

```bash
# Generate all production secrets
make generate-secrets

# Output will look like:
# 🔐 Production Secrets Generated
#
# JWT_SECRET=<64-char-random-string>
# METRICS_API_KEY=<32-char-random-string>
# ADMIN_API_KEY=<32-char-random-string>
# SESSION_SECRET=<64-char-random-string>
# POSTGRES_PASSWORD=<32-char-random-string>
# REDIS_PASSWORD=<32-char-random-string>
```

### Step 5: Create Production Environment File

```bash
# Copy template
cp .env.production.example .env.production

# Edit with your values
nano .env.production
```

**Required values to update:**

```bash
# Application
APP_URL=https://alphasignal.in
JWT_SECRET=<from-generate-secrets>
SESSION_SECRET=<from-generate-secrets>

# Database
DATABASE_URL=postgresql://alphasignal:<POSTGRES_PASSWORD>@postgres:5432/alphasignal
POSTGRES_PASSWORD=<from-generate-secrets>

# Redis
REDIS_URL=redis://:<REDIS_PASSWORD>@redis:6379
REDIS_PASSWORD=<from-generate-secrets>

# Razorpay (Production)
RAZORPAY_KEY_ID=<your-production-key-id>
RAZORPAY_KEY_SECRET=<your-production-key-secret>

# Claude API (Production)
ANTHROPIC_API_KEY=<your-production-api-key>

# Monitoring
METRICS_API_KEY=<from-generate-secrets>
ADMIN_API_KEY=<from-generate-secrets>

# Feature Flags
MOCK_PRICES=false          # ← Use real market data in production
MOCK_PAYMENTS=false        # ← Use real Razorpay in production
LLM_DAILY_COST_LIMIT_USD=100
```

### Step 6: Build Production Images

```bash
# Build all Docker images
make prod-build

# This will take 5-10 minutes on first build
# Output:
# 🔵 Building production Docker images...
# [+] Building 487.2s (45/45) FINISHED
# ✅ Production images built
```

### Step 7: Start Services

```bash
# Start all production services
make prod-up

# Output:
# 🔵 Starting production services...
# [+] Running 6/6
#  ✔ Container alphasignal-postgres-1          Started
#  ✔ Container alphasignal-redis-1             Started
#  ✔ Container alphasignal-api-1               Started
#  ✔ Container alphasignal-analytics-worker-1  Started
#  ✔ Container alphasignal-analytics-beat-1    Started
#  ✔ Container alphasignal-web-1               Started
# ✅ Production services started
```

### Step 8: Initialize Database

```bash
# Run database migrations and setup
make prod-init-db

# This will:
# - Wait for PostgreSQL to be ready
# - Run Prisma migrations
# - Create TimescaleDB extension
# - Create hypertables for time-series data
# - Create materialized views
# - Create indexes
# - Seed initial data
```

### Step 9: Verify Deployment

```bash
# Check service status
make prod-status

# Check health endpoint
curl http://localhost/health

# Expected response:
# {"status":"ok","timestamp":"2026-02-08T12:00:00.000Z"}

# Check full health (includes database, redis, etc.)
make prod-health

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2026-02-08T12:00:00.000Z",
#   "services": {
#     "database": "connected",
#     "redis": "connected",
#     "celery": "running"
#   }
# }
```

---

## 🌐 Domain & SSL Configuration

### Step 1: Verify DNS Propagation

```bash
# Check if domain points to your server
dig alphasignal.in +short

# Should return your server IP
# 123.456.789.10
```

### Step 2: Install Certbot

```bash
# Install Certbot for Let's Encrypt SSL
apt install -y certbot python3-certbot-nginx

# Stop nginx temporarily (if running)
make prod-down
```

### Step 3: Obtain SSL Certificate

```bash
# Get certificate (replace with your domain)
certbot certonly --standalone \
  -d alphasignal.in \
  -d www.alphasignal.in \
  --email admin@alphasignal.in \
  --agree-tos \
  --non-interactive

# Certificates saved to:
# /etc/letsencrypt/live/alphasignal.in/fullchain.pem
# /etc/letsencrypt/live/alphasignal.in/privkey.pem
```

### Step 4: Update Nginx Configuration

```bash
# Copy SSL configuration template
cp nginx/ssl.conf nginx/nginx.conf

# Update domain name in nginx.conf
nano nginx/nginx.conf

# Replace 'alphasignal.in' with your actual domain
```

### Step 5: Restart with SSL

```bash
# Update docker-compose.prod.yml to mount SSL certificates
nano docker-compose.prod.yml

# Add under web service volumes:
# volumes:
#   - /etc/letsencrypt:/etc/letsencrypt:ro

# Restart services
make prod-restart

# Verify HTTPS works
curl https://alphasignal.in/health
```

### Step 6: Set Up Auto-Renewal

```bash
# Test renewal
certbot renew --dry-run

# Add cron job for auto-renewal
echo "0 0 * * * certbot renew --quiet --post-hook 'cd /opt/alphasignal && make prod-restart'" | crontab -
```

---

## 🔄 Daily Operations

### View Logs

```bash
# All services
make prod-logs

# Specific service
make prod-logs-api
make prod-logs-worker
make prod-logs-beat
make prod-logs-web

# Follow logs in real-time
docker compose -f docker-compose.prod.yml logs -f api

# Last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100 api
```

### Restart Services

```bash
# Restart all services
make prod-restart

# Restart specific service
docker compose -f docker-compose.prod.yml restart api

# Restart with rebuild (after code changes)
make prod-update
```

### Database Operations

```bash
# Open PostgreSQL shell
make prod-shell-db

# Run SQL query
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U alphasignal -d alphasignal -c "SELECT COUNT(*) FROM companies;"

# Check database size
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U alphasignal -d alphasignal -c "SELECT pg_size_pretty(pg_database_size('alphasignal'));"
```

### Redis Operations

```bash
# Open Redis CLI
make prod-shell-redis

# Check Redis memory usage
docker compose -f docker-compose.prod.yml exec redis redis-cli INFO memory

# Clear cache (use carefully!)
docker compose -f docker-compose.prod.yml exec redis redis-cli FLUSHDB
```

### Manual Backup

```bash
# Create database backup
make prod-backup

# Output:
# 💾 Starting database backup...
# 📦 Creating database dump...
# ✅ Database dump created: alphasignal_backup_20260208_120000.sql
# 🗜️  Compressing backup...
# ✅ Backup compressed: alphasignal_backup_20260208_120000.sql.gz
# 📊 Backup size: 24M
```

### Deploy Code Updates

```bash
# Method 1: Manual deployment
cd /opt/alphasignal
git pull origin main
make prod-build
make prod-up
make prod-health

# Method 2: Automated via Makefile
make prod-update

# Method 3: CI/CD (automatic on push to main)
# Just push to GitHub, workflow will handle deployment
```

---

## 📊 Monitoring & Health Checks

### Health Endpoints

```bash
# Basic health check
curl http://localhost/health
# {"status":"ok"}

# Full health check (requires auth)
curl -H "Authorization: Bearer ${ADMIN_API_KEY}" \
  http://localhost/health/full

# Response:
# {
#   "status": "healthy",
#   "uptime": 86400,
#   "services": {
#     "database": "connected",
#     "redis": "connected",
#     "celery": "running"
#   },
#   "metrics": {
#     "memory_usage": "45%",
#     "cpu_usage": "12%",
#     "disk_usage": "23%"
#   }
# }
```

### System Resource Monitoring

```bash
# Docker container stats
make docker-stats

# Output:
# CONTAINER                          CPU %    MEM USAGE / LIMIT     NET I/O
# alphasignal-api-1                  2.45%    256MiB / 512MiB       1.2MB / 890KB
# alphasignal-analytics-worker-1     5.32%    512MiB / 1GiB         450KB / 120KB
# alphasignal-postgres-1            10.12%    1.2GiB / 4GiB         5MB / 2MB

# Server resource usage
htop

# Disk usage
df -h

# Check Docker disk usage
docker system df
```

### Application Metrics

```bash
# View Celery task queue
docker compose -f docker-compose.prod.yml exec analytics-worker \
  celery -A src.celery_app inspect active

# Check scheduled tasks
docker compose -f docker-compose.prod.yml exec analytics-worker \
  celery -A src.celery_app inspect scheduled
```

### Log Monitoring

```bash
# Search for errors in logs
docker compose -f docker-compose.prod.yml logs api | grep ERROR

# Count errors in last hour
docker compose -f docker-compose.prod.yml logs --since 1h api | grep ERROR | wc -l

# Monitor specific error patterns
docker compose -f docker-compose.prod.yml logs -f api | grep -E "ERROR|FATAL|Exception"
```

---

## 🔧 Troubleshooting

### Service Won't Start

```bash
# Check service status
make prod-status

# Check logs for specific service
make prod-logs-api

# Common issues:
# 1. Port already in use
sudo lsof -i :80
sudo lsof -i :443

# 2. Environment variable missing
docker compose -f docker-compose.prod.yml exec api env | grep DATABASE_URL

# 3. Database not ready
docker compose -f docker-compose.prod.yml exec postgres pg_isready -U alphasignal
```

### Database Connection Issues

```bash
# Test database connection from API container
docker compose -f docker-compose.prod.yml exec api \
  node -e "require('./node_modules/.prisma/client').PrismaClient; console.log('Connected')"

# Check PostgreSQL is accepting connections
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U alphasignal -d alphasignal -c "SELECT 1;"

# Check connection pool
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U alphasignal -d alphasignal -c "SELECT count(*) FROM pg_stat_activity;"
```

### High Memory Usage

```bash
# Identify memory-hungry containers
docker stats --no-stream

# Restart specific service to free memory
docker compose -f docker-compose.prod.yml restart analytics-worker

# Clear Redis cache (if safe to do so)
docker compose -f docker-compose.prod.yml exec redis redis-cli FLUSHDB
```

### Slow API Response

```bash
# Check API logs for slow queries
docker compose -f docker-compose.prod.yml logs api | grep "slow query"

# Enable PostgreSQL slow query logging
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U alphasignal -d alphasignal -c \
  "ALTER SYSTEM SET log_min_duration_statement = 1000;"

# Check Redis latency
docker compose -f docker-compose.prod.yml exec redis redis-cli --latency
```

### SSL Certificate Issues

```bash
# Check certificate expiry
openssl x509 -in /etc/letsencrypt/live/alphasignal.in/cert.pem -noout -dates

# Test SSL configuration
curl -vI https://alphasignal.in

# Manually renew certificate
certbot renew --force-renewal
make prod-restart
```

### Rollback Deployment

```bash
# Stop current services
make prod-down

# Revert to previous commit
git log --oneline -5
git revert <commit-hash>

# Or reset to specific commit
git reset --hard <previous-commit-hash>

# Rebuild and restart
make prod-build
make prod-up

# Restore database if needed (from backup)
gunzip < /backups/alphasignal_backup_20260207_010000.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U alphasignal -d alphasignal
```

---

## 📈 Scaling

### Vertical Scaling (Increase Resources)

```bash
# Update memory limits in docker-compose.prod.yml
nano docker-compose.prod.yml

# Example: Increase API memory limit
services:
  api:
    deploy:
      resources:
        limits:
          memory: 1024M  # increased from 512M

# Restart services
make prod-restart
```

### Horizontal Scaling (Multiple Instances)

```bash
# Scale specific service
docker compose -f docker-compose.prod.yml up -d --scale analytics-worker=3

# Verify scaling
docker compose -f docker-compose.prod.yml ps

# Output:
# NAME                              STATUS
# alphasignal-analytics-worker-1    Up
# alphasignal-analytics-worker-2    Up
# alphasignal-analytics-worker-3    Up
```

### Database Performance Tuning

```bash
# Update PostgreSQL configuration
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U alphasignal -d alphasignal

# Increase shared buffers (25% of RAM)
ALTER SYSTEM SET shared_buffers = '4GB';

# Increase work memory for complex queries
ALTER SYSTEM SET work_mem = '64MB';

# Restart PostgreSQL
docker compose -f docker-compose.prod.yml restart postgres
```

### Load Balancer Setup

```bash
# Install Nginx as load balancer (separate server)
apt install nginx

# Configure upstream servers
# /etc/nginx/nginx.conf
upstream api_backend {
    server 192.168.1.10:3000;
    server 192.168.1.11:3000;
    server 192.168.1.12:3000;
}

server {
    location /api {
        proxy_pass http://api_backend;
    }
}
```

---

## 🔐 Security

### Firewall Rules

```bash
# Check current rules
ufw status verbose

# Block all except HTTP/HTTPS/SSH
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### Fail2Ban Configuration

```bash
# Install fail2ban
apt install fail2ban

# Configure for Nginx
cat > /etc/fail2ban/jail.local << 'EOF'
[nginx-http-auth]
enabled = true
port    = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port    = http,https
logpath = /var/log/nginx/error.log
EOF

# Restart fail2ban
systemctl restart fail2ban
```

### Regular Security Updates

```bash
# Auto-update system packages
apt install unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

# Check for security updates
apt update
apt list --upgradable

# Update Docker images monthly
make prod-down
docker compose -f docker-compose.prod.yml pull
make prod-up
```

### Audit Logs

```bash
# Enable audit logging for database
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U alphasignal -d alphasignal -c \
  "ALTER SYSTEM SET log_connections = 'on';"

# Review access logs
tail -f /var/log/nginx/access.log

# Search for suspicious activity
grep "401\|403\|404" /var/log/nginx/access.log
```

---

## 💾 Backup & Recovery

### Automated Backups

Backups run automatically daily at 01:00 AM IST (configured in Celery Beat).

```bash
# Verify backup schedule
docker compose -f docker-compose.prod.yml exec analytics-beat \
  celery -A src.celery_app inspect scheduled

# Manual backup
make prod-backup

# Backups stored in Docker volume
docker volume inspect alphasignal_backups
```

### Backup to External Storage

```bash
# Sync backups to AWS S3
aws s3 sync /backups s3://alphasignal-backups/

# Or use rsync to another server
rsync -avz /backups/ backup-server:/opt/alphasignal-backups/
```

### Restore from Backup

```bash
# List available backups
ls -lh /backups/*.sql.gz

# Restore specific backup
gunzip < /backups/alphasignal_backup_20260207_010000.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U alphasignal -d alphasignal

# Verify restoration
make prod-shell-db
# In psql:
# SELECT COUNT(*) FROM companies;
# \q
```

### Disaster Recovery Plan

```bash
# 1. New server setup
ssh root@new-server-ip
apt update && apt upgrade -y
curl -fsSL https://get.docker.com | sh

# 2. Clone repository
git clone https://github.com/yourusername/alpha-signal.git /opt/alphasignal
cd /opt/alphasignal

# 3. Copy .env.production from backup
scp old-server:/opt/alphasignal/.env.production .

# 4. Restore database backup
# (Copy backup file to new server)
scp old-server:/backups/latest.sql.gz /tmp/

# 5. Start services
make prod-up

# 6. Restore database
gunzip < /tmp/latest.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U alphasignal -d alphasignal

# 7. Update DNS to point to new server
# 8. Verify application is working
make prod-health
```

---

## 📞 Support & Documentation

### Logs Location

- **Application Logs**: `docker compose logs`
- **Nginx Logs**: `/var/log/nginx/` (if using host nginx)
- **System Logs**: `/var/log/syslog`
- **Backups**: `/backups/` (Docker volume)

### Quick Reference Commands

```bash
# Service Management
make prod-up              # Start all services
make prod-down            # Stop all services
make prod-restart         # Restart all services
make prod-status          # Check service status
make prod-logs            # View all logs

# Database
make prod-shell-db        # PostgreSQL shell
make prod-backup          # Create backup
make prod-init-db         # Initialize database

# Deployment
make prod-build           # Build images
make prod-update          # Deploy latest code
make prod-health          # Check health

# Monitoring
make docker-stats         # Resource usage
make prod-logs-api        # API logs
make prod-logs-worker     # Worker logs
```

### Health Check URLs

- **Basic Health**: `https://alphasignal.in/health`
- **Full Health**: `https://alphasignal.in/health/full` (requires auth)
- **API GraphQL**: `https://alphasignal.in/api/graphql`

---

## 🎉 Deployment Complete!

Your Alpha Signal application is now running in production. Monitor the health endpoints and logs regularly to ensure smooth operation.

### Next Steps

1. Set up monitoring alerts (email/Slack)
2. Configure CDN for static assets (optional)
3. Set up staging environment for testing
4. Document custom configurations
5. Create runbook for common operations

**Need help?** Check the GitHub repository for issues and discussions.

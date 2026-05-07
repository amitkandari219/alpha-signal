# Alpha Signal - Quick Start Guide

Get up and running in 5 minutes!

## ⚡ Quick Start

### Option 1: Automated Setup (Recommended)

```bash
cd alpha-signal
./setup.sh
docker-compose up
```

Then open http://localhost:3000

### Option 2: Manual Setup

```bash
cd alpha-signal

# 1. Copy environment file
cp .env.example .env

# 2. Install dependencies
npm install

# 3. Start with Docker
docker-compose up
```

## 🎯 What Gets Started

When you run `docker-compose up`, the following services start:

| Service | URL | Description |
|---------|-----|-------------|
| Web App | http://localhost:3000 | React frontend |
| API Server | http://localhost:4000 | GraphQL API |
| GraphQL Playground | http://localhost:4000/graphql | Interactive API explorer |
| PostgreSQL | localhost:5432 | Database |
| Redis | localhost:6379 | Cache & message broker |
| Analytics Worker | - | Background job processor |

## 🧪 Test the Setup

### 1. Check Health Endpoint

```bash
curl http://localhost:4000/health
```

Expected response:
```json
{"status":"ok","timestamp":"2024-XX-XXTXX:XX:XX.XXXZ"}
```

### 2. Test GraphQL

Visit http://localhost:4000/graphql and run:

```graphql
query {
  health
  version
}
```

### 3. View Web App

Open http://localhost:3000 in your browser. You should see the Alpha Signal landing page.

## 🔧 Common Commands

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and start
docker-compose up --build

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Docker Issues

```bash
# Clean restart
docker-compose down -v
docker-compose up --build
```

### Database Connection Issues

Wait 10-15 seconds after starting for health checks to pass:

```bash
docker-compose logs postgres
docker-compose logs api
```

## 📚 Next Steps

1. **Read the full README.md** for detailed documentation
2. **Explore the codebase** structure
3. **Set up local development** environment
4. **Start building features!**

## 🆘 Need Help?

- Check `README.md` for comprehensive documentation
- Review `docker-compose.yml` for service configuration
- Check `.env.example` for all available settings

---

Happy coding! 🚀

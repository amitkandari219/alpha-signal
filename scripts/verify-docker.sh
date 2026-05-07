#!/bin/bash

echo "🐳 Docker Installation Verification"
echo "===================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    echo ""
    echo "Please install Docker Desktop from:"
    echo "https://desktop.docker.com/mac/main/arm64/Docker.dmg"
    echo ""
    exit 1
fi

echo "✅ Docker CLI found"
echo ""

# Check Docker version
echo "📦 Docker Version:"
docker --version
echo ""

# Check Docker Compose
echo "📦 Docker Compose Version:"
docker-compose --version || docker compose version
echo ""

# Check if Docker daemon is running
echo "🔍 Checking Docker daemon..."
if docker info &> /dev/null; then
    echo "✅ Docker daemon is running"
    echo ""
else
    echo "⚠️  Docker daemon is not running"
    echo "Please start Docker Desktop from Applications"
    echo ""
    exit 1
fi

# Show Docker info
echo "📊 Docker System Info:"
docker info | grep -E "Server Version|Operating System|OSType|Architecture|CPUs|Total Memory"
echo ""

# Check if docker-compose.yml exists
if [ -f "docker-compose.yml" ]; then
    echo "✅ docker-compose.yml found"
    echo ""
    echo "🎯 You're ready to start Alpha Signal!"
    echo ""
    echo "Run these commands:"
    echo "  docker-compose up        # Start all services"
    echo "  docker-compose up -d     # Start in background"
    echo ""
else
    echo "⚠️  docker-compose.yml not found"
    echo "Make sure you're in the alpha-signal directory"
    echo ""
fi

echo "✅ Docker setup complete!"

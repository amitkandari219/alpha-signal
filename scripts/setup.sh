#!/bin/bash

# Alpha Signal - Quick Setup Script

set -e

echo "🚀 Alpha Signal - Quick Setup"
echo "================================"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js >= 20.0.0"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Copy environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created. Please review and update if needed."
else
    echo "ℹ️  .env file already exists, skipping..."
fi
echo ""

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Build shared package
echo "🔨 Building shared package..."
cd packages/shared && npm run build && cd ../..
echo "✅ Shared package built"
echo ""

# Setup completed
echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "Next steps:"
echo "  1. Review and update .env file with your configuration"
echo "  2. Run 'docker-compose up' to start all services"
echo "  3. Open http://localhost:3000 in your browser"
echo ""
echo "For more information, see README.md"
echo ""

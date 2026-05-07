#!/bin/bash

# Generate Secrets for Alpha Signal Production Environment
# Run this script to generate random secure keys for .env.production

set -e

echo "🔐 Generating secrets for Alpha Signal..."
echo ""

# Function to generate random string
generate_secret() {
    local length=$1
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

# Generate JWT Secret (64 characters)
JWT_SECRET=$(generate_secret 64)
echo "JWT_SECRET=$JWT_SECRET"
echo ""

# Generate Metrics API Key (32 characters)
METRICS_API_KEY=$(generate_secret 32)
echo "METRICS_API_KEY=$METRICS_API_KEY"
echo ""

# Generate Admin API Key (32 characters)
ADMIN_API_KEY=$(generate_secret 32)
echo "ADMIN_API_KEY=$ADMIN_API_KEY"
echo ""

# Generate Session Secret (64 characters)
SESSION_SECRET=$(generate_secret 64)
echo "SESSION_SECRET=$SESSION_SECRET"
echo ""

# Generate PostgreSQL Password (32 characters)
POSTGRES_PASSWORD=$(generate_secret 32)
echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD"
echo ""

echo "✅ Secrets generated successfully!"
echo ""
echo "📋 Copy these values to your .env.production file"
echo ""
echo "⚠️  IMPORTANT: Store these secrets securely!"
echo "   - Never commit .env.production to git"
echo "   - Use a password manager or secrets management tool"
echo "   - Rotate secrets every 90 days"

#!/bin/bash

# SwizAuth Railway.app Deployment Script
set -e

echo "🚀 Starting SwizAuth Railway Deployment..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found!"
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Check if logged in to Railway
if ! railway whoami &> /dev/null; then
    echo "🔐 Please log in to Railway:"
    railway login
fi

# Create Railway project if it doesn't exist
echo "📋 Setting up Railway project..."
if ! railway status &> /dev/null; then
    railway init
fi

# Deploy services
echo "🏗️  Deploying Auth Service..."
railway up --service auth-service --dockerfile auth-service/Dockerfile

echo "🏗️  Deploying Admin Service..."  
railway up --service admin-service --dockerfile admin-service/Dockerfile

echo "🏗️  Deploying Dashboard..."
railway up --service dashboard --dockerfile dashboard/Dockerfile

# Add databases
echo "🗄️  Adding PostgreSQL database..."
railway add postgresql || echo "PostgreSQL already exists"

echo "🔴 Adding Redis..."
railway add redis || echo "Redis already exists"

# Set environment variables
echo "🔧 Setting environment variables..."

# Generate secrets
INTERNAL_SECRET=$(openssl rand -hex 32)
MFA_KEY=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -hex 32)

railway variables set INTERNAL_API_SECRET="$INTERNAL_SECRET"
railway variables set MFA_ENCRYPTION_KEY="$MFA_KEY"
railway variables set SESSION_SECRET="$SESSION_SECRET"
railway variables set CORS_ALLOWED_ORIGINS="https://\${{RAILWAY_PUBLIC_DOMAIN}}"
railway variables set COOKIE_SECURE="true"

echo "✅ Environment variables set"

# Wait for deployment
echo "⏳ Waiting for deployment to complete..."
sleep 60

# Get service URLs
echo "📋 Getting service information..."
railway status

echo ""
echo "🎉 SwizAuth deployed to Railway!"
echo ""
echo "📌 Next steps:"
echo "   1. Check Railway dashboard for service URLs"
echo "   2. Update CORS_ALLOWED_ORIGINS with your actual domain"
echo "   3. Connect to PostgreSQL and run seed data:"
echo "      railway connect postgresql"
echo "      # Then run the contents of migrations/seed.sql"
echo ""
echo "🔐 Test Login:"
echo "   Email:    admin@swizfusion.com"
echo "   Password: Password123!"
echo ""
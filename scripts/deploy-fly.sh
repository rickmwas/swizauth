#!/bin/bash

# SwizAuth Fly.io Deployment Script
set -e

REGION="iad"
CREATE_APPS=false
SET_SECRETS=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --region)
      REGION="$2"
      shift 2
      ;;
    --create-apps)
      CREATE_APPS=true
      shift
      ;;
    --set-secrets)
      SET_SECRETS=true
      shift
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

echo "🚀 Starting SwizAuth Fly.io Deployment..."

# Check if Fly CLI is installed
if ! command -v fly &> /dev/null; then
    echo "❌ Fly CLI not found!"
    echo "📦 Installing Fly CLI..."
    curl -L https://fly.io/install.sh | sh
    echo "ℹ️  Please restart your terminal and run this script again"
    exit 0
fi

echo "✅ Fly CLI is installed"

# Check if logged in to Fly
if ! fly auth whoami &> /dev/null; then
    echo "🔐 Please log in to Fly.io:"
    fly auth login
fi

echo "✅ Logged in to Fly.io"

# Function to generate secrets
generate_secret() {
    openssl rand -hex 32 2>/dev/null || python3 -c "import secrets; print(secrets.token_hex(32))" 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 2>/dev/null
}

# Create apps if requested
if [ "$CREATE_APPS" = true ]; then
    echo "🏗️  Creating Fly.io applications..."
    
    # Create auth service app
    cd auth-service
    echo "Creating swizauth-auth app..."
    fly apps create swizauth-auth --org personal || echo "App may already exist"
    cd ..
    
    # Create admin service app
    cd admin-service  
    echo "Creating swizauth-admin app..."
    fly apps create swizauth-admin --org personal || echo "App may already exist"
    cd ..
    
    # Create dashboard app
    cd dashboard
    echo "Creating swizauth-dashboard app..."
    fly apps create swizauth-dashboard --org personal || echo "App may already exist"
    cd ..
    
    echo "✅ All applications created"
fi

# Set secrets if requested
if [ "$SET_SECRETS" = true ]; then
    echo "🔐 Setting up secrets..."
    
    # Generate secrets
    INTERNAL_SECRET=$(generate_secret)
    MFA_KEY=$(generate_secret)
    SESSION_SECRET=$(generate_secret)
    
    echo "Setting auth service secrets..."
    cd auth-service
    fly secrets set INTERNAL_API_SECRET="$INTERNAL_SECRET"
    fly secrets set MFA_ENCRYPTION_KEY="$MFA_KEY"
    cd ..
    
    echo "Setting admin service secrets..."
    cd admin-service
    fly secrets set INTERNAL_API_SECRET="$INTERNAL_SECRET"
    cd ..
    
    echo "Setting dashboard secrets..."
    cd dashboard
    fly secrets set SESSION_SECRET="$SESSION_SECRET"
    fly secrets set INTERNAL_API_SECRET="$INTERNAL_SECRET"
    cd ..
    
    echo "✅ Secrets configured"
fi

# Add PostgreSQL database
echo "🗄️  Setting up PostgreSQL..."
cd auth-service
fly postgres create swizauth-db --region "$REGION" --initial-cluster-size 1 || echo "Database may already exist"

# Attach database to services
echo "Attaching database to auth service..."
fly postgres attach swizauth-db --app swizauth-auth || echo "Database may already be attached"
cd ..

cd admin-service
echo "Attaching database to admin service..."
fly postgres attach swizauth-db --app swizauth-admin || echo "Database may already be attached"
cd ..

# Add Redis
echo "🔴 Setting up Redis..."
cd auth-service
fly redis create --name swizauth-redis --region "$REGION" || echo "Redis may already exist"
cd ..

# Deploy services
echo "🚀 Deploying auth service..."
cd auth-service
fly deploy
cd ..

echo "🚀 Deploying admin service..."
cd admin-service  
fly deploy
cd ..

echo "🚀 Deploying dashboard..."
cd dashboard
fly deploy
cd ..

# Get app URLs
echo "📋 Getting application URLs..."
AUTH_URL=$(fly apps list | grep swizauth-auth | awk '{print $2}')
ADMIN_URL=$(fly apps list | grep swizauth-admin | awk '{print $2}')
DASHBOARD_URL=$(fly apps list | grep swizauth-dashboard | awk '{print $2}')

# Set service URLs as secrets
echo "🔧 Configuring service URLs..."
cd dashboard
fly secrets set NEXT_PUBLIC_AUTH_SERVICE_URL="https://$AUTH_URL"
fly secrets set NEXT_PUBLIC_ADMIN_SERVICE_URL="https://$ADMIN_URL"
cd ..

cd admin-service
fly secrets set AUTH_SERVICE_URL="https://$AUTH_URL"
fly secrets set CORS_ALLOWED_ORIGINS="https://$DASHBOARD_URL"
cd ..

cd auth-service  
fly secrets set CORS_ALLOWED_ORIGINS="https://$DASHBOARD_URL,https://$ADMIN_URL"
cd ..

echo ""
echo "🎉 SwizAuth deployed to Fly.io!"
echo ""
echo "📋 Application URLs:"
echo "   • Dashboard:     https://$DASHBOARD_URL"
echo "   • Admin API:     https://$ADMIN_URL"
echo "   • Auth Service:  https://$AUTH_URL"
echo ""
echo "📌 Next steps:"
echo "   1. Connect to PostgreSQL and run seed data:"
echo "      fly postgres connect -a swizauth-db"
echo "      # Then run the contents of migrations/seed.sql"
echo "   2. Test authentication flows"
echo "   3. Configure custom domain (optional)"
echo ""
echo "🔐 Test Login:"
echo "   Email:    admin@swizfusion.com"
echo "   Password: Password123!"
echo ""
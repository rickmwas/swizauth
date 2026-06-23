#!/bin/bash

# TSAUTH Local Production Deployment Script
set -e

echo "🚀 Starting TSAUTH Local Production Deployment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production file not found!"
    echo "📝 Please copy .env.prod to .env.production and configure your values:"
    echo "   cp .env.prod .env.production"
    echo "   # Edit .env.production with your actual values"
    exit 1
fi

echo "✅ Environment file found"

# Generate secrets if they don't exist
echo "🔐 Checking secrets..."

# Function to generate random hex string
generate_secret() {
    openssl rand -hex 32 2>/dev/null || python3 -c "import secrets; print(secrets.token_hex(32))" 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 2>/dev/null
}

# Check if secrets are placeholder values and generate if needed
check_and_generate_secret() {
    local var_name=$1
    local current_value=$(grep "^${var_name}=" .env.production | cut -d'=' -f2)
    
    if [ -z "$current_value" ] || [ "$current_value" = "your_${var_name,,}_here" ] || [[ "$current_value" == *"your_"* ]]; then
        local new_secret=$(generate_secret)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/^${var_name}=.*/${var_name}=${new_secret}/" .env.production
        else
            # Linux
            sed -i "s/^${var_name}=.*/${var_name}=${new_secret}/" .env.production
        fi
        echo "🔑 Generated new ${var_name}"
    fi
}

check_and_generate_secret "INTERNAL_API_SECRET"
check_and_generate_secret "MFA_ENCRYPTION_KEY"
check_and_generate_secret "SESSION_SECRET"

# Build and start services
echo "🏗️  Building Docker images..."
docker-compose -f docker-compose.prod.yml --env-file .env.production build

echo "🚀 Starting services..."
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

echo "⏳ Waiting for services to start..."
sleep 30

# Check service health
echo "🏥 Checking service health..."

services=("http://localhost:8080/health" "http://localhost:3001/health" "http://localhost:3000/api/health")
service_names=("Auth Service" "Admin Service" "Dashboard")

for i in "${!services[@]}"; do
    url="${services[$i]}"
    name="${service_names[$i]}"
    
    echo "Checking $name..."
    for attempt in {1..5}; do
        if curl -s "$url" > /dev/null; then
            echo "✅ $name is healthy"
            break
        elif [ $attempt -eq 5 ]; then
            echo "❌ $name health check failed after 5 attempts"
            echo "📋 Checking logs..."
            docker-compose -f docker-compose.prod.yml --env-file .env.production logs --tail=20 "$(echo "${name,,}" | tr ' ' '-')" || true
        else
            echo "⏳ Attempt $attempt/5 failed, retrying in 10s..."
            sleep 10
        fi
    done
done

# Initialize database with seed data
echo "🗄️  Initializing database..."
if docker exec tsauth-postgres-prod psql -U postgres -d TSAUTH -c "SELECT COUNT(*) FROM public.organizations;" 2>/dev/null | grep -q "0"; then
    echo "📊 Seeding database..."
    docker exec -i tsauth-postgres-prod psql -U postgres -d TSAUTH < migrations/seed.sql
    echo "✅ Database seeded successfully"
else
    echo "ℹ️  Database already contains data, skipping seed"
fi

echo ""
echo "🎉 TSAUTH deployment complete!"
echo ""
echo "📋 Service URLs:"
echo "   • Dashboard:     http://localhost:3000"
echo "   • Admin API:     http://localhost:3001"
echo "   • Auth Service:  http://localhost:8080"
echo ""
echo "🔧 Management Commands:"
echo "   • View logs:     docker-compose -f docker-compose.prod.yml --env-file .env.production logs -f"
echo "   • Stop services: docker-compose -f docker-compose.prod.yml --env-file .env.production down"
echo "   • Restart:       ./scripts/deploy-local.sh"
echo ""
echo "🔐 Test Login:"
echo "   Email:    admin@terrasept.com"
echo "   Password: Password123!"
echo ""
# SwizAuth Deployment Guide

This guide covers deploying SwizAuth to production using various cloud providers.

## 🚀 Quick Start - Railway.app (Recommended)

Railway.app provides the easiest deployment path with built-in PostgreSQL and Redis.

### Prerequisites
- GitHub repository with SwizAuth code
- Railway.app account (free tier available)

### Steps

1. **Connect Repository**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login to Railway
   railway login
   
   # Link your repository
   railway link
   ```

2. **Deploy Services**
   ```bash
   # Deploy each service
   railway up --service auth-service --dockerfile auth-service/Dockerfile
   railway up --service admin-service --dockerfile admin-service/Dockerfile  
   railway up --service dashboard --dockerfile dashboard/Dockerfile
   ```

3. **Add Databases**
   ```bash
   # Add PostgreSQL
   railway add --service postgresql
   
   # Add Redis
   railway add --service redis
   ```

4. **Configure Environment Variables**
   Set these in Railway dashboard or via CLI:
   ```bash
   railway variables set POSTGRES_PASSWORD=your_strong_password
   railway variables set REDIS_PASSWORD=your_redis_password
   railway variables set INTERNAL_API_SECRET=your_internal_secret
   railway variables set MFA_ENCRYPTION_KEY=your_mfa_key
   railway variables set SESSION_SECRET=your_session_secret
   ```

5. **Run Database Migration**
   ```bash
   # Connect to Railway PostgreSQL and run seed data
   railway connect postgresql
   # Then run the contents of migrations/seed.sql
   ```

## 🐳 Docker Deployment

### Local Production Testing

1. **Copy Environment File**
   ```bash
   cp .env.prod .env.production
   # Edit .env.production with your actual values
   ```

2. **Generate Secrets**
   ```bash
   # Generate internal API secret
   openssl rand -hex 32
   
   # Generate MFA encryption key  
   openssl rand -hex 32
   
   # Generate session secret
   openssl rand -hex 32
   ```

3. **Deploy with Docker Compose**
   ```bash
   docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
   ```

4. **Initialize Database**
   ```bash
   # Copy seed data to container
   docker cp migrations/seed.sql swizauth-postgres-prod:/tmp/
   
   # Run seed script
   docker exec -it swizauth-postgres-prod psql -U postgres -d swizauth -f /tmp/seed.sql
   ```

## 🌐 Other Cloud Providers

### Render.com

1. **Create Services**
   - Web Service for each application (auth-service, admin-service, dashboard)
   - PostgreSQL database
   - Redis instance

2. **Configure Build Commands**
   - Auth Service: `docker build -f auth-service/Dockerfile .`
   - Admin Service: `docker build -f admin-service/Dockerfile .`
   - Dashboard: `docker build -f dashboard/Dockerfile .`

### Fly.io

1. **Install Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Create Apps**
   ```bash
   flyctl apps create swizauth-auth
   flyctl apps create swizauth-admin  
   flyctl apps create swizauth-dashboard
   ```

3. **Deploy**
   ```bash
   flyctl deploy --app swizauth-auth --dockerfile auth-service/Dockerfile
   flyctl deploy --app swizauth-admin --dockerfile admin-service/Dockerfile
   flyctl deploy --app swizauth-dashboard --dockerfile dashboard/Dockerfile
   ```

### Google Cloud Platform

1. **Build Images**
   ```bash
   # Build and push to Container Registry
   gcloud builds submit --tag gcr.io/PROJECT-ID/swizauth-auth auth-service/
   gcloud builds submit --tag gcr.io/PROJECT-ID/swizauth-admin admin-service/
   gcloud builds submit --tag gcr.io/PROJECT-ID/swizauth-dashboard dashboard/
   ```

2. **Deploy to Cloud Run**
   ```bash
   # Deploy services
   gcloud run deploy auth-service --image gcr.io/PROJECT-ID/swizauth-auth --platform managed
   gcloud run deploy admin-service --image gcr.io/PROJECT-ID/swizauth-admin --platform managed
   gcloud run deploy dashboard --image gcr.io/PROJECT-ID/swizauth-dashboard --platform managed
   ```

## 🔒 Security Checklist

### Before Production Deployment

- [ ] Generate strong passwords for all secrets
- [ ] Update CORS origins to match your domain
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure proper firewall rules
- [ ] Set up backup strategy for PostgreSQL
- [ ] Configure monitoring and alerting
- [ ] Review and rotate JWT signing keys
- [ ] Ensure MFA encryption keys are secure
- [ ] Test all authentication flows in production environment

### Post-Deployment

- [ ] Verify health check endpoints respond correctly
- [ ] Test user registration and login flows
- [ ] Verify API endpoints are accessible
- [ ] Check database connectivity
- [ ] Monitor application logs for errors
- [ ] Set up automated backups
- [ ] Configure domain DNS records
- [ ] Test session management and token refresh

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL environment variable
   - Ensure PostgreSQL service is running
   - Verify firewall allows database connections

2. **Redis Connection Failed**
   - Check REDIS_URL and REDIS_PASSWORD
   - Ensure Redis service is accessible
   - Verify Redis authentication

3. **CORS Errors**
   - Update CORS_ALLOWED_ORIGINS environment variable
   - Include all frontend domains (with protocol)
   - Check browser network tab for exact origin

4. **JWT Token Issues**
   - Verify JWT certificate files exist
   - Check JWT_PRIVATE_KEY_PATH and JWT_PUBLIC_KEY_PATH
   - Ensure certificates are accessible in container

### Health Check Endpoints

- Auth Service: `GET /health`
- Admin Service: `GET /health`
- Dashboard: `GET /api/health`

### Log Locations

All services output structured JSON logs to stdout. Use your platform's log aggregation:
- Railway: `railway logs`
- Render: Available in dashboard
- Docker: `docker logs <container-name>`

## 📊 Monitoring

### Recommended Metrics to Monitor

- Response time for authentication endpoints
- Database connection pool usage
- Redis cache hit rates  
- Error rates across all services
- Active user sessions
- API rate limit violations

### Alerting Setup

Configure alerts for:
- Service health check failures
- High error rates (>5%)
- Database connectivity issues
- Unusual authentication patterns
- Resource usage spikes

## 🔄 Updates and Maintenance

### Rolling Updates

1. **Database Migrations**
   - Always backup before schema changes
   - Test migrations on staging first
   - Use transaction-based migrations

2. **Service Updates**
   - Deploy one service at a time
   - Monitor health checks after each deployment
   - Keep previous image tags for quick rollback

3. **Certificate Rotation**
   - Generate new JWT key pairs
   - Update both services simultaneously
   - Verify token validation works
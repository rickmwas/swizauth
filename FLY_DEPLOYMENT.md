# SwizAuth Fly.io Deployment Guide

Deploy SwizAuth to Fly.io with automatic scaling, global edge deployment, and managed databases.

## 🚀 Quick Deployment (5 Minutes)

### Prerequisites
- Fly.io account (free tier available)
- Git repository with SwizAuth code

### One-Command Deployment

**Windows (PowerShell):**
```powershell
# Complete deployment with app creation and secrets
.\scripts\deploy-fly.ps1 -CreateApps -SetSecrets
```

**Linux/Mac (Bash):**
```bash
# Make script executable and run
chmod +x scripts/deploy-fly.sh
./scripts/deploy-fly.sh --create-apps --set-secrets
```

This single command will:
✅ Install Fly CLI (if needed)
✅ Create 3 applications (auth, admin, dashboard)
✅ Generate and set secure secrets
✅ Create PostgreSQL database
✅ Create Redis instance  
✅ Deploy all services
✅ Configure service URLs and CORS

---

## 📋 Step-by-Step Deployment

If you prefer manual control, follow these steps:

### Step 1: Install Fly CLI
```bash
# Linux/Mac
curl -L https://fly.io/install.sh | sh

# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex

# Login to Fly.io
fly auth login
```

### Step 2: Create Applications
```bash
# Create auth service
cd auth-service
fly apps create swizauth-auth
cd ..

# Create admin service  
cd admin-service
fly apps create swizauth-admin
cd ..

# Create dashboard
cd dashboard  
fly apps create swizauth-dashboard
cd ..
```

### Step 3: Add Databases
```bash
# Create PostgreSQL database
cd auth-service
fly postgres create swizauth-db --region iad --initial-cluster-size 1

# Attach to both services
fly postgres attach swizauth-db --app swizauth-auth
cd ../admin-service
fly postgres attach swizauth-db --app swizauth-admin
cd ..

# Create Redis
cd auth-service
fly redis create --name swizauth-redis --region iad
cd ..
```

### Step 4: Set Environment Variables
```bash
# Generate secrets (save these!)
openssl rand -hex 32  # INTERNAL_API_SECRET
openssl rand -hex 32  # MFA_ENCRYPTION_KEY  
openssl rand -hex 32  # SESSION_SECRET

# Set auth service secrets
cd auth-service
fly secrets set INTERNAL_API_SECRET="your_internal_secret"
fly secrets set MFA_ENCRYPTION_KEY="your_mfa_key"
cd ..

# Set admin service secrets  
cd admin-service
fly secrets set INTERNAL_API_SECRET="your_internal_secret"
cd ..

# Set dashboard secrets
cd dashboard
fly secrets set SESSION_SECRET="your_session_secret"
fly secrets set INTERNAL_API_SECRET="your_internal_secret"
cd ..
```

### Step 5: Deploy Services
```bash
# Deploy auth service
cd auth-service
fly deploy
cd ..

# Deploy admin service
cd admin-service  
fly deploy
cd ..

# Deploy dashboard
cd dashboard
fly deploy
cd ..
```

### Step 6: Configure Service URLs
```bash
# Get your app URLs
AUTH_URL=$(fly apps list | grep swizauth-auth | awk '{print $2}')
ADMIN_URL=$(fly apps list | grep swizauth-admin | awk '{print $2}')  
DASHBOARD_URL=$(fly apps list | grep swizauth-dashboard | awk '{print $2}')

# Set service URLs
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
```

---

## 🗄️ Database Setup

### Initialize Database with Seed Data
```bash
# Connect to PostgreSQL
fly postgres connect -a swizauth-db

# In the PostgreSQL prompt, create the database structure
CREATE DATABASE swizauth;
\c swizauth;

# Copy and paste the contents of migrations/seed.sql
# Or upload the file and run:
\i /path/to/migrations/seed.sql
```

### Alternative: Use Database Proxy
```bash
# Create a secure tunnel to your database
fly proxy 5432 -a swizauth-db

# In another terminal, connect with local tools
psql postgres://postgres:password@localhost:5432/swizauth
```

---

## 🔧 Configuration Options

### Scaling Configuration
```toml
# In each service's fly.toml, adjust:
[[vm]]
  memory = '512mb'    # or '256mb', '1gb', '2gb'
  cpu_kind = 'shared' # or 'performance'  
  cpus = 1           # or 2, 4, 8
```

### Auto-scaling Settings
```toml
[http_service]
  min_machines_running = 1  # Always keep 1 running
  auto_stop_machines = true # Stop when idle
  auto_start_machines = true # Start on requests
```

### Custom Domains
```bash
# Add custom domain to dashboard
cd dashboard
fly certs create yourdomain.com
fly certs create www.yourdomain.com

# Update CORS origins
fly secrets set CORS_ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
```

---

## 💰 Pricing & Resource Usage

### Free Tier Limits (Hobby Plan)
- 3 shared-cpu-1x machines included
- 160GB-hours of usage per month
- Perfect for development and low-traffic production

### Typical Monthly Costs
| Component | Free Tier | Light Usage | Production |
|-----------|-----------|-------------|------------|
| 3 Apps | $0 | $5-15 | $25-50 |
| PostgreSQL | $0 (shared) | $15 | $30+ |
| Redis | $2 | $10 | $25+ |
| **Total** | **$2/month** | **$30-40/month** | **$80-100+/month** |

---

## 📊 Monitoring & Management

### View Application Status
```bash
# Check all apps
fly apps list

# Check specific app status  
fly status -a swizauth-auth

# View logs
fly logs -a swizauth-auth -f
```

### Health Monitoring
```bash
# Check health endpoints
curl https://swizauth-auth.fly.dev/health
curl https://swizauth-admin.fly.dev/health  
curl https://swizauth-dashboard.fly.dev/api/health
```

### Database Management
```bash
# Database status
fly postgres db list -a swizauth-db

# Create backup
fly postgres backup -a swizauth-db

# View Redis status
fly redis status swizauth-redis
```

---

## 🔄 Updates & Deployment

### Deploy Updates
```bash
# Deploy single service
cd auth-service
fly deploy

# Deploy all services (run from root)
./scripts/deploy-fly.sh
```

### Rollback Deployment  
```bash
# View deployment history
fly releases -a swizauth-auth

# Rollback to previous version
fly releases rollback -a swizauth-auth
```

### Blue-Green Deployment
```bash
# Deploy with zero downtime
fly deploy --strategy=bluegreen
```

---

## 🆘 Troubleshooting

### Common Issues

**1. App Creation Fails**
```bash
# App name might be taken, use unique prefix
fly apps create mycompany-swizauth-auth
```

**2. Database Connection Issues**
```bash
# Check database attachment
fly postgres attach --help

# Verify connection string
fly secrets list -a swizauth-auth | grep DATABASE
```

**3. Service Communication Issues**
```bash
# Check internal connectivity
fly ssh console -a swizauth-auth
# Then: curl http://swizauth-admin.internal:3001/health
```

**4. CORS Errors**
```bash
# Update CORS origins
fly secrets set CORS_ALLOWED_ORIGINS="https://your-actual-domain.com"
```

### Debug Commands
```bash
# SSH into running app
fly ssh console -a swizauth-auth

# View real-time logs
fly logs -a swizauth-auth -f

# Check machine status
fly machine list -a swizauth-auth
```

---

## 🎯 Success Checklist

After deployment, verify:

✅ **All services respond to health checks**
```bash
curl https://swizauth-auth.fly.dev/health
curl https://swizauth-admin.fly.dev/health
curl https://swizauth-dashboard.fly.dev/api/health
```

✅ **Database is accessible and seeded**
```bash
fly postgres connect -a swizauth-db
# Check: SELECT COUNT(*) FROM public.organizations;
```

✅ **Authentication flow works**
- Visit dashboard URL
- Register new user
- Login with test credentials
- Verify admin panel access

✅ **Service communication works**
- Dashboard can reach API
- API can reach auth service
- No CORS errors in browser console

---

## 🚀 You're Live!

Your SwizAuth system is now running on Fly.io with:

✅ **Global edge deployment** - Low latency worldwide  
✅ **Auto-scaling** - Scales to zero when idle  
✅ **Managed databases** - PostgreSQL and Redis included  
✅ **Automatic HTTPS** - SSL certificates managed  
✅ **Zero-downtime deploys** - Blue-green deployment ready  

**Dashboard:** `https://swizauth-dashboard.fly.dev`  
**Login:** `admin@swizfusion.com` / `Password123!`

Enjoy your production-ready authentication system! 🎉
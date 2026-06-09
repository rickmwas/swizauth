# SwizAuth Quick Start Guide

Get SwizAuth running in production in under 10 minutes!

## 🚀 Option 1: Railway.app (Recommended - Easiest)

**Prerequisites:** GitHub account, 5 minutes

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for production deployment"
   git push origin main
   ```

2. **Deploy to Railway**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Run deployment script  
   chmod +x scripts/deploy-railway.sh
   ./scripts/deploy-railway.sh
   ```

3. **Configure in Railway Dashboard**
   - Visit https://railway.app/dashboard
   - Add PostgreSQL and Redis services
   - Set environment variables (script will guide you)
   - Connect to database and run seed data

4. **Access Your Application**
   - Dashboard: `https://your-app.railway.app`
   - Login: `admin@swizfusion.com` / `Password123!`

**Total Cost:** Free tier for development, ~$10/month for production

---

## 🐳 Option 2: Local Docker (Development)

**Prerequisites:** Docker Desktop, 2 minutes

1. **Configure Environment**
   ```bash
   # Copy environment template
   cp .env.prod .env.production
   
   # Edit with your values (or use defaults for local testing)
   notepad .env.production  # Windows
   nano .env.production     # Mac/Linux
   ```

2. **Deploy Locally**
   ```powershell
   # Windows PowerShell
   .\scripts\deploy-local.ps1
   
   # Mac/Linux Bash
   chmod +x scripts/deploy-local.sh
   ./scripts/deploy-local.sh
   ```

3. **Access Your Application**
   - Dashboard: http://localhost:3000
   - Admin API: http://localhost:3001
   - Auth Service: http://localhost:8080
   - Login: `admin@swizfusion.com` / `Password123!`

---

## 🌐 Option 3: Other Cloud Providers

### Render.com
1. Connect GitHub repository
2. Create 3 web services pointing to respective Dockerfiles
3. Add PostgreSQL and Redis add-ons
4. Set environment variables from `.env.prod`

### Google Cloud Platform
1. Build images: `gcloud builds submit`
2. Deploy to Cloud Run
3. Add Cloud SQL (PostgreSQL) and Memorystore (Redis)
4. Configure environment variables

### AWS
1. Push images to ECR
2. Deploy with ECS Fargate
3. Add RDS PostgreSQL and ElastiCache Redis
4. Configure ALB with SSL termination

---

## 🔧 Environment Configuration

### Required Secrets (Generate These)
```bash
# Generate secure random secrets
openssl rand -hex 32  # INTERNAL_API_SECRET
openssl rand -hex 32  # MFA_ENCRYPTION_KEY
openssl rand -hex 32  # SESSION_SECRET

# Strong database passwords
openssl rand -base64 32  # POSTGRES_PASSWORD
openssl rand -base64 32  # REDIS_PASSWORD
```

### Minimal Production Configuration
```env
# Database (update with your actual values)
POSTGRES_PASSWORD=your_generated_password
REDIS_PASSWORD=your_redis_password

# Security Secrets (generate with commands above)
INTERNAL_API_SECRET=your_32_char_hex_secret
MFA_ENCRYPTION_KEY=your_32_char_hex_key  
SESSION_SECRET=your_32_char_hex_secret

# Domain Configuration (update with your domain)
CORS_ALLOWED_ORIGINS=https://yourdomain.com
COOKIE_DOMAIN=yourdomain.com
COOKIE_SECURE=true

# Service URLs (update with your deployment URLs)
NEXT_PUBLIC_AUTH_SERVICE_URL=https://auth.yourdomain.com
NEXT_PUBLIC_ADMIN_SERVICE_URL=https://api.yourdomain.com
```

---

## ✅ Verify Deployment

### Health Checks
```bash
# Check all services are healthy
curl https://your-auth-service/health
curl https://your-admin-service/health  
curl https://your-dashboard/api/health
```

### Test Authentication Flow
1. **Register New User**
   ```bash
   curl -X POST https://your-auth-service/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "TestPass123!",
       "firstName": "Test",
       "lastName": "User"
     }'
   ```

2. **Login**
   ```bash
   curl -X POST https://your-auth-service/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com", 
       "password": "TestPass123!"
     }'
   ```

3. **Access Dashboard**
   - Visit your dashboard URL
   - Login with: `admin@swizfusion.com` / `Password123!`
   - Verify all dashboard features work

---

## 🆘 Troubleshooting

### Service Won't Start
- Check Docker logs: `docker logs <container_name>`
- Verify environment variables are set
- Ensure databases are accessible

### Database Connection Failed
- Verify DATABASE_URL format: `postgres://user:pass@host:5432/dbname`
- Check if PostgreSQL service is running
- Test connection manually

### CORS Errors
- Update `CORS_ALLOWED_ORIGINS` with your exact domain
- Include protocol: `https://yourdomain.com`
- Check browser console for specific error

### JWT/Auth Issues
- Verify certificate files exist in auth-service
- Check `JWT_PRIVATE_KEY_PATH` and `JWT_PUBLIC_KEY_PATH`
- Ensure internal API secrets match across services

---

## 📞 Support

### Quick Fixes
- **Restart Services:** Redeploy or restart Docker containers
- **Clear Cache:** Restart Redis service
- **Reset Database:** Drop and recreate with seed data
- **Check Logs:** All services output structured JSON logs

### Monitoring
- **Health Endpoints:** `/health` on all services
- **Service Status:** Check deployment platform dashboard
- **Error Tracking:** Monitor application logs for errors

---

## 🎉 Success!

Your SwizAuth system is now running in production with:

✅ **Multi-tenant authentication system**  
✅ **Role-based access control**  
✅ **Admin dashboard for user management**  
✅ **Developer portal for API keys**  
✅ **Audit logging and security features**  
✅ **Production-ready infrastructure**  

### What's Next?
- Configure custom domain and SSL
- Set up monitoring and alerting  
- Customize branding and UI
- Add additional OAuth providers
- Scale based on usage patterns

**Welcome to production!** 🚀
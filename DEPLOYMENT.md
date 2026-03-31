# Deployment Guide

## Quick Deploy to Railway (Recommended)

### Backend Deployment

1. **Create Railway Account**: https://railway.app
2. **Create New Project** → "Deploy from GitHub repo"
3. **Add PostgreSQL Database**:
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will automatically set `DATABASE_URL`

4. **Configure Backend Service**:
   ```bash
   # Root Directory: /backend
   # Build Command: npm install && npx prisma generate && npx prisma migrate deploy && npm run build
   # Start Command: npm run start:prod
   ```

5. **Set Environment Variables**:
   ```
   JWT_SECRET=<generate-random-secret>
   PORT=3001
   FRONTEND_URL=<your-frontend-url>
   ```

6. **Run Migrations & Seed**:
   ```bash
   railway run npx prisma migrate deploy
   railway run npx prisma db seed
   ```

7. **Get Backend URL**: Copy from Railway dashboard (e.g., `https://your-app.railway.app`)

### Frontend Deployment (Vercel)

1. **Create Vercel Account**: https://vercel.com
2. **Import GitHub Repository**
3. **Configure Project**:
   ```
   Framework Preset: Next.js
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: .next
   ```

4. **Set Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=<your-railway-backend-url>
   ```

5. **Deploy**: Vercel will auto-deploy on push to main

---

## Alternative: Deploy to Render

### Backend

1. Create new Web Service
2. Connect GitHub repo
3. Configure:
   ```
   Root Directory: backend
   Build Command: npm install && npx prisma generate && npm run build
   Start Command: npm run start:prod
   ```
4. Add PostgreSQL database
5. Set environment variables

### Frontend

1. Create new Static Site
2. Configure:
   ```
   Root Directory: frontend
   Build Command: npm run build
   Publish Directory: .next
   ```

---

## Docker Deployment

### Backend Dockerfile

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./
EXPOSE 3001
CMD ["npm", "run", "start:prod"]
```

### Frontend Dockerfile

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY package*.json ./
EXPOSE 3000
CMD ["npm", "start"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_USER: crm_user
      POSTGRES_PASSWORD: crm_password
      POSTGRES_DB: crm_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build:
      context: ./backend
    environment:
      DATABASE_URL: postgresql://crm_user:crm_password@postgres:5432/crm_db
      JWT_SECRET: your-secret-key
      PORT: 3001
      FRONTEND_URL: http://localhost:3000
    ports:
      - "3001:3001"
    depends_on:
      - postgres

  frontend:
    build:
      context: ./frontend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

Run: `docker-compose up -d`

---

## Environment Variables Reference

### Backend

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret key for JWT signing | `random-256-bit-string` |
| `PORT` | Server port | `3001` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://your-app.vercel.app` |

### Frontend

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://your-api.railway.app` |

---

## Post-Deployment Checklist

- [ ] Database migrations applied
- [ ] Seed data loaded
- [ ] Environment variables set
- [ ] CORS configured correctly
- [ ] JWT_SECRET is strong and unique
- [ ] HTTPS enabled
- [ ] API accessible from frontend
- [ ] Test login with seed credentials
- [ ] Test customer creation
- [ ] Test assignment limit (5 per user)
- [ ] Test activity logs
- [ ] Swagger docs accessible at `/api/docs`

---

## Monitoring & Maintenance

### Health Checks

Add to `main.ts`:
```typescript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

### Database Backups

**Railway**: Automatic daily backups  
**Render**: Configure in dashboard  
**Self-hosted**: Use `pg_dump`:

```bash
pg_dump $DATABASE_URL > backup.sql
```

### Logs

**Railway**: View in dashboard  
**Vercel**: View in deployment logs  
**Docker**: `docker logs <container-id>`

---

## Troubleshooting

### "Prisma Client not generated"
```bash
npx prisma generate
```

### "Database connection failed"
Check `DATABASE_URL` format and network access

### "CORS error"
Ensure `FRONTEND_URL` matches your frontend domain exactly

### "JWT token invalid"
Ensure `JWT_SECRET` is the same across all backend instances

---

## Scaling Considerations

### Horizontal Scaling
- Deploy multiple backend instances behind load balancer
- Use connection pooling (PgBouncer)
- Separate read/write database connections

### Vertical Scaling
- Increase database resources (RAM, CPU)
- Optimize PostgreSQL configuration
- Add database indexes for slow queries

### Caching
- Add Redis for session storage
- Cache organization metadata
- Cache frequently accessed customer lists

---

## Security Hardening

1. **Rate Limiting**: Add `@nestjs/throttler`
2. **Helmet.js**: Add security headers
3. **HTTPS Only**: Force SSL/TLS
4. **Input Validation**: Already implemented with class-validator
5. **SQL Injection**: Protected by Prisma parameterization
6. **XSS**: Protected by React's escaping
7. **CSRF**: Not needed for JWT-based API

---

## Cost Estimates

### Railway (Hobby Plan)
- Backend: $5/month
- PostgreSQL: $5/month
- **Total: $10/month**

### Vercel (Hobby Plan)
- Frontend: Free (100GB bandwidth)

### Total Monthly Cost: ~$10

---

## Support

For issues, check:
1. Application logs
2. Database connection
3. Environment variables
4. CORS configuration
5. Network connectivity

Common errors and solutions in README.md troubleshooting section.

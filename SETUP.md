# Quick Setup Guide

## Prerequisites

Ensure you have installed:

- **Node.js** 18 or higher ([Download](https://nodejs.org/))
- **PostgreSQL** 14 or higher ([Download](https://www.postgresql.org/download/))
- **npm** or **yarn**

Check versions:

```bash
node --version  # Should be v18+
npm --version
psql --version  # Should be 14+
```

---

## Step 1: Clone & Install

```bash
# Navigate to project
cd Interview-task

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

## Step 2: Database Setup

### Option A: Local PostgreSQL

1. **Create Database**:

```bash
psql -U postgres
CREATE DATABASE crm_db;
\q
```

2. **Configure Backend**:

```bash
cd backend
cp .env.example .env
```

3. **Edit `.env`**:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/crm_db?schema=public"
JWT_SECRET="your-super-secret-key-change-this"
PORT=3001
FRONTEND_URL="http://localhost:3000"
```

### Option B: Railway PostgreSQL (Cloud)

1. Create account at [railway.app](https://railway.app)
2. Create new project → Add PostgreSQL
3. Copy `DATABASE_URL` from Railway dashboard
4. Paste into `backend/.env`

---

## Step 3: Run Migrations & Seed

```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database with test data
npx prisma db seed
```

**Expected Output:**

```
🌱 Seeding database...
✅ Organizations created
✅ Users created
✅ Customers created
✅ Notes created
✅ Org2 customers created
✅ Soft-deleted customer created for testing

🎉 Seed data created successfully!
```

---

## Step 4: Configure Frontend

```bash
cd frontend
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Step 5: Start Development Servers

### Terminal 1 - Backend

```bash
cd backend
npm run start:dev
```

**Expected Output:**

```
🚀 Application is running on: http://localhost:3001
📚 Swagger documentation: http://localhost:3001/api/docs
```

### Terminal 2 - Frontend

```bash
cd frontend
npm run dev
```

**Expected Output:**

```
▲ Next.js 14.1.0
- Local:        http://localhost:3000
```

---

## Step 6: Test the Application

### Access Points

| Service       | URL                            | Description          |
| ------------- | ------------------------------ | -------------------- |
| Frontend      | http://localhost:3000          | Main application     |
| Backend API   | http://localhost:3001          | REST API             |
| Swagger Docs  | http://localhost:3001/api/docs | Interactive API docs |
| Prisma Studio | `npx prisma studio`            | Database GUI         |

### Login Credentials

**Organization 1: Acme Corporation**

- Admin: `admin@acme.com` / `password123`
- Member: `member@acme.com` / `password123`
- Member: `sarah@acme.com` / `password123`
- Member: `mike@acme.com` / `password123`

**Organization 2: TechStart Inc**

- Admin: `admin@techstart.com` / `password123`
- Member: `member@techstart.com` / `password123`

---

## Step 7: Verify Features

### ✅ Test Checklist

1. **Login**
   - [ ] Login with admin@acme.com
   - [ ] Verify dashboard loads

2. **Customers**
   - [ ] View customer list (should see 20 customers)
   - [ ] Search for "Alice" (debounced search)
   - [ ] Click pagination (should work smoothly)
   - [ ] Create new customer (should auto-assign to you)
   - [ ] Edit customer details
   - [ ] View customer details page

3. **Notes**
   - [ ] Add note to customer
   - [ ] Verify note appears immediately
   - [ ] Check note shows your name and timestamp

4. **Assignment**
   - [ ] Assign customer to user
   - [ ] Try assigning 6th customer to same user (should fail with error)
   - [ ] Verify error message: "User already has 5 active assignments"

5. **Activity Logs**
   - [ ] Click "Activity Logs" in navbar
   - [ ] Verify logs show with labels and colors
   - [ ] Check pagination works
   - [ ] Verify "auto-assigned" label appears for created customers

6. **Soft Delete**
   - [ ] Delete a customer
   - [ ] Verify customer disappears from list
   - [ ] Check activity log shows "Customer Deleted"

7. **Multi-Tenancy**
   - [ ] Logout
   - [ ] Login as admin@techstart.com
   - [ ] Verify you see different customers (TechStart customers)
   - [ ] Verify you cannot see Acme customers

8. **Admin Access**
   - [ ] Login as admin@acme.com
   - [ ] Test admin endpoints in Swagger:
     - GET `/organizations` (should see all orgs)
     - GET `/organizations/admin/customers` (should see all customers)

---

## Troubleshooting

### "Cannot connect to database"

```bash
# Check PostgreSQL is running
pg_isready

# If not running (macOS):
brew services start postgresql@14

# If not running (Linux):
sudo systemctl start postgresql
```

### "Prisma Client not found"

```bash
cd backend
npx prisma generate
```

### "Port 3001 already in use"

```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>

# Or change PORT in backend/.env
PORT=3002
```

### "CORS error in browser"

- Ensure `FRONTEND_URL` in `backend/.env` matches your frontend URL exactly
- Restart backend after changing .env

### "Module not found"

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## Development Tools

### Prisma Studio (Database GUI)

```bash
cd backend
npx prisma studio
```

Opens at http://localhost:5555

### View Database Schema

```bash
cd backend
npx prisma db pull
```

### Reset Database (⚠️ Deletes all data)

```bash
cd backend
npx prisma migrate reset
npx prisma db seed
```

### Generate Migration

```bash
cd backend
npx prisma migrate dev --name your_migration_name
```

---

## Testing API with Swagger

1. Open http://localhost:3001/api/docs
2. Click "Authorize" button
3. Login via `/auth/login` endpoint:
   ```json
   {
     "email": "admin@acme.com",
     "password": "password123"
   }
   ```
4. Copy `access_token` from response
5. Click "Authorize" and paste token
6. Test any endpoint (all requests now authenticated)

---

## Testing API with cURL

### Login

```bash
TOKEN=$(curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.com","password":"password123"}' \
  | jq -r '.access_token')

echo $TOKEN
```

### Get Customers

```bash
curl -X GET http://localhost:3001/customers \
  -H "Authorization: Bearer $TOKEN"
```

### Create Customer

```bash
curl -X POST http://localhost:3001/customers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "email": "test@example.com",
    "phone": "+1234567890"
  }'
```

### Test Assignment Limit

```bash
# Get user ID from /users endpoint
USER_ID="<user-id>"

# Assign 5 customers (should succeed)
for i in {1..5}; do
  CUSTOMER_ID="<customer-id-$i>"
  curl -X POST http://localhost:3001/customers/$CUSTOMER_ID/assign \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"userId\":\"$USER_ID\"}"
done

# Try 6th assignment (should fail)
CUSTOMER_ID="<customer-id-6>"
curl -X POST http://localhost:3001/customers/$CUSTOMER_ID/assign \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\"}"
```

Expected: `409 Conflict - "User already has 5 active assignments"`

---

## Next Steps

1. ✅ Application running locally
2. 📖 Read [README.md](./README.md) for architecture details
3. 🚀 Read [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment guide
4. 🧪 Test all features from checklist above
5. 📝 Customize for your needs

---

## Quick Commands Reference

```bash
# Backend
cd backend
npm run start:dev          # Start dev server
npm run build              # Build for production
npm run start:prod         # Start production server
npx prisma studio          # Open database GUI
npx prisma migrate dev     # Run migrations
npx prisma db seed         # Seed database

# Frontend
cd frontend
npm run dev                # Start dev server
npm run build              # Build for production
npm run start              # Start production server
npm run lint               # Run linter
```

---

## Support

If you encounter issues:

1. Check this troubleshooting section
2. Review error messages in terminal
3. Check browser console (F12)
4. Verify environment variables
5. Ensure PostgreSQL is running
6. Try restarting both servers

For architecture questions, see [README.md](./README.md)

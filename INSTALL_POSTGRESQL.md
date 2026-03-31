# Install PostgreSQL on macOS

## Step 1: Fix Homebrew Permissions

Run this command in your terminal:

```bash
sudo chown -R $(whoami) /Users/trt/Library/Logs/Homebrew /usr/local/Cellar /usr/local/Frameworks /usr/local/Homebrew /usr/local/bin /usr/local/etc /usr/local/include /usr/local/lib /usr/local/opt /usr/local/sbin /usr/local/share /usr/local/var/homebrew
```

## Step 2: Install PostgreSQL

```bash
brew install postgresql@14
```

## Step 3: Start PostgreSQL Service

```bash
brew services start postgresql@14
```

## Step 4: Add PostgreSQL to PATH

```bash
echo 'export PATH="/usr/local/opt/postgresql@14/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

## Step 5: Create Database

```bash
# Create the database
createdb crm_db

# Verify it was created
psql -l
```

## Step 6: Set up Backend Environment

```bash
cd /Users/trt/Downloads/project/backend

# Copy environment file
cp .env.example .env

# Edit .env file with this content:
# DATABASE_URL="postgresql://trt@localhost:5432/crm_db?schema=public"
# JWT_SECRET="your-super-secret-jwt-key-change-in-production"
# PORT=3001
# FRONTEND_URL="http://localhost:3000"
```

---

## Alternative: Use Railway (Cloud Database - No Installation Needed)

If you don't want to install PostgreSQL locally, use Railway:

1. Go to https://railway.app
2. Sign up (free)
3. Create new project → Add PostgreSQL
4. Copy the DATABASE_URL from Railway dashboard
5. Paste into `backend/.env`

This is faster and doesn't require local installation!

---

## Next Steps After PostgreSQL is Ready

Once PostgreSQL is installed and running, continue with:

```bash
# Install backend dependencies
cd /Users/trt/Downloads/project/backend
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database
npx prisma db seed

# Start backend
npm run start:dev
```

Then in another terminal:

```bash
# Install frontend dependencies
cd /Users/trt/Downloads/project/frontend
npm install

# Copy environment file
cp .env.local.example .env.local

# Start frontend
npm run dev
```

---

## Troubleshooting

### "createdb: command not found"
```bash
export PATH="/usr/local/opt/postgresql@14/bin:$PATH"
```

### "psql: could not connect to server"
```bash
brew services restart postgresql@14
```

### Check if PostgreSQL is running
```bash
brew services list | grep postgresql
```

Should show: `postgresql@14 started`

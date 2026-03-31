# Multi-Tenant CRM System

A production-ready Multi-Tenant CRM system built with NestJS, Next.js, PostgreSQL, and Prisma, demonstrating enterprise-level architecture, concurrency safety, and performance optimization.

## 🏗️ Architecture Overview

### Tech Stack

**Backend:**
- NestJS (TypeScript)
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Swagger API Documentation
- Bcrypt for password hashing

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- React Query (TanStack Query) for state management
- Tailwind CSS
- Axios for API calls

### Project Structure

```
crm-task/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/           # Authentication & JWT
│   │   │   ├── users/          # User management
│   │   │   ├── organizations/  # Organization management
│   │   │   ├── customers/      # Customer CRUD & assignment
│   │   │   ├── notes/          # Customer notes
│   │   │   └── activity-log/   # Activity tracking
│   │   ├── common/
│   │   │   ├── guards/         # Auth & role guards
│   │   │   ├── decorators/     # Custom decorators
│   │   │   └── pipes/          # Validation pipes
│   │   ├── config/             # Prisma service
│   │   └── main.ts
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── seed.ts             # Seed data
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/                # Next.js pages
│   │   ├── components/         # Reusable components
│   │   ├── services/           # API services
│   │   ├── store/              # Auth store
│   │   ├── hooks/              # Custom hooks (debounce)
│   │   └── types/              # TypeScript types
│   └── package.json
└── README.md
```

## 🔐 Multi-Tenancy Architecture

### Isolation Strategy

**Database-Level Isolation:**
- Every table includes an `organizationId` foreign key
- All queries are automatically filtered by `organizationId`
- Users belong to exactly ONE organization
- Cross-organization data access is strictly prevented

**Implementation:**

1. **Custom Decorator (`@OrganizationId()`)**: Extracts organizationId from JWT token
2. **Guard-Based Enforcement**: JWT guard validates organization membership
3. **Service-Level Filtering**: All database queries include organizationId in WHERE clauses
4. **Foreign Key Constraints**: Cascade deletes maintain referential integrity

**Example:**
```typescript
// Every customer query is automatically scoped
async findAll(organizationId: string) {
  return this.prisma.customer.findMany({
    where: {
      organizationId,  // Enforced at service level
      deletedAt: null,
    },
  });
}
```

### Role-Based Access Control

**Roles:**
- `ADMIN`: Can create users, view all organizations' data (cross-tenant for admin purposes), access admin dashboard
- `MEMBER`: Can only access their own organization's data, cannot create users or view other organizations

**Access Matrix:**

| Feature | Admin | Member | Implementation |
|---------|-------|--------|----------------|
| **View own org customers** | ✅ | ✅ | Both can view customers in their organization |
| **Create customers** | ✅ | ✅ | Both can create (auto-assigned to creator) |
| **Update customers** | ✅ | ✅ | Both can update customers in their org |
| **Delete customers** | ✅ | ✅ | Both can soft-delete customers in their org |
| **Assign customers** | ✅ | ✅ | Both can assign (max 5 per user enforced) |
| **Add notes** | ✅ | ✅ | Both can add notes to customers |
| **View activity logs** | ✅ | ✅ | Both can view logs for their org |
| **Create users** | ✅ | ❌ | `@Roles(UserRole.ADMIN)` guard |
| **View all organizations** | ✅ | ❌ | Admin dashboard with cross-org view |
| **View all customers (cross-org)** | ✅ | ❌ | `/organizations/admin/customers` endpoint |
| **View all notes (cross-org)** | ✅ | ❌ | `/organizations/admin/notes` endpoint |

**UI Differences:**

Admin users see additional navigation items:
- **"Users"** - Manage users in their organization (create, view)
- **"All Organizations"** - Admin dashboard showing all orgs, customers, and notes
- **Purple badge** - Visual indicator showing ADMIN role
- **Purple-colored links** - Admin-only features highlighted in purple

Member users see:
- **"Customers"** - Standard customer management
- **"Activity Logs"** - View activity logs for their org
- **Blue badge** - Visual indicator showing MEMBER role

**Backend Enforcement:**

```typescript
// Admin-only endpoints
@Get()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
getAllOrganizations() {
  return this.organizationsService.findAll();
}

// Both roles can access (organization-scoped)
@Get()
@UseGuards(JwtAuthGuard)
findAll(@OrganizationId() organizationId: string) {
  return this.customersService.findAll(organizationId);
}
```

**Frontend Enforcement:**

```typescript
// Conditional rendering based on role
{isAdmin && (
  <>
    <button onClick={() => router.push('/users')}>Users</button>
    <button onClick={() => router.push('/admin/organizations')}>
      All Organizations
    </button>
  </>
)}

// Page-level protection
if (user?.role !== 'ADMIN') {
  router.push('/customers');
  return null;
}
```

## ⚡ Concurrency Safety

### Problem: Race Condition in Customer Assignment

**Requirement:** Each user can have maximum 5 active assigned customers.

**Challenge:** Under concurrent requests, two threads might both read "4 assignments" and proceed to create a 5th, resulting in 6 total assignments.

### Solution: Database Transactions with Row Locking

**Implementation:**

```typescript
async assignCustomer(id: string, assignCustomerDto: AssignCustomerDto, organizationId: string, userId: string) {
  return await this.prisma.$transaction(
    async (tx) => {
      // 1. Lock the rows for this user's assignments
      const activeAssignments = await tx.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM customers
        WHERE "assignedToId" = ${assignCustomerDto.userId}
          AND "deletedAt" IS NULL
          AND id != ${id}
        FOR UPDATE  -- 🔒 Row-level lock
      `;

      const count = Number(activeAssignments[0].count);

      // 2. Check constraint
      if (count >= MAX_ASSIGNMENTS_PER_USER) {
        throw new ConflictException('User already has 5 active assignments');
      }

      // 3. Perform assignment
      return await tx.customer.update({
        where: { id },
        data: { assignedToId: assignCustomerDto.userId },
      });
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 10000,
    }
  );
}
```

**Key Techniques:**

1. **SELECT FOR UPDATE**: Acquires row-level locks, preventing other transactions from reading/modifying the same rows
2. **Serializable Isolation**: Highest isolation level, prevents phantom reads
3. **Atomic Transaction**: All operations succeed or fail together
4. **Timeout Protection**: Prevents deadlocks with 10s timeout

**Why This Works:**
- Thread A acquires lock → reads 4 assignments → assigns customer → releases lock
- Thread B waits for lock → reads 5 assignments → rejects with error
- No race condition possible

## 🚀 Performance Optimization

### Target: 100,000 Customers per Organization

### 1. Database Indexing Strategy

**Composite Indexes:**

```prisma
model Customer {
  @@index([organizationId])           // Filter by org
  @@index([assignedToId])             // Filter by assignment
  @@index([deletedAt])                // Soft delete queries
  @@index([organizationId, deletedAt]) // 🎯 Composite for common query
}

model User {
  @@index([organizationId])
  @@index([email])
  @@unique([email, organizationId])
}

model ActivityLog {
  @@index([organizationId])
  @@index([entityId])
  @@index([entityType, entityId])     // 🎯 Composite for entity lookups
}
```

**Rationale:**
- `[organizationId, deletedAt]`: Most queries filter by both (active customers in org)
- `[entityType, entityId]`: Activity logs frequently queried by entity
- Single-column indexes for foreign keys enable efficient JOINs

### 2. Pagination Implementation

**Offset-Based Pagination:**

```typescript
async findAll(organizationId: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;
  
  const [customers, total] = await Promise.all([
    this.prisma.customer.findMany({
      where: { organizationId, deletedAt: null },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    this.prisma.customer.count({ where: { organizationId, deletedAt: null } }),
  ]);
  
  return {
    data: customers,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

**Benefits:**
- Parallel execution of data + count queries
- Consistent page sizes
- Metadata for UI pagination controls

**Future Optimization:** For 100k+ records, cursor-based pagination would be more efficient:
```typescript
// Cursor-based (future enhancement)
where: { 
  organizationId,
  deletedAt: null,
  id: { lt: cursor } // More efficient than OFFSET
}
```

### 3. N+1 Query Prevention

**Problem:** Fetching customers, then fetching assignedTo for each in a loop = N+1 queries

**Solution:** Prisma's `include` for eager loading

```typescript
this.prisma.customer.findMany({
  where: { organizationId },
  include: {
    assignedTo: {
      select: { id: true, name: true, email: true }  // Only needed fields
    },
    _count: {
      select: { notes: true }  // Efficient count aggregation
    }
  }
});
```

**Result:** 1 query with JOINs instead of N+1 queries

### 4. Search Optimization

**Case-Insensitive Search with Indexes:**

```typescript
where: {
  OR: [
    { name: { contains: search, mode: 'insensitive' } },
    { email: { contains: search, mode: 'insensitive' } },
  ]
}
```

**Note:** PostgreSQL's `ILIKE` (case-insensitive) can use indexes with `pg_trgm` extension for partial matches. For production, consider:
- Full-text search (PostgreSQL `tsvector`)
- Elasticsearch for advanced search features

### 5. Debounced Search (Frontend)

```typescript
const debouncedSearch = useDebounce(search, 500);
```

Reduces API calls from every keystroke to once per 500ms pause.

## 🗑️ Soft Delete Integrity

### Requirements

1. Soft-deleted customers must not appear in normal queries
2. Notes must remain stored
3. Activity logs must remain intact
4. Restoring a customer restores visibility of notes

### Implementation

**Schema:**

```prisma
model Customer {
  deletedAt DateTime?  // NULL = active, NOT NULL = deleted
}
```

**Query Filtering:**

```typescript
// All queries include deletedAt: null
where: {
  organizationId,
  deletedAt: null  // Excludes soft-deleted records
}
```

**Soft Delete Operation:**

```typescript
async remove(id: string, organizationId: string, userId: string) {
  await this.prisma.customer.update({
    where: { id },
    data: { deletedAt: new Date() }  // Mark as deleted, don't remove
  });
  
  // Activity log preserved
  await this.activityLogService.create('customer', id, 'CUSTOMER_DELETED', userId, organizationId);
}
```

**Restore Operation:**

```typescript
async restore(id: string, organizationId: string, userId: string) {
  return await this.prisma.customer.update({
    where: { id },
    data: { deletedAt: null }  // Restore visibility
  });
}
```

**Notes Relationship:**

Notes are stored with `customerId` foreign key but queries filter by customer's `deletedAt`:

```typescript
notes: {
  where: {
    customer: {
      deletedAt: null  // Only show notes for active customers
    }
  }
}
```

When customer is restored, notes automatically become visible again.

## 🛠️ Production Improvement: Swagger API Documentation

### Choice Rationale

**Why Swagger?**
- **Developer Experience**: Interactive API documentation
- **Testing**: Built-in API testing interface
- **Contract-First**: Serves as API contract for frontend developers
- **Auto-Generation**: Decorators generate docs from code
- **Standardization**: OpenAPI 3.0 standard

### Implementation

```typescript
// main.ts
const config = new DocumentBuilder()
  .setTitle('Multi-Tenant CRM API')
  .setDescription('Production-ready Multi-Tenant CRM System API Documentation')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

**Access:** `http://localhost:3001/api/docs`

**Benefits:**
- Frontend developers can test endpoints without Postman
- Automatic request/response schema validation
- JWT authentication testing built-in
- Reduces onboarding time for new developers

### Alternative Considerations

**Not Chosen:**
- **Rate Limiting**: Would implement with `@nestjs/throttler` if API abuse was a concern
- **Caching (Redis)**: Would add for frequently accessed, rarely changed data (e.g., organization details)
- **Background Jobs (Bull)**: Would use for async operations like bulk imports or email notifications

**Swagger was chosen** because it provides immediate value for development, testing, and collaboration without adding infrastructure complexity.

## 📊 Scaling Strategy

### Current Capacity: 100,000 Customers per Organization

### Horizontal Scaling

**Application Tier:**
- Stateless NestJS backend → can run multiple instances behind load balancer
- JWT tokens (no server-side sessions) → no sticky sessions needed
- Docker containers for easy deployment

**Database Tier:**
- PostgreSQL read replicas for read-heavy workloads
- Connection pooling (Prisma default: 10 connections)
- Separate read/write connection strings

### Vertical Scaling

**Database Optimization:**
- Increase PostgreSQL `shared_buffers` (25% of RAM)
- Tune `work_mem` for complex queries
- Enable query plan caching

### Data Partitioning (Future)

**For 1M+ customers:**
- Table partitioning by `organizationId` (PostgreSQL native)
- Each partition = one organization's data
- Queries automatically routed to correct partition

```sql
CREATE TABLE customers (
  ...
) PARTITION BY LIST (organizationId);

CREATE TABLE customers_org1 PARTITION OF customers
  FOR VALUES IN ('org-1');
```

### Caching Strategy (Future)

**Redis for:**
- User sessions (if moving away from JWT)
- Organization metadata (rarely changes)
- Customer counts (invalidate on create/delete)

**Cache Invalidation:**
- Event-driven: Emit events on customer create/update/delete
- Listeners invalidate relevant cache keys

### Monitoring & Observability

**Would Implement:**
- **APM**: New Relic or Datadog for performance monitoring
- **Logging**: Structured logging with Winston + ELK stack
- **Metrics**: Prometheus + Grafana for database query times, API latency
- **Alerts**: Slack/PagerDuty for error rate spikes

## 🎯 Trade-offs & Design Decisions

### 1. Offset vs Cursor Pagination

**Chose:** Offset-based pagination  
**Reason:** Simpler implementation, sufficient for 100k records  
**Trade-off:** Performance degrades with very high offsets (page 5000+)  
**Future:** Migrate to cursor-based for 1M+ records

### 2. JWT vs Session-Based Auth

**Chose:** JWT  
**Reason:** Stateless, enables horizontal scaling without session store  
**Trade-off:** Cannot revoke tokens before expiry  
**Mitigation:** Short expiry times (1 hour), refresh token rotation

### 3. Soft Delete vs Hard Delete

**Chose:** Soft delete  
**Reason:** Audit trail, data recovery, compliance  
**Trade-off:** Database grows larger, queries must always filter `deletedAt`  
**Mitigation:** Periodic archival of old soft-deleted records to cold storage

### 4. Prisma vs TypeORM

**Chose:** Prisma  
**Reason:** Type-safe, excellent DX, auto-generated types, better performance  
**Trade-off:** Less flexible for complex raw SQL (but `$queryRaw` available)

### 5. React Query vs Zustand

**Chose:** React Query  
**Reason:** Built-in caching, loading states, optimistic updates, automatic refetching  
**Trade-off:** Steeper learning curve than Zustand  
**Benefit:** Eliminates need for separate state management for server data

### 6. Monorepo vs Separate Repos

**Chose:** Monorepo  
**Reason:** Shared types, easier local development, atomic commits  
**Trade-off:** Larger repository, need tooling for independent deployments  
**Future:** Nx or Turborepo for build optimization

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL

# Run migrations
npx prisma migrate dev

# Seed database
npx prisma db seed

# Start development server
npm run start:dev
```

Backend runs on `http://localhost:3001`  
Swagger docs: `http://localhost:3001/api/docs`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with NEXT_PUBLIC_API_URL

# Start development server
npm run dev
```

Frontend runs on `http://localhost:3000`

### Database Schema

```bash
# Generate Prisma Client
npx prisma generate

# View database in Prisma Studio
npx prisma studio
```

## 🔑 Login Credentials (Seed Data)

**Acme Corporation (Org1):**
- Admin: `admin@acme.com` / `password123`
- Member: `member@acme.com` / `password123`
- Member: `sarah@acme.com` / `password123`
- Member: `mike@acme.com` / `password123`

**TechStart Inc (Org2):**
- Admin: `admin@techstart.com` / `password123`
- Member: `member@techstart.com` / `password123`

**Test Data:**
- 20 customers in Org1 (5 assigned to each of 3 members, 5 unassigned)
- 5 customers in Org2
- 10 notes across various customers
- 1 soft-deleted customer for testing restore functionality
- Activity logs for all operations

## 📝 API Endpoints

### Authentication
- `POST /auth/login` - Login
- `POST /auth/register` - Register (requires organizationId)

### Customers
- `GET /customers` - List customers (paginated, searchable)
- `GET /customers/:id` - Get customer details with notes
- `POST /customers` - Create customer (auto-assigned to creator)
- `PATCH /customers/:id` - Update customer
- `DELETE /customers/:id` - Soft delete customer
- `POST /customers/:id/restore` - Restore soft-deleted customer
- `POST /customers/:id/assign` - Assign customer to user (max 5 per user)

### Notes
- `POST /notes` - Create note for customer

### Users
- `GET /users` - List users in organization
- `POST /users` - Create user (Admin only)

### Organizations
- `GET /organizations` - List all organizations (Admin only)
- `GET /organizations/current` - Get current user's organization
- `GET /organizations/admin/customers` - All customers across all orgs (Admin only)
- `GET /organizations/admin/notes` - All notes across all orgs (Admin only)

### Activity Logs
- `GET /activity-logs` - List activity logs (paginated)
- `GET /activity-logs/:entityType/:entityId` - Get logs for specific entity

## 🧪 Testing Concurrency Safety

**Test the 5-assignment limit:**

```bash
# Terminal 1: Assign 5 customers to user
for i in {1..5}; do
  curl -X POST http://localhost:3001/customers/$CUSTOMER_ID/assign \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"userId": "USER_ID"}'
done

# Terminal 2: Try to assign 6th customer (should fail)
curl -X POST http://localhost:3001/customers/$CUSTOMER_ID/assign \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID"}'

# Expected: 409 Conflict - "User already has 5 active assignments"
```

**Concurrent assignment test:**

Use a load testing tool like `artillery` or `k6` to send 10 concurrent assignment requests. Only 5 should succeed.

## 📦 Deployment Considerations

### Environment Variables

**Backend (.env):**
```
DATABASE_URL=postgresql://user:password@host:5432/crm_db
JWT_SECRET=your-secret-key-change-in-production
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com
```

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

### Production Checklist

- [ ] Change JWT_SECRET to strong random value
- [ ] Enable CORS only for frontend domain
- [ ] Set up SSL/TLS certificates
- [ ] Configure PostgreSQL connection pooling
- [ ] Enable database backups
- [ ] Set up error tracking (Sentry)
- [ ] Configure rate limiting
- [ ] Enable Helmet.js for security headers
- [ ] Set up CI/CD pipeline
- [ ] Configure logging aggregation
- [ ] Set up health check endpoints
- [ ] Enable database query logging for slow queries

### Recommended Hosting

**Backend:** Railway, Render, AWS ECS, or DigitalOcean App Platform  
**Frontend:** Vercel, Netlify, or AWS Amplify  
**Database:** Railway PostgreSQL, AWS RDS, or DigitalOcean Managed Database

## 🎓 Key Learnings & Best Practices

1. **Multi-tenancy requires discipline**: Every query must filter by organizationId
2. **Concurrency is hard**: Always use transactions with proper isolation levels
3. **Indexes are critical**: 100k records without indexes = slow queries
4. **Soft deletes add complexity**: Every query needs `deletedAt: null`
5. **Type safety matters**: Prisma + TypeScript caught many bugs at compile time
6. **React Query simplifies state**: No need for complex Redux setup
7. **Swagger saves time**: Frontend developers can test APIs independently

## 📄 License

MIT

## 👤 Author

Built as a technical assessment demonstrating production-level full-stack development skills.

# 🏦 Arnifi Vault — Document Logbook System

A production-grade enterprise web application for tracking secure document movement with a complete audit trail.

---

## 🚀 Quick Start (Step-by-Step)

### Step 1 — Prerequisites

Make sure you have these installed:
```bash
node --version   # v18.17+ required
npm --version    # v9+
```

You will also need:
- PostgreSQL database (local or cloud — [Supabase](https://supabase.com) free tier works)
- AWS S3 bucket (for file uploads)
- [Vercel](https://vercel.com) account (for deployment)

---

### Step 2 — Install dependencies

```bash
cd vault-logbook
npm install
```

If `tailwindcss-animate` is missing:
```bash
npm install tailwindcss-animate
```

---

### Step 3 — Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your values:

```env
# PostgreSQL — get from Supabase, Neon, or local
DATABASE_URL="postgresql://user:password@host:5432/vault_logbook?schema=public"

# Auth.js secret — generate with:
# openssl rand -base64 32
AUTH_SECRET="your-generated-secret"
AUTH_URL="http://localhost:3000"

# AWS S3
AWS_REGION="ap-south-1"
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="..."
AWS_S3_BUCKET_NAME="arnifi-vault-documents"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

### Step 4 — Set up AWS S3 bucket

1. Go to AWS Console → S3 → Create bucket
2. Name it `arnifi-vault-documents` (or your preferred name)
3. Set bucket policy to allow PutObject from your IAM user:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::arnifi-vault-documents/*"
    }
  ]
}
```

4. Under **CORS**, add:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedOrigins": ["http://localhost:3000", "https://your-domain.com"],
    "ExposeHeaders": []
  }
]
```

5. Create an IAM user with `AmazonS3FullAccess` and generate access keys.

---

### Step 5 — Set up the database

```bash
# Generate the Prisma client
npm run db:generate

# Push schema to your database (creates all tables)
npm run db:push

# Seed with sample data + admin user
npm run db:seed
```

After seeding, you'll have:
```
Admin:  admin@arnifi.com  / Admin@1234
Viewer: ceo@arnifi.com    / Viewer@1234
Viewer: cfo@arnifi.com    / Viewer@1234
```

---

### Step 6 — Install shadcn/ui components

Run these commands to add the required shadcn components:

```bash
npx shadcn-ui@latest init
# Choose: Default style, Zinc base color, yes to CSS variables

npx shadcn-ui@latest add button input label card badge dialog select \
  table textarea separator toast avatar skeleton tabs dropdown-menu \
  form popover calendar
```

---

### Step 7 — Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with `admin@arnifi.com` / `Admin@1234`.

---

## 🏗 Project Structure

```
src/
├── app/
│   ├── (auth)/login/          ← Login page
│   ├── (dashboard)/           ← Protected dashboard layout
│   │   ├── dashboard/         ← Overview + charts
│   │   ├── documents/         ← Document CRUD
│   │   ├── checkouts/         ← Checkout + return logs
│   │   ├── users/             ← User management (admin)
│   │   ├── audit-trail/       ← Immutable audit log (admin)
│   │   └── reports/           ← CSV/Excel/PDF exports (admin)
│   └── api/
│       ├── auth/              ← NextAuth.js handler
│       ├── exports/           ← Report download endpoint
│       └── upload/            ← S3 presigned URL endpoint
├── components/
│   ├── layout/                ← Sidebar + Navbar
│   ├── dashboard/             ← Charts + widgets
│   ├── documents/             ← Document form + table
│   ├── checkouts/             ← Checkout form + table + return modal
│   ├── users/                 ← User form + table
│   ├── audit/                 ← Audit trail table
│   └── shared/                ← Reusable components
├── lib/
│   ├── auth/                  ← Auth.js configuration
│   ├── db/                    ← Prisma client singleton
│   ├── validations/           ← Zod schemas
│   ├── utils/                 ← format, cn helpers
│   └── constants/             ← App constants
├── repositories/              ← Database access layer
├── actions/                   ← Next.js Server Actions
├── hooks/                     ← React custom hooks
└── types/                     ← TypeScript definitions
```

---

## 🚢 Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-org/vault-logbook.git
git push -u origin main
```

### 2. Deploy on Vercel

```bash
npm install -g vercel
vercel
```

Or import directly at [vercel.com/new](https://vercel.com/new).

### 3. Set environment variables in Vercel Dashboard

Go to your project → Settings → Environment Variables and add all variables from `.env.example`.

### 4. Run database migration on production

```bash
# After deployment, run migration
DATABASE_URL="your-production-db-url" npx prisma migrate deploy
DATABASE_URL="your-production-db-url" npx ts-node prisma/seed.ts
```

---

## 🔐 Security Notes

- Passwords are hashed with bcrypt (12 rounds)
- JWT sessions expire after 30 days
- All mutations require authenticated session
- Admin-only routes are protected at both middleware and server action level
- S3 uploads use short-lived presigned URLs (5 minute expiry)
- Audit logs are immutable — no delete or update operations exist
- All database writes use transactions where data integrity matters

---

## 📋 User Roles

| Feature | Admin | Viewer |
|---------|-------|--------|
| View all documents | ✅ | ❌ (assigned only) |
| Create/edit documents | ✅ | ❌ |
| Create checkout | ✅ | ❌ |
| Return document | ✅ | ❌ |
| Manage users | ✅ | ❌ |
| View audit trail | ✅ | ❌ |
| Export reports | ✅ | ❌ |
| View dashboard | ✅ | ✅ |
| View checkout history | ✅ | ✅ |

---

## 🛠 Useful Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run db:studio    # Open Prisma Studio (DB GUI)
npm run db:push      # Sync schema changes
npm run db:seed      # Reseed database
npm run db:migrate   # Create and run migration
npm run lint         # Run ESLint
```

---

## 📦 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Auth**: Auth.js v5 (NextAuth)
- **Database**: PostgreSQL + Prisma ORM
- **Styling**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod
- **Storage**: AWS S3
- **Exports**: xlsx + jspdf
- **Notifications**: Sonner

---

Built for Arnifi by the engineering team.

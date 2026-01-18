# Local Development Setup

## Prerequisites
- Node.js installed
- PostgreSQL running (either locally or via Docker)

## Setup Steps

1. **Create `.env` file** in the root directory with the following content:
```
DATABASE_URL="postgresql://user:password@localhost:5432/ecommerce?schema=public"
JWT_SECRET="your-secret-key-change-this-in-production"
JWT_EXPIRES_IN="1d"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin123"
```

2. **Start PostgreSQL** (if using Docker):
```bash
docker-compose up -d postgres
```

3. **Generate Prisma Client** (already done):
```bash
npm run prisma:generate
```

4. **Run Database Migrations**:
```bash
npm run prisma:migrate
```

5. **Seed the Database**:
```bash
npm run prisma:seed
```

6. **Start the Development Server**:
```bash
npm run start:dev
```

The API will be available at:
- API: http://localhost:3000
- Swagger: http://localhost:3000/docs

## Default Admin Credentials
- Email: `admin@example.com`
- Password: `admin123`




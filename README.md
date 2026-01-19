# NestJS E-Commerce Backend

## Quick Start

### Using Docker Compose (Recommended)

```bash
docker-compose up --build
```

The API will be available at `http://localhost:3000`
Swagger documentation at `http://localhost:3000/docs`

### Manual Setup

1. Install dependencies:
```bash
npm install
```

2. Setup environment variables (create `.env` file):
```
DATABASE_URL="postgresql://user:password@localhost:5432/ecommerce?schema=public"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="1d"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin123"

# Cloudflare R2 Storage Configuration
STORAGE_DRIVER=r2
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET=your-bucket-name
R2_PUBLIC_URL_BASE=https://pub-your-account-id.r2.dev
```

3. Run Prisma migrations:
```bash
npx prisma migrate dev
npx prisma db seed
```

4. Start the server:
```bash
npm run start:dev
```

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRES_IN` - JWT token expiration time
- `ADMIN_EMAIL` - Admin user email for seeding
- `ADMIN_PASSWORD` - Admin user password for seeding
- `STORAGE_DRIVER` - Storage driver (currently supports `r2`)
- `R2_ENDPOINT` - Cloudflare R2 endpoint URL
- `R2_ACCESS_KEY_ID` - R2 access key ID
- `R2_SECRET_ACCESS_KEY` - R2 secret access key
- `R2_BUCKET` - R2 bucket name
- `R2_PUBLIC_URL_BASE` - R2 public URL base for accessing uploaded files

## API Endpoints

### Authentication
- `POST /auth/signup` - Register a new user
- `POST /auth/login` - Login user

### Categories (JWT required)
- `GET /categories` - Get all categories (User, Admin)
- `GET /categories/:id` - Get category by ID (User, Admin)
- `POST /categories` - Create category (Admin only)
- `PATCH /categories/:id` - Update category (Admin only)
- `DELETE /categories/:id` - Delete category (Admin only)

### Products (JWT required)
- `GET /products` - Get all products (User, Admin)
- `GET /products/:id` - Get product by ID (User, Admin)
- `POST /products` - Create product (Admin only) - Supports multipart/form-data with image uploads
- `PATCH /products/:id` - Update product (Admin only) - Supports multipart/form-data with image uploads
- `DELETE /products/:id` - Delete product (Admin only)

**Note:** Product image uploads are automatically uploaded to Cloudflare R2 storage. Images are returned with full public URLs in product responses.

### Users (Admin only)
- `GET /users` - Get all users

## Default Admin Credentials

Email: `admin@example.com`
Password: `admin123`

(Set via environment variables)




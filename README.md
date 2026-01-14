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
- `POST /products` - Create product (Admin only)
- `PATCH /products/:id` - Update product (Admin only)
- `DELETE /products/:id` - Delete product (Admin only)

### Users (Admin only)
- `GET /users` - Get all users

## Default Admin Credentials

Email: `admin@example.com`
Password: `admin123`

(Set via environment variables)



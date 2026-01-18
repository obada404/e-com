# NestJS E-Commerce Backend Requirements

## Tech Stack

- NestJS (latest)
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Role-based access control (Admin, User)
- Docker & Docker Compose

## Functional Requirements

### Authentication

- JWT-based authentication
- Password hashing with bcrypt
- Roles: ADMIN, USER

### Sample Auth Endpoints

- `POST /auth/signup`
  - body: `{ email, password }`
- `POST /auth/login`
  - body: `{ email, password }`
  - returns: `{ accessToken }`

## E-commerce Modules

### Users

- id (uuid)
- email (unique)
- password
- role (ADMIN | USER)
- createdAt

### Categories

- id (uuid)
- name
- createdAt

### Products

- id (uuid)
- name
- price
- categoryId (FK)
- createdAt

## Access Rules

### Admin

- Create / update / delete categories
- Create / update / delete products

### User

- Read products
- Read categories

## Guards & Decorators

- JWT Auth Guard
- Roles Guard
- `@Roles()` decorator

## Project Structure

```
src/
 ├─ auth/
 ├─ users/
 ├─ products/
 ├─ categories/
 ├─ prisma/
 │   ├─ prisma.service.ts
 ├─ common/
 │   ├─ guards/
 │   └─ decorators/
 └─ main.ts
```

## Prisma Requirements

### Prisma Schema

- Use PostgreSQL provider
- Define User, Product, Category
- Enum Role { ADMIN USER }

### Prisma Seed

- Seed one admin user
- Admin credentials loaded from env:
  - `ADMIN_EMAIL`
  - `ADMIN_PASSWORD`
- Password hashed with bcrypt

### Database

- PostgreSQL
- Environment variables for DB connection
- Prisma migrations enabled

## Docker Requirements

### docker-compose.yml

- postgres service
- api service (NestJS)
- shared network
- volumes for postgres data
- Prisma migrate + seed on container start

## Environment Variables

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

## Swagger

- Enable Swagger at `/docs`
- Include Bearer auth

## Command List to Execute

```bash
# Create project
nest new ecommerce-api

cd ecommerce-api

# Install dependencies
npm install prisma @prisma/client
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install bcrypt
npm install class-validator class-transformer
npm install swagger-ui-express @nestjs/swagger

# Dev dependencies
npm install -D @types/bcrypt @types/passport-jwt

# Prisma setup
npx prisma init

# Generate modules
nest g module auth
nest g controller auth
nest g service auth

nest g module users
nest g module products
nest g module categories

nest g guard common/guards/jwt-auth
nest g guard common/guards/roles

# Prisma migrate & seed
npx prisma migrate dev
npx prisma db seed

# Run with Docker
docker-compose up --build
```

## Output Expectations

- Fully working NestJS project
- Prisma ORM with migrations
- Admin user auto-seeded
- JWT login/signup works
- Role-based authorization enforced
- PostgreSQL via Docker Compose
- Products & categories CRUD protected by roles
- Swagger available




# 🌱 Seed Data Guide

This guide explains how to seed and clean up your database with sample data.

## 📦 What's Included in Seed Data

### Users (4 total)
- **1 Admin**: `admin@example.com` / `admin123`
- **3 Regular Users**: 
  - `user1@example.com` / `user123`
  - `user2@example.com` / `user123`
  - `user3@example.com` / `user123`

### Categories (6 total)
- Electronics
- Clothing
- Home & Garden
- Sports & Outdoors
- Books
- Toys & Games

### Products (13 total with images and sizes)

#### Electronics (3 products)
- UltraBook Pro 15 (Laptop) - 2 sizes, 25 in stock
- SmartPhone X Pro - 3 sizes, 50 in stock
- Premium Noise-Canceling Headphones - 2 sizes, 75 in stock

#### Clothing (3 products)
- Cotton Crew Neck T-Shirt - 5 sizes, 150 in stock
- Premium Denim Jeans - 5 sizes, 100 in stock
- Insulated Winter Jacket - 4 sizes, 45 in stock

#### Home & Garden (2 products)
- Programmable Coffee Maker - 1 size, 60 in stock
- Modern Ceramic Planter - 3 sizes, 8 in stock ⚠️ *Low Stock*

#### Sports & Outdoors (2 products)
- Premium Non-Slip Yoga Mat - 2 sizes, 90 in stock
- Outdoor Adventure Backpack - 3 sizes, 35 in stock

#### Books (1 product)
- The Complete Cooking Guide - 2 sizes, 120 in stock

#### Toys & Games (2 products)
- Family Game Night Collection - 2 sizes, 65 in stock
- 1000 Piece Landscape Puzzle - 3 sizes, 80 in stock

### Promotions (5 total)
- **Summer Sale** - Active, ends in 25 days
- **New Arrivals** - Active, ends in 28 days
- **Weekend Flash Sale** - Active, ends in 2 days
- **Free Shipping** - Active, ends in 20 days
- **Black Friday Preview** - Inactive, starts in 10 days

## 🚀 Commands

### Seed the Database
Populate the database with all sample data:
```bash
npm run prisma:seed
```

### Clean Up (Rollback) Database
Delete all seeded data in one click:
```bash
npm run prisma:cleanup
```

**Note**: The cleanup script preserves the admin user by default. If you want to delete ALL users including admin, edit `prisma/cleanup.ts` and uncomment the indicated line.

### Full Reset and Re-seed
To completely reset and re-seed:
```bash
npm run prisma:cleanup && npm run prisma:seed
```

## 📊 Dashboard Statistics

After seeding, you can test the dashboard API with rich data:

```bash
# Get complete dashboard stats
GET http://localhost:3000/dashboard/stats
Authorization: Bearer <admin-token>
```

The dashboard will show:
- ✅ **4 Users** (3 regular + 1 admin)
- ✅ **6 Categories**
- ✅ **13 Products**
- ✅ **5 Promotions** (4 active)
- ✅ **1 Low Stock Alert** (Ceramic Plant Pot)
- ✅ Product distribution across categories
- ✅ Recent activity tracking

## 🔧 Customization

### Modify Seed Data
Edit `prisma/seed.ts` to:
- Add more products
- Change product details
- Adjust quantities
- Add more categories or promotions

### Modify Cleanup Behavior
Edit `prisma/cleanup.ts` to:
- Keep specific data
- Delete additional tables
- Change cleanup order

## 💡 Tips

1. **Test Dashboard**: Seed data provides realistic numbers for dashboard statistics
2. **Low Stock Testing**: One product (Ceramic Plant Pot) has only 8 items to test low stock alerts
3. **Date Ranges**: Promotions have varied dates to test active/inactive filtering
4. **Image URLs**: Uses Unsplash placeholder images (no local storage needed)
5. **Admin Preservation**: Cleanup keeps admin user so you can re-seed without losing access

## 🎯 Use Cases

- **Development**: Quickly populate database for local testing
- **Demo**: Show features with realistic data
- **Testing**: Test dashboard, filters, and statistics with varied data
- **Presentation**: Professional-looking sample data for demos
- **Reset**: Easy rollback when data gets messy during testing

## ⚠️ Warning

These scripts will DELETE DATA. Only use in development environments!
Never run cleanup scripts on production databases.


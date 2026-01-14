import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // Create Admin User
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedAdminPassword,
      role: Role.ADMIN,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create Regular Users
  const userPassword = await bcrypt.hash('user123', 10);
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'user1@example.com' },
      update: {},
      create: {
        email: 'user1@example.com',
        password: userPassword,
        role: Role.USER,
      },
    }),
    prisma.user.upsert({
      where: { email: 'user2@example.com' },
      update: {},
      create: {
        email: 'user2@example.com',
        password: userPassword,
        role: Role.USER,
      },
    }),
    prisma.user.upsert({
      where: { email: 'user3@example.com' },
      update: {},
      create: {
        email: 'user3@example.com',
        password: userPassword,
        role: Role.USER,
      },
    }),
  ]);
  console.log(`✅ ${users.length} regular users created\n`);

  // Create Categories
  const categories = await Promise.all([
    prisma.category.create({
      data: { name: 'Electronics' },
    }),
    prisma.category.create({
      data: { name: 'Clothing' },
    }),
    prisma.category.create({
      data: { name: 'Home & Garden' },
    }),
    prisma.category.create({
      data: { name: 'Sports & Outdoors' },
    }),
    prisma.category.create({
      data: { name: 'Books' },
    }),
    prisma.category.create({
      data: { name: 'Toys & Games' },
    }),
  ]);
  console.log(`✅ ${categories.length} categories created`);

  // Create Products with Images and Sizes
  // Electronics Products
  const laptop = await prisma.product.create({
    data: {
      title: 'Premium Laptop',
      name: 'UltraBook Pro 15',
      description:
        'High-performance laptop with 16GB RAM, 512GB SSD, and stunning display. Perfect for professionals and creatives.',
      note: 'Comes with 2-year warranty and free shipping',
      quantity: 25,
      categoryId: categories[0].id,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853',
            alt: 'Laptop front view',
            order: 1,
          },
          {
            url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8',
            alt: 'Laptop side view',
            order: 2,
          },
        ],
      },
      sizes: {
        create: [
          { size: '512GB', price: 1299.99 },
          { size: '1TB', price: 1599.99 },
        ],
      },
    },
  });

  const smartphone = await prisma.product.create({
    data: {
      title: 'Latest Smartphone',
      name: 'SmartPhone X Pro',
      description:
        'Latest flagship smartphone with 5G, triple camera system, and all-day battery life.',
      note: 'Available in multiple colors',
      quantity: 50,
      categoryId: categories[0].id,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9',
            alt: 'Smartphone front',
            order: 1,
          },
        ],
      },
      sizes: {
        create: [
          { size: '128GB', price: 899.99 },
          { size: '256GB', price: 999.99 },
          { size: '512GB', price: 1199.99 },
        ],
      },
    },
  });

  const headphones = await prisma.product.create({
    data: {
      title: 'Wireless Headphones',
      name: 'Premium Noise-Canceling Headphones',
      description:
        'Industry-leading noise cancellation with premium sound quality and 30-hour battery life.',
      note: 'Includes carrying case',
      quantity: 75,
      categoryId: categories[0].id,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
            alt: 'Headphones',
            order: 1,
          },
        ],
      },
      sizes: {
        create: [
          { size: 'Standard', price: 349.99 },
          { size: 'Premium', price: 449.99 },
        ],
      },
    },
  });

  // Clothing Products
  const tshirt = await prisma.product.create({
    data: {
      title: 'Classic T-Shirt',
      name: 'Cotton Crew Neck T-Shirt',
      description:
        '100% premium cotton t-shirt with comfortable fit. Perfect for everyday wear.',
      note: 'Machine washable',
      quantity: 150,
      categoryId: categories[1].id,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab',
            alt: 'T-shirt',
            order: 1,
          },
        ],
      },
      sizes: {
        create: [
          { size: 'S', price: 19.99 },
          { size: 'M', price: 19.99 },
          { size: 'L', price: 19.99 },
          { size: 'XL', price: 21.99 },
          { size: 'XXL', price: 21.99 },
        ],
      },
    },
  });

  const jeans = await prisma.product.create({
    data: {
      title: 'Slim Fit Jeans',
      name: 'Premium Denim Jeans',
      description:
        'Stylish slim-fit jeans made from premium denim with stretch comfort.',
      note: 'Available in multiple washes',
      quantity: 100,
      categoryId: categories[1].id,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1542272604-787c3835535d',
            alt: 'Jeans',
            order: 1,
          },
        ],
      },
      sizes: {
        create: [
          { size: '28', price: 59.99 },
          { size: '30', price: 59.99 },
          { size: '32', price: 59.99 },
          { size: '34', price: 59.99 },
          { size: '36', price: 64.99 },
        ],
      },
    },
  });

  const jacket = await prisma.product.create({
    data: {
      title: 'Winter Jacket',
      name: 'Insulated Winter Jacket',
      description:
        'Warm and stylish winter jacket with water-resistant exterior and cozy insulation.',
      note: 'Perfect for cold weather',
      quantity: 45,
      categoryId: categories[1].id,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5',
            alt: 'Winter jacket',
            order: 1,
          },
        ],
      },
      sizes: {
        create: [
          { size: 'S', price: 129.99 },
          { size: 'M', price: 129.99 },
          { size: 'L', price: 134.99 },
          { size: 'XL', price: 139.99 },
        ],
      },
    },
  });

  // Home & Garden Products
  const coffeeMaker = await prisma.product.create({
    data: {
      title: 'Coffee Maker',
      name: 'Programmable Coffee Maker',
      description:
        'Brew perfect coffee every time with this programmable coffee maker. 12-cup capacity.',
      note: 'Includes reusable filter',
      quantity: 60,
      categoryId: categories[2].id,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6',
            alt: 'Coffee maker',
            order: 1,
          },
        ],
      },
      sizes: {
        create: [{ size: '12-Cup', price: 79.99 }],
      },
    },
  });

  const plantPot = await prisma.product.create({
    data: {
      title: 'Ceramic Plant Pot',
      name: 'Modern Ceramic Planter',
      description:
        'Beautiful ceramic plant pot with drainage hole. Perfect for indoor plants.',
      note: 'Multiple colors available',
      quantity: 8,
      categoryId: categories[2].id,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411',
            alt: 'Plant pot',
            order: 1,
          },
        ],
      },
      sizes: {
        create: [
          { size: 'Small', price: 14.99 },
          { size: 'Medium', price: 24.99 },
          { size: 'Large', price: 34.99 },
        ],
      },
    },
  });

  // Sports & Outdoors Products
  const yogaMat = await prisma.product.create({
    data: {
      title: 'Yoga Mat',
      name: 'Premium Non-Slip Yoga Mat',
      description:
        'Extra thick yoga mat with superior grip and cushioning. Eco-friendly materials.',
      note: 'Includes carrying strap',
      quantity: 90,
      categoryId: categories[3].id,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f',
            alt: 'Yoga mat',
            order: 1,
          },
        ],
      },
      sizes: {
        create: [
          { size: 'Standard', price: 39.99 },
          { size: 'Extra Long', price: 49.99 },
        ],
      },
    },
  });

  const backpack = await prisma.product.create({
    data: {
      title: 'Hiking Backpack',
      name: 'Outdoor Adventure Backpack',
      description:
        'Durable hiking backpack with multiple compartments and water-resistant material.',
      note: 'Lifetime warranty',
      quantity: 35,
      categoryId: categories[3].id,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62',
            alt: 'Backpack',
            order: 1,
          },
        ],
      },
      sizes: {
        create: [
          { size: '30L', price: 89.99 },
          { size: '50L', price: 119.99 },
          { size: '70L', price: 149.99 },
        ],
      },
    },
  });

  // Books Products
  const cookbook = await prisma.product.create({
    data: {
      title: 'Cooking Mastery',
      name: 'The Complete Cooking Guide',
      description:
        'Comprehensive cookbook with over 500 recipes from around the world. Step-by-step instructions.',
      note: 'Hardcover edition',
      quantity: 120,
      categoryId: categories[4].id,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794',
            alt: 'Cookbook',
            order: 1,
          },
        ],
      },
      sizes: {
        create: [
          { size: 'Paperback', price: 24.99 },
          { size: 'Hardcover', price: 39.99 },
        ],
      },
    },
  });

  // Toys & Games Products
  const boardGame = await prisma.product.create({
    data: {
      title: 'Strategy Board Game',
      name: 'Family Game Night Collection',
      description:
        'Award-winning strategy board game for 2-6 players. Hours of entertainment for the whole family.',
      note: 'Ages 10+',
      quantity: 65,
      categoryId: categories[5].id,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09',
            alt: 'Board game',
            order: 1,
          },
        ],
      },
      sizes: {
        create: [
          { size: 'Standard Edition', price: 44.99 },
          { size: 'Deluxe Edition', price: 69.99 },
        ],
      },
    },
  });

  const puzzle = await prisma.product.create({
    data: {
      title: 'Jigsaw Puzzle',
      name: '1000 Piece Landscape Puzzle',
      description:
        'Beautiful landscape jigsaw puzzle with premium quality pieces. Perfect for relaxation.',
      note: 'Finished size: 27" x 19"',
      quantity: 80,
      categoryId: categories[5].id,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1551269901-5c5e14c25df7',
            alt: 'Puzzle',
            order: 1,
          },
        ],
      },
      sizes: {
        create: [
          { size: '500 Pieces', price: 19.99 },
          { size: '1000 Pieces', price: 29.99 },
          { size: '2000 Pieces', price: 39.99 },
        ],
      },
    },
  });

  console.log(`✅ 13 products created with images and sizes\n`);

  // Create Promotions
  const now = new Date();
  const promotions = await Promise.all([
    prisma.promotion.create({
      data: {
        title: 'Summer Sale - Up to 50% Off!',
        imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da',
        description:
          'Amazing summer discounts on electronics, clothing, and more. Limited time offer!',
        appearanceDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        closeDate: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
        isActive: true,
      },
    }),
    prisma.promotion.create({
      data: {
        title: 'New Arrivals - Shop Now!',
        imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8',
        description:
          'Check out our latest collection of products across all categories. Something for everyone!',
        appearanceDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        closeDate: new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000), // 28 days from now
        isActive: true,
      },
    }),
    prisma.promotion.create({
      data: {
        title: 'Weekend Flash Sale',
        imageUrl: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1',
        description:
          'This weekend only! Extra 20% off on selected items. Hurry while stocks last!',
        appearanceDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        closeDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        isActive: true,
      },
    }),
    prisma.promotion.create({
      data: {
        title: 'Free Shipping on Orders Over $50',
        imageUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec',
        description:
          'Enjoy free shipping on all orders over $50. No code needed, discount applied at checkout.',
        appearanceDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        closeDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
        isActive: true,
      },
    }),
    prisma.promotion.create({
      data: {
        title: 'Black Friday Preview',
        imageUrl: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db',
        description:
          'Get an early preview of our Black Friday deals. Sign up for exclusive access!',
        appearanceDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        closeDate: new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000), // 40 days from now
        isActive: false, // Not yet active
      },
    }),
  ]);
  console.log(`✅ ${promotions.length} promotions created\n`);

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Users: ${users.length + 1} (${users.length} regular + 1 admin)`);
  console.log(`   - Categories: ${categories.length}`);
  console.log(`   - Products: 13`);
  console.log(`   - Promotions: ${promotions.length}`);
  console.log('\n🔑 Login Credentials:');
  console.log('   Admin: admin@example.com / admin123');
  console.log('   Users: user1@example.com / user123');
  console.log('          user2@example.com / user123');
  console.log('          user3@example.com / user123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

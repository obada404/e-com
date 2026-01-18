import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  console.log('🧹 Starting database cleanup...\n');

  try {
    // Delete in order of dependencies (child tables first)
    
    // 1. Delete Cart Items
    const deletedCartItems = await prisma.cartItem.deleteMany({});
    console.log(`✅ Deleted ${deletedCartItems.count} cart items`);

    // 2. Delete Carts
    const deletedCarts = await prisma.cart.deleteMany({});
    console.log(`✅ Deleted ${deletedCarts.count} carts`);

    // 3. Delete Product Images
    const deletedImages = await prisma.productImage.deleteMany({});
    console.log(`✅ Deleted ${deletedImages.count} product images`);

    // 4. Delete Product Sizes
    const deletedSizes = await prisma.productSize.deleteMany({});
    console.log(`✅ Deleted ${deletedSizes.count} product sizes`);

    // 5. Delete Products
    const deletedProducts = await prisma.product.deleteMany({});
    console.log(`✅ Deleted ${deletedProducts.count} products`);

    // 6. Delete Categories
    const deletedCategories = await prisma.category.deleteMany({});
    console.log(`✅ Deleted ${deletedCategories.count} categories`);

    // 7. Delete Promotions
    const deletedPromotions = await prisma.promotion.deleteMany({});
    console.log(`✅ Deleted ${deletedPromotions.count} promotions`);

    // 8. Delete Users (except admin if you want to keep it)
    // Uncomment the line below if you want to delete ALL users including admin
    // const deletedUsers = await prisma.user.deleteMany({});
    
    // Delete only regular users (keep admin)
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        email: {
          not: process.env.ADMIN_EMAIL || 'admin@example.com',
        },
      },
    });
    console.log(`✅ Deleted ${deletedUsers.count} users (admin preserved)`);

    console.log('\n🎉 Database cleanup completed successfully!');
    console.log('\n💡 Tip: Run "npm run prisma:seed" to re-seed the database');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

cleanup()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('STANDALONE', 'VARIANT_BASED');

-- CreateEnum
CREATE TYPE "ProductRecordType" AS ENUM ('BASE_PRODUCT', 'VARIANT');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "parentProductId" TEXT,
ADD COLUMN     "price" DOUBLE PRECISION,
ADD COLUMN     "productType" "ProductType" NOT NULL DEFAULT 'STANDALONE',
ADD COLUMN     "recordType" "ProductRecordType" NOT NULL DEFAULT 'BASE_PRODUCT',
ADD COLUMN     "size" TEXT,
ADD COLUMN     "color" TEXT;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_parentProductId_fkey" FOREIGN KEY ("parentProductId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

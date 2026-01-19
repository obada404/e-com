-- AlterTable
-- Step 1: Add mobileNumber column as nullable initially
ALTER TABLE "users" ADD COLUMN "mobileNumber" TEXT;

-- Step 2: Update existing rows with a placeholder value
-- You may want to customize this based on your requirements
UPDATE "users" SET "mobileNumber" = '+0000000000' WHERE "mobileNumber" IS NULL;

-- Step 3: Add NOT NULL constraint
ALTER TABLE "users" ALTER COLUMN "mobileNumber" SET NOT NULL;
-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('income', 'expense');

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "type" "CategoryType" NOT NULL DEFAULT 'expense';

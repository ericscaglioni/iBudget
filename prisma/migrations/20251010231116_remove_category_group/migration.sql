/*
  Warnings:

  - You are about to drop the column `groupId` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the `category_groups` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "categories" DROP CONSTRAINT "categories_groupId_fkey";

-- AlterTable
ALTER TABLE "categories" DROP COLUMN "groupId";

-- DropTable
DROP TABLE "category_groups";

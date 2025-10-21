/*
  Warnings:

  - The values [current] on the enum `accounts_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `accounts` MODIFY `type` ENUM('cash', 'card', 'checking', 'savings', 'investment', 'wallet', 'other') NOT NULL;

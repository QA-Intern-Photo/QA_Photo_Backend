/*
  Warnings:

  - You are about to drop the column `sellerId` on the `Shop` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Shop" DROP CONSTRAINT "Shop_sellerId_fkey";

-- AlterTable
ALTER TABLE "Shop" DROP COLUMN "sellerId";

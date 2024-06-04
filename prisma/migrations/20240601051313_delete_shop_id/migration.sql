/*
  Warnings:

  - The primary key for the `Shop` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Shop` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Shop_cardId_cardOwnerId_key";

-- DropIndex
DROP INDEX "Shop_cardId_sellerId_key";

-- AlterTable
ALTER TABLE "Shop" DROP CONSTRAINT "Shop_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "Shop_pkey" PRIMARY KEY ("cardId", "cardOwnerId");

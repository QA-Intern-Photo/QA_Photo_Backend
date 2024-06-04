/*
  Warnings:

  - The primary key for the `Shop` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `cardOwnerId` on the `Shop` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Shop" DROP CONSTRAINT "Shop_cardId_cardOwnerId_fkey";

-- AlterTable
ALTER TABLE "Shop" DROP CONSTRAINT "Shop_pkey",
DROP COLUMN "cardOwnerId",
ADD COLUMN     "sellerId" TEXT NOT NULL DEFAULT '',
ADD CONSTRAINT "Shop_pkey" PRIMARY KEY ("cardId", "sellerId");

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_cardId_sellerId_fkey" FOREIGN KEY ("cardId", "sellerId") REFERENCES "Card"("id", "ownerId") ON DELETE RESTRICT ON UPDATE CASCADE;

/*
  Warnings:

  - The primary key for the `Card` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "Shop" DROP CONSTRAINT "Shop_cardId_fkey";

-- DropIndex
DROP INDEX "Card_id_ownerId_key";

-- DropIndex
DROP INDEX "Shop_cardId_key";

-- AlterTable
ALTER TABLE "Card" DROP CONSTRAINT "Card_pkey",
ADD CONSTRAINT "Card_pkey" PRIMARY KEY ("id", "ownerId");

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_cardId_sellerId_fkey" FOREIGN KEY ("cardId", "sellerId") REFERENCES "Card"("id", "ownerId") ON DELETE RESTRICT ON UPDATE CASCADE;

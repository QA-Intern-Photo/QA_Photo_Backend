/*
  Warnings:

  - A unique constraint covering the columns `[cardId,cardOwnerId]` on the table `Shop` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cardOwnerId` to the `Shop` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Shop" DROP CONSTRAINT "Shop_cardId_sellerId_fkey";

-- DropIndex
DROP INDEX "Shop_cardId_sellerId_key";

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "cardOwnerId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Shop_cardId_cardOwnerId_key" ON "Shop"("cardId", "cardOwnerId");

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_cardId_cardOwnerId_fkey" FOREIGN KEY ("cardId", "cardOwnerId") REFERENCES "Card"("id", "ownerId") ON DELETE RESTRICT ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the `Store` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[id,ownerId]` on the table `Card` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "CardStatus" AS ENUM ('SALE', 'NOT_FOR_SALE');

-- DropForeignKey
ALTER TABLE "Store" DROP CONSTRAINT "Store_cardId_fkey";

-- DropForeignKey
ALTER TABLE "Store" DROP CONSTRAINT "Store_sellerId_fkey";

-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "exchangingQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sellingQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" "CardStatus" NOT NULL DEFAULT 'NOT_FOR_SALE';

-- DropTable
DROP TABLE "Store";

-- CreateTable
CREATE TABLE "Shop" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "sellingPrice" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shop_cardId_key" ON "Shop"("cardId");

-- CreateIndex
CREATE UNIQUE INDEX "Shop_cardId_sellerId_key" ON "Shop"("cardId", "sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "Card_id_ownerId_key" ON "Card"("id", "ownerId");

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

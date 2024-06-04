/*
  Warnings:

  - A unique constraint covering the columns `[cardId,sellerId]` on the table `Shop` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Shop_cardId_sellerId_key" ON "Shop"("cardId", "sellerId");

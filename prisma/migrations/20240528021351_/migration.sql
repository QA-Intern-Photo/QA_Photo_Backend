/*
  Warnings:

  - A unique constraint covering the columns `[cardId]` on the table `Store` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "Exchange" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,

    CONSTRAINT "Exchange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Store_cardId_key" ON "Store"("cardId");

-- AddForeignKey
ALTER TABLE "Exchange" ADD CONSTRAINT "Exchange_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

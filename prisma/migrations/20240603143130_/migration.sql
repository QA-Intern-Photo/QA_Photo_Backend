/*
  Warnings:

  - You are about to drop the column `exchangingQuantity` on the `Exchange` table. All the data in the column will be lost.
  - The primary key for the `Shop` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `offeredCardId` to the `Exchange` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetCardId` to the `Exchange` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `Shop` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "Exchange" DROP CONSTRAINT "Exchange_requesterId_fkey";

-- AlterTable
ALTER TABLE "Exchange" DROP COLUMN "exchangingQuantity",
ADD COLUMN     "offeredCardId" TEXT NOT NULL,
ADD COLUMN     "targetCardId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Shop" DROP CONSTRAINT "Shop_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "Shop_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "Exchange" ADD CONSTRAINT "Exchange_targetCardId_fkey" FOREIGN KEY ("targetCardId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exchange" ADD CONSTRAINT "Exchange_offeredCardId_requesterId_fkey" FOREIGN KEY ("offeredCardId", "requesterId") REFERENCES "Card"("id", "ownerId") ON DELETE RESTRICT ON UPDATE CASCADE;

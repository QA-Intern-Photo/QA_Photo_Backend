/*
  Warnings:

  - You are about to drop the column `exchangingQuantity` on the `Card` table. All the data in the column will be lost.
  - You are about to drop the column `remainingQuantity` on the `Card` table. All the data in the column will be lost.
  - You are about to drop the column `sellingQuantity` on the `Card` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Card` table. All the data in the column will be lost.
  - Added the required column `availableQuantity` to the `Card` table without a default value. This is not possible if the table is not empty.
  - Added the required column `remainingQuantity` to the `Shop` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Card" DROP COLUMN "exchangingQuantity",
DROP COLUMN "remainingQuantity",
DROP COLUMN "sellingQuantity",
DROP COLUMN "status",
ADD COLUMN     "availableQuantity" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Exchange" ADD COLUMN     "exchangingQuantity" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "remainingQuantity" INTEGER NOT NULL,
ADD COLUMN     "sellingQuantity" INTEGER NOT NULL DEFAULT 0;

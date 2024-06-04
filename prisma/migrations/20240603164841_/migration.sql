/*
  Warnings:

  - Added the required column `wishExchageDescription` to the `Shop` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wishExchangeGenre` to the `Shop` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wishExchangeGrade` to the `Shop` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "wishExchageDescription" TEXT NOT NULL,
ADD COLUMN     "wishExchangeGenre" "Genre" NOT NULL,
ADD COLUMN     "wishExchangeGrade" "Grade" NOT NULL;

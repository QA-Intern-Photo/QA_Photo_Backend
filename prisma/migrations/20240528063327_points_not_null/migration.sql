/*
  Warnings:

  - You are about to drop the column `dexcription` on the `Card` table. All the data in the column will be lost.
  - The `grade` column on the `Card` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `genre` column on the `Card` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `description` to the `Card` table without a default value. This is not possible if the table is not empty.
  - Made the column `points` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "Genre" AS ENUM ('TRIP', 'PORTRAIT', 'OBJECT', 'LANDSCAPE');

-- CreateEnum
CREATE TYPE "Grade" AS ENUM ('COMMON', 'RARE', 'SUPER_RARE', 'LEGENDARY');

-- AlterTable
ALTER TABLE "Card" DROP COLUMN "dexcription",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT NOT NULL,
DROP COLUMN "grade",
ADD COLUMN     "grade" "Grade" NOT NULL DEFAULT 'COMMON',
DROP COLUMN "genre",
ADD COLUMN     "genre" "Genre" NOT NULL DEFAULT 'LANDSCAPE',
ALTER COLUMN "totalQuantity" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "points" SET NOT NULL,
ALTER COLUMN "points" SET DEFAULT 0;

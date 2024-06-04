/*
  Warnings:

  - Added the required column `requestMessage` to the `Exchange` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Exchange" ADD COLUMN     "requestMessage" TEXT NOT NULL;

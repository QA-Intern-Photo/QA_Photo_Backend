-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('READ', 'NOT_READ');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "status" "NotificationStatus" NOT NULL DEFAULT 'NOT_READ';

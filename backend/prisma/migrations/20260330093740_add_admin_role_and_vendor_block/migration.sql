-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'ADMIN';

-- AlterTable
ALTER TABLE "vendors" ADD COLUMN     "isBlocked" BOOLEAN NOT NULL DEFAULT false;

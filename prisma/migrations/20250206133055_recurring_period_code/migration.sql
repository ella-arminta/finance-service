/*
  Warnings:

  - Added the required column `code` to the `Recurring_Period` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Recurring_Period" ADD COLUMN     "code" TEXT NOT NULL;

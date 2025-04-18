/*
  Warnings:

  - Added the required column `date_remind` to the `Reminder_Payable_Receivables` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Reminder_Payable_Receivables" ADD COLUMN     "date_remind" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "emails" TEXT[];

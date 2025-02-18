/*
  Warnings:

  - Added the required column `account_code` to the `Report_Journals` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Report_Journals" ADD COLUMN     "account_code" INTEGER NOT NULL;

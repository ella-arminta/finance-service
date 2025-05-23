/*
  Warnings:

  - You are about to drop the column `category_balance_gram` on the `Report_Stocks` table. All the data in the column will be lost.
  - You are about to drop the column `category_balance_qty` on the `Report_Stocks` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Report_Stocks" DROP COLUMN "category_balance_gram",
DROP COLUMN "category_balance_qty";

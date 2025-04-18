/*
  Warnings:

  - You are about to drop the column `amount_payed` on the `Payable_Receivables` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Payable_Receivables" DROP COLUMN "amount_payed",
ADD COLUMN     "amount_paid" DECIMAL(65,30),
ALTER COLUMN "status" SET DEFAULT 0;

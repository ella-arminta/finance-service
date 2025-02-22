/*
  Warnings:

  - You are about to drop the column `trans_code` on the `Report_Stocks` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Report_Journals" ADD COLUMN     "company_code" TEXT,
ADD COLUMN     "store_code" TEXT,
ALTER COLUMN "trans_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Report_Stocks" DROP COLUMN "trans_code",
ALTER COLUMN "trans_id" DROP NOT NULL;

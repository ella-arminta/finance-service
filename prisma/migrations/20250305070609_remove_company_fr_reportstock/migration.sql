/*
  Warnings:

  - You are about to drop the column `company_id` on the `Report_Stocks` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Report_Stocks" DROP COLUMN "company_id",
ADD COLUMN     "category_code" TEXT,
ADD COLUMN     "category_name" TEXT,
ADD COLUMN     "product_code_code" TEXT,
ADD COLUMN     "product_name" TEXT,
ADD COLUMN     "trans_code" TEXT,
ADD COLUMN     "type_code" TEXT,
ADD COLUMN     "type_name" TEXT;

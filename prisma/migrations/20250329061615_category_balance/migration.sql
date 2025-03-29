-- AlterTable
ALTER TABLE "Report_Stocks" ADD COLUMN     "category_balance_gram" DECIMAL(65,30) DEFAULT 0,
ADD COLUMN     "category_balance_qty" DECIMAL(65,30) DEFAULT 0;

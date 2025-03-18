-- DropIndex
DROP INDEX "Report_Journals_code_company_id_store_id_trans_id_account_i_idx";

-- DropIndex
DROP INDEX "Report_Stocks_trans_date_idx";

-- AlterTable
ALTER TABLE "Report_Journals" ALTER COLUMN "company_id" DROP NOT NULL,
ALTER COLUMN "company_name" DROP NOT NULL,
ALTER COLUMN "store_name" DROP NOT NULL,
ALTER COLUMN "trans_type_code" DROP NOT NULL,
ALTER COLUMN "trans_type_name" DROP NOT NULL,
ALTER COLUMN "account_name" DROP NOT NULL,
ALTER COLUMN "account_code" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Report_Journals_code_store_id_trans_id_account_id_trans_dat_idx" ON "Report_Journals"("code", "store_id", "trans_id", "account_id", "trans_date", "trans_type_id");

-- CreateIndex
CREATE INDEX "Report_Stocks_trans_date_source_id_product_code_id_idx" ON "Report_Stocks"("trans_date", "source_id", "product_code_id");

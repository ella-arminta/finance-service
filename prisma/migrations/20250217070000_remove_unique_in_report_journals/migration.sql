-- DropIndex
DROP INDEX "Report_Journals_code_company_id_store_id_idx";

-- DropIndex
DROP INDEX "Report_Journals_code_store_id_key";

-- CreateIndex
CREATE INDEX "Report_Journals_code_company_id_store_id_trans_id_idx" ON "Report_Journals"("code", "company_id", "store_id", "trans_id");

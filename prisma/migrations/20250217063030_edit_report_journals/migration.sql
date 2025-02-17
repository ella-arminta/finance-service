/*
  Warnings:

  - A unique constraint covering the columns `[code,store_id]` on the table `Report_Journals` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `trans_id` to the `Report_Journals` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Report_Journals" ADD COLUMN     "trans_id" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "Report_Journals_code_company_id_store_id_idx" ON "Report_Journals"("code", "company_id", "store_id");

-- CreateIndex
CREATE UNIQUE INDEX "Report_Journals_code_store_id_key" ON "Report_Journals"("code", "store_id");

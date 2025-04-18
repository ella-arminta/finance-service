/*
  Warnings:

  - A unique constraint covering the columns `[report_journal_id]` on the table `Payable_Receivables_Detail` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Payable_Receivables_Detail_report_journal_id_key" ON "Payable_Receivables_Detail"("report_journal_id");

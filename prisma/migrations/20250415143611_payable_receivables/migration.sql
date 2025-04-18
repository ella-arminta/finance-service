/*
  Warnings:

  - You are about to drop the `Report_Payable` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Report_Receivable` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `trans_serv_id` on table `Report_Journals` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Report_Journals_code_store_id_trans_id_account_id_trans_dat_idx";

-- AlterTable
ALTER TABLE "Report_Journals" ALTER COLUMN "trans_serv_id" SET NOT NULL;

-- DropTable
DROP TABLE "Report_Payable";

-- DropTable
DROP TABLE "Report_Receivable";

-- CreateTable
CREATE TABLE "Payable_Receivables" (
    "id" UUID NOT NULL,
    "report_journal_id" UUID NOT NULL,
    "due_date" TIMESTAMP(3),
    "amount_payed" DECIMAL(65,30),
    "type" INTEGER NOT NULL,
    "status" INTEGER NOT NULL,

    CONSTRAINT "Payable_Receivables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payable_Receivables_Detail" (
    "id" UUID NOT NULL,
    "payable_receivable_id" UUID NOT NULL,
    "report_journal_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payable_Receivables_Detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reminder_Payable_Receivables" (
    "id" UUID NOT NULL,
    "payable_receivable_id" UUID NOT NULL,
    "interval" INTEGER NOT NULL,
    "period" TEXT NOT NULL,

    CONSTRAINT "Reminder_Payable_Receivables_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Report_Journals_code_store_id_trans_id_trans_serv_id_accoun_idx" ON "Report_Journals"("code", "store_id", "trans_id", "trans_serv_id", "account_id", "trans_date", "trans_type_id");

-- AddForeignKey
ALTER TABLE "Payable_Receivables" ADD CONSTRAINT "Payable_Receivables_report_journal_id_fkey" FOREIGN KEY ("report_journal_id") REFERENCES "Report_Journals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payable_Receivables_Detail" ADD CONSTRAINT "Payable_Receivables_Detail_report_journal_id_fkey" FOREIGN KEY ("report_journal_id") REFERENCES "Report_Journals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payable_Receivables_Detail" ADD CONSTRAINT "Payable_Receivables_Detail_payable_receivable_id_fkey" FOREIGN KEY ("payable_receivable_id") REFERENCES "Payable_Receivables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder_Payable_Receivables" ADD CONSTRAINT "Reminder_Payable_Receivables_payable_receivable_id_fkey" FOREIGN KEY ("payable_receivable_id") REFERENCES "Payable_Receivables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

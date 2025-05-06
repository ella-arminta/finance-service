-- DropForeignKey
ALTER TABLE "Payable_Receivables" DROP CONSTRAINT "Payable_Receivables_report_journal_id_fkey";

-- DropForeignKey
ALTER TABLE "Payable_Receivables_Detail" DROP CONSTRAINT "Payable_Receivables_Detail_journal_reverse_id_fkey";

-- DropForeignKey
ALTER TABLE "Payable_Receivables_Detail" DROP CONSTRAINT "Payable_Receivables_Detail_payable_receivable_id_fkey";

-- DropForeignKey
ALTER TABLE "Payable_Receivables_Detail" DROP CONSTRAINT "Payable_Receivables_Detail_report_journal_id_fkey";

-- DropForeignKey
ALTER TABLE "Reminder_Payable_Receivables" DROP CONSTRAINT "Reminder_Payable_Receivables_payable_receivable_id_fkey";

-- AddForeignKey
ALTER TABLE "Payable_Receivables" ADD CONSTRAINT "Payable_Receivables_report_journal_id_fkey" FOREIGN KEY ("report_journal_id") REFERENCES "Report_Journals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payable_Receivables_Detail" ADD CONSTRAINT "Payable_Receivables_Detail_report_journal_id_fkey" FOREIGN KEY ("report_journal_id") REFERENCES "Report_Journals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payable_Receivables_Detail" ADD CONSTRAINT "Payable_Receivables_Detail_journal_reverse_id_fkey" FOREIGN KEY ("journal_reverse_id") REFERENCES "Report_Journals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payable_Receivables_Detail" ADD CONSTRAINT "Payable_Receivables_Detail_payable_receivable_id_fkey" FOREIGN KEY ("payable_receivable_id") REFERENCES "Payable_Receivables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder_Payable_Receivables" ADD CONSTRAINT "Reminder_Payable_Receivables_payable_receivable_id_fkey" FOREIGN KEY ("payable_receivable_id") REFERENCES "Payable_Receivables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

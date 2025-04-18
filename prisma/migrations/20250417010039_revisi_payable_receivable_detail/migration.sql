/*
  Warnings:

  - A unique constraint covering the columns `[journal_reverse_id]` on the table `Payable_Receivables_Detail` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `created_by` to the `Payable_Receivables_Detail` table without a default value. This is not possible if the table is not empty.
  - Added the required column `journal_reverse_id` to the `Payable_Receivables_Detail` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Payable_Receivables_Detail" ADD COLUMN     "created_by" UUID NOT NULL,
ADD COLUMN     "journal_reverse_id" UUID NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Payable_Receivables_Detail_journal_reverse_id_key" ON "Payable_Receivables_Detail"("journal_reverse_id");

-- AddForeignKey
ALTER TABLE "Payable_Receivables_Detail" ADD CONSTRAINT "Payable_Receivables_Detail_journal_reverse_id_fkey" FOREIGN KEY ("journal_reverse_id") REFERENCES "Report_Journals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

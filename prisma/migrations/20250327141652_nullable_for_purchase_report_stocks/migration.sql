-- AlterTable
ALTER TABLE "Report_Stocks" ALTER COLUMN "category_id" DROP NOT NULL,
ALTER COLUMN "type_id" DROP NOT NULL,
ALTER COLUMN "product_id" DROP NOT NULL,
ALTER COLUMN "product_code_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Trans" ADD COLUMN     "deleted_by" UUID;

-- AddForeignKey
ALTER TABLE "TutupKasir" ADD CONSTRAINT "TutupKasir_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report_Journals" ADD CONSTRAINT "Report_Journals_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report_Journals" ADD CONSTRAINT "Report_Journals_trans_id_fkey" FOREIGN KEY ("trans_id") REFERENCES "Trans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report_Journals" ADD CONSTRAINT "Report_Journals_trans_type_id_fkey" FOREIGN KEY ("trans_type_id") REFERENCES "Trans_Type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report_Journals" ADD CONSTRAINT "Report_Journals_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

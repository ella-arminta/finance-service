-- AddForeignKey
ALTER TABLE "Trans_Recurring" ADD CONSTRAINT "Trans_Recurring_trans_type_id_fkey" FOREIGN KEY ("trans_type_id") REFERENCES "Trans_Type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

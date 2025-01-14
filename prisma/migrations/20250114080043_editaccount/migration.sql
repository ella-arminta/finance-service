-- AddForeignKey
ALTER TABLE "Accounts" ADD CONSTRAINT "Accounts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

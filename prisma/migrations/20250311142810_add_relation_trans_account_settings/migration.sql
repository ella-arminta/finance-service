-- AddForeignKey
ALTER TABLE "Trans_Account_Settings" ADD CONSTRAINT "Trans_Account_Settings_action_fkey" FOREIGN KEY ("action") REFERENCES "Action_Account_Settings"("action") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE "Trans_Account_Settings" DROP CONSTRAINT "Trans_Account_Settings_company_id_fkey";

-- AlterTable
ALTER TABLE "Trans_Account_Settings" ALTER COLUMN "company_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Trans_Account_Settings" ADD CONSTRAINT "Trans_Account_Settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

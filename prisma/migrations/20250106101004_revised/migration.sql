/*
  Warnings:

  - The primary key for the `Accounts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `account_id` on the `Accounts` table. All the data in the column will be lost.
  - The primary key for the `Auto_Trans` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `auto_id` on the `Auto_Trans` table. All the data in the column will be lost.
  - The primary key for the `Branchs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `branch_id` on the `Branchs` table. All the data in the column will be lost.
  - The primary key for the `Companies` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `company_id` on the `Companies` table. All the data in the column will be lost.
  - The primary key for the `Journal_Accounts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `ja_id` on the `Journal_Accounts` table. All the data in the column will be lost.
  - The primary key for the `Journals` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `journal_id` on the `Journals` table. All the data in the column will be lost.
  - The primary key for the `Scheduled_Trans` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `schedule_id` on the `Scheduled_Trans` table. All the data in the column will be lost.
  - The primary key for the `Scheduled_Trans_Accs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `sched_acc_id` on the `Scheduled_Trans_Accs` table. All the data in the column will be lost.
  - The primary key for the `Trans` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `trans_id` on the `Trans` table. All the data in the column will be lost.
  - The primary key for the `Users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `user_id` on the `Users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Accounts" DROP CONSTRAINT "Accounts_branch_id_fkey";

-- DropForeignKey
ALTER TABLE "Auto_Trans" DROP CONSTRAINT "Auto_Trans_acc_debit_id_fkey";

-- DropForeignKey
ALTER TABLE "Auto_Trans" DROP CONSTRAINT "Auto_Trans_acc_kredit_id_fkey";

-- DropForeignKey
ALTER TABLE "Branchs" DROP CONSTRAINT "Branchs_company_id_fkey";

-- DropForeignKey
ALTER TABLE "Journal_Accounts" DROP CONSTRAINT "Journal_Accounts_account_id_fkey";

-- DropForeignKey
ALTER TABLE "Journal_Accounts" DROP CONSTRAINT "Journal_Accounts_journal_id_fkey";

-- DropForeignKey
ALTER TABLE "Journals" DROP CONSTRAINT "Journals_branch_id_fkey";

-- DropForeignKey
ALTER TABLE "Scheduled_Trans" DROP CONSTRAINT "Scheduled_Trans_account_id_fkey";

-- DropForeignKey
ALTER TABLE "Scheduled_Trans" DROP CONSTRAINT "Scheduled_Trans_company_id_fkey";

-- DropForeignKey
ALTER TABLE "Scheduled_Trans_Accs" DROP CONSTRAINT "Scheduled_Trans_Accs_account_id_fkey";

-- DropForeignKey
ALTER TABLE "Trans" DROP CONSTRAINT "Trans_account_id_fkey";

-- DropForeignKey
ALTER TABLE "Trans" DROP CONSTRAINT "Trans_company_id_fkey";

-- DropForeignKey
ALTER TABLE "Users" DROP CONSTRAINT "Users_branch_id_fkey";

-- AlterTable
ALTER TABLE "Accounts" DROP CONSTRAINT "Accounts_pkey",
DROP COLUMN "account_id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Accounts_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Auto_Trans" DROP CONSTRAINT "Auto_Trans_pkey",
DROP COLUMN "auto_id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Auto_Trans_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Branchs" DROP CONSTRAINT "Branchs_pkey",
DROP COLUMN "branch_id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Branchs_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Companies" DROP CONSTRAINT "Companies_pkey",
DROP COLUMN "company_id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Companies_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Journal_Accounts" DROP CONSTRAINT "Journal_Accounts_pkey",
DROP COLUMN "ja_id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Journal_Accounts_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Journals" DROP CONSTRAINT "Journals_pkey",
DROP COLUMN "journal_id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Journals_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Scheduled_Trans" DROP CONSTRAINT "Scheduled_Trans_pkey",
DROP COLUMN "schedule_id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Scheduled_Trans_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Scheduled_Trans_Accs" DROP CONSTRAINT "Scheduled_Trans_Accs_pkey",
DROP COLUMN "sched_acc_id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Scheduled_Trans_Accs_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Trans" DROP CONSTRAINT "Trans_pkey",
DROP COLUMN "trans_id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Trans_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Users" DROP CONSTRAINT "Users_pkey",
DROP COLUMN "user_id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Users_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "Branchs" ADD CONSTRAINT "Branchs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Accounts" ADD CONSTRAINT "Accounts_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "Branchs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journals" ADD CONSTRAINT "Journals_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "Branchs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journal_Accounts" ADD CONSTRAINT "Journal_Accounts_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "Journals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journal_Accounts" ADD CONSTRAINT "Journal_Accounts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "Branchs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scheduled_Trans" ADD CONSTRAINT "Scheduled_Trans_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scheduled_Trans" ADD CONSTRAINT "Scheduled_Trans_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scheduled_Trans_Accs" ADD CONSTRAINT "Scheduled_Trans_Accs_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trans" ADD CONSTRAINT "Trans_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trans" ADD CONSTRAINT "Trans_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auto_Trans" ADD CONSTRAINT "Auto_Trans_acc_debit_id_fkey" FOREIGN KEY ("acc_debit_id") REFERENCES "Accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auto_Trans" ADD CONSTRAINT "Auto_Trans_acc_kredit_id_fkey" FOREIGN KEY ("acc_kredit_id") REFERENCES "Accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

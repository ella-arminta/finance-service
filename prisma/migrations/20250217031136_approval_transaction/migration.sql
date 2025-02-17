/*
  Warnings:

  - You are about to drop the `Auto_Trans` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Journal_Accounts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Journals` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Scheduled_Trans` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Scheduled_Trans_Accs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Auto_Trans" DROP CONSTRAINT "Auto_Trans_acc_debit_id_fkey";

-- DropForeignKey
ALTER TABLE "Auto_Trans" DROP CONSTRAINT "Auto_Trans_acc_kredit_id_fkey";

-- DropForeignKey
ALTER TABLE "Journal_Accounts" DROP CONSTRAINT "Journal_Accounts_account_id_fkey";

-- DropForeignKey
ALTER TABLE "Journal_Accounts" DROP CONSTRAINT "Journal_Accounts_journal_id_fkey";

-- DropForeignKey
ALTER TABLE "Journals" DROP CONSTRAINT "Journals_store_id_fkey";

-- DropForeignKey
ALTER TABLE "Scheduled_Trans" DROP CONSTRAINT "Scheduled_Trans_account_id_fkey";

-- DropForeignKey
ALTER TABLE "Scheduled_Trans" DROP CONSTRAINT "Scheduled_Trans_company_id_fkey";

-- DropForeignKey
ALTER TABLE "Scheduled_Trans_Accs" DROP CONSTRAINT "Scheduled_Trans_Accs_account_id_fkey";

-- AlterTable
ALTER TABLE "Trans" ADD COLUMN     "approve" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "approve_by" UUID;

-- DropTable
DROP TABLE "Auto_Trans";

-- DropTable
DROP TABLE "Journal_Accounts";

-- DropTable
DROP TABLE "Journals";

-- DropTable
DROP TABLE "Scheduled_Trans";

-- DropTable
DROP TABLE "Scheduled_Trans_Accs";

-- CreateTable
CREATE TABLE "Report_Journals" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "company_id" UUID NOT NULL,
    "company_name" TEXT NOT NULL,
    "store_id" UUID NOT NULL,
    "store_name" TEXT NOT NULL,
    "trans_date" TIMESTAMP(3) NOT NULL,
    "trans_type_id" INTEGER NOT NULL,
    "trans_type_code" TEXT NOT NULL,
    "trans_type_name" TEXT NOT NULL,
    "description" TEXT,
    "account_id" UUID NOT NULL,
    "account_name" UUID NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "detail_description" TEXT,
    "cash_bank" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Report_Journals_pkey" PRIMARY KEY ("id")
);

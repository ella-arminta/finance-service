/*
  Warnings:

  - You are about to drop the `Journal_Accounts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Journals` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Journal_Accounts" DROP CONSTRAINT "Journal_Accounts_account_id_fkey";

-- DropForeignKey
ALTER TABLE "Journal_Accounts" DROP CONSTRAINT "Journal_Accounts_journal_id_fkey";

-- DropForeignKey
ALTER TABLE "Journals" DROP CONSTRAINT "Journals_store_id_fkey";

-- DropTable
DROP TABLE "Journal_Accounts";

-- DropTable
DROP TABLE "Journals";

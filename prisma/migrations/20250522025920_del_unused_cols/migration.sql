/*
  Warnings:

  - You are about to drop the column `account_code` on the `Report_Journals` table. All the data in the column will be lost.
  - You are about to drop the column `account_name` on the `Report_Journals` table. All the data in the column will be lost.
  - You are about to drop the column `company_code` on the `Report_Journals` table. All the data in the column will be lost.
  - You are about to drop the column `company_id` on the `Report_Journals` table. All the data in the column will be lost.
  - You are about to drop the column `company_name` on the `Report_Journals` table. All the data in the column will be lost.
  - You are about to drop the column `store_code` on the `Report_Journals` table. All the data in the column will be lost.
  - You are about to drop the column `store_name` on the `Report_Journals` table. All the data in the column will be lost.
  - You are about to drop the column `trans_type_code` on the `Report_Journals` table. All the data in the column will be lost.
  - You are about to drop the column `trans_type_name` on the `Report_Journals` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Report_Journals" DROP COLUMN "account_code",
DROP COLUMN "account_name",
DROP COLUMN "company_code",
DROP COLUMN "company_id",
DROP COLUMN "company_name",
DROP COLUMN "store_code",
DROP COLUMN "store_name",
DROP COLUMN "trans_type_code",
DROP COLUMN "trans_type_name";

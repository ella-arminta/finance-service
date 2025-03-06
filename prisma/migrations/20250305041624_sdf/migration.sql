/*
  Warnings:

  - You are about to drop the column `category_code` on the `Report_Stocks` table. All the data in the column will be lost.
  - You are about to drop the column `category_name` on the `Report_Stocks` table. All the data in the column will be lost.
  - You are about to drop the column `company_code` on the `Report_Stocks` table. All the data in the column will be lost.
  - You are about to drop the column `company_name` on the `Report_Stocks` table. All the data in the column will be lost.
  - You are about to drop the column `product_code_code` on the `Report_Stocks` table. All the data in the column will be lost.
  - You are about to drop the column `product_name` on the `Report_Stocks` table. All the data in the column will be lost.
  - You are about to drop the column `source_code` on the `Report_Stocks` table. All the data in the column will be lost.
  - You are about to drop the column `source_name` on the `Report_Stocks` table. All the data in the column will be lost.
  - You are about to drop the column `store_code` on the `Report_Stocks` table. All the data in the column will be lost.
  - You are about to drop the column `store_name` on the `Report_Stocks` table. All the data in the column will be lost.
  - You are about to drop the column `trans_code` on the `Report_Stocks` table. All the data in the column will be lost.
  - You are about to drop the column `type_code` on the `Report_Stocks` table. All the data in the column will be lost.
  - You are about to drop the column `type_name` on the `Report_Stocks` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `Stock_Source` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Report_Journals_code_company_id_store_id_trans_id_idx";

-- AlterTable
ALTER TABLE "Report_Stocks" DROP COLUMN "category_code",
DROP COLUMN "category_name",
DROP COLUMN "company_code",
DROP COLUMN "company_name",
DROP COLUMN "product_code_code",
DROP COLUMN "product_name",
DROP COLUMN "source_code",
DROP COLUMN "source_name",
DROP COLUMN "store_code",
DROP COLUMN "store_name",
DROP COLUMN "trans_code",
DROP COLUMN "type_code",
DROP COLUMN "type_name";

-- CreateTable
CREATE TABLE "Report_Payable" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "record_type" TEXT NOT NULL,
    "trans_code" TEXT NOT NULL,
    "trans_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "payment_id" UUID,
    "payment_code" TEXT,
    "payment_date" TIMESTAMP(3),
    "payment_amount" DECIMAL(65,30),

    CONSTRAINT "Report_Payable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report_Receivable" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "record_type" TEXT NOT NULL,
    "trans_code" TEXT NOT NULL,
    "trans_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "payment_id" UUID,
    "payment_code" TEXT,
    "payment_date" TIMESTAMP(3),
    "payment_amount" DECIMAL(65,30),

    CONSTRAINT "Report_Receivable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Report_Journals_code_company_id_store_id_trans_id_account_i_idx" ON "Report_Journals"("code", "company_id", "store_id", "trans_id", "account_id", "trans_date");

-- CreateIndex
CREATE UNIQUE INDEX "Stock_Source_code_key" ON "Stock_Source"("code");

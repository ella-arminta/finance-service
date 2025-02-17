/*
  Warnings:

  - A unique constraint covering the columns `[company_id,code]` on the table `Accounts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `Trans_Account_Settings` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Accounts_company_id_deleted_at_store_id_account_type_id_idx";

-- AlterTable
ALTER TABLE "Accounts" ADD COLUMN     "created_by" UUID,
ADD COLUMN     "updated_by" UUID;

-- AlterTable
ALTER TABLE "Trans" ALTER COLUMN "weight_total" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Trans_Account_Settings" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "Accounts_company_id_deleted_at_store_id_account_type_id_cod_idx" ON "Accounts"("company_id", "deleted_at", "store_id", "account_type_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Accounts_company_id_code_key" ON "Accounts"("company_id", "code");

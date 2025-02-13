/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Trans_Type` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sub_total_price` to the `Trans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tax_price` to the `Trans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weight_total` to the `Trans` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Trans" ADD COLUMN     "sub_total_price" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "tax_price" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "weight_total" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "trans_date" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updated_by" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Trans_Account_Settings" (
    "id" SERIAL NOT NULL,
    "store_id" UUID,
    "company_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "action" TEXT NOT NULL,

    CONSTRAINT "Trans_Account_Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Trans_Account_Settings_store_id_company_id_action_key" ON "Trans_Account_Settings"("store_id", "company_id", "action");

-- CreateIndex
CREATE UNIQUE INDEX "Trans_Type_code_key" ON "Trans_Type"("code");

-- AddForeignKey
ALTER TABLE "Trans_Account_Settings" ADD CONSTRAINT "Trans_Account_Settings_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trans_Account_Settings" ADD CONSTRAINT "Trans_Account_Settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trans_Account_Settings" ADD CONSTRAINT "Trans_Account_Settings_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the column `deleted_at` on the `Trans_Account_Settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Trans_Account_Settings" DROP COLUMN "deleted_at";

-- CreateTable
CREATE TABLE "Action_Account_Settings" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Action_Account_Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Action_Account_Settings_action_key" ON "Action_Account_Settings"("action");

-- CreateIndex
CREATE INDEX "Account_Types_code_deleted_at_idx" ON "Account_Types"("code", "deleted_at");

-- CreateIndex
CREATE INDEX "Report_Stocks_trans_date_idx" ON "Report_Stocks"("trans_date");

-- CreateIndex
CREATE INDEX "Trans_Account_Settings_store_id_action_idx" ON "Trans_Account_Settings"("store_id", "action");

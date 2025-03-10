/*
  Warnings:

  - You are about to drop the column `company_id` on the `Trans_Account_Settings` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[store_id,action]` on the table `Trans_Account_Settings` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Trans_Account_Settings" DROP CONSTRAINT "Trans_Account_Settings_company_id_fkey";

-- DropIndex
DROP INDEX "Trans_Account_Settings_store_id_company_id_action_key";

-- AlterTable
ALTER TABLE "Trans_Account_Settings" DROP COLUMN "company_id";

-- CreateIndex
CREATE UNIQUE INDEX "Trans_Account_Settings_store_id_action_key" ON "Trans_Account_Settings"("store_id", "action");

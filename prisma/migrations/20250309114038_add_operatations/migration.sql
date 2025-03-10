/*
  Warnings:

  - Made the column `store_id` on table `Trans_Account_Settings` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Trans_Account_Settings" DROP CONSTRAINT "Trans_Account_Settings_store_id_fkey";

-- AlterTable
ALTER TABLE "Trans_Account_Settings" ALTER COLUMN "store_id" SET NOT NULL;

-- CreateTable
CREATE TABLE "Operations" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL NOT NULL,
    "uom" TEXT NOT NULL,
    "description" TEXT,
    "store_id" UUID NOT NULL,
    "account_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Operations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Operations_deleted_at_idx" ON "Operations"("deleted_at");

-- AddForeignKey
ALTER TABLE "Trans_Account_Settings" ADD CONSTRAINT "Trans_Account_Settings_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operations" ADD CONSTRAINT "Operations_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operations" ADD CONSTRAINT "Operations_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

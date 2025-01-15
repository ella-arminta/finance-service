/*
  Warnings:

  - The primary key for the `Trans` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `account_id` on the `Trans` table. All the data in the column will be lost.
  - You are about to drop the column `company_id` on the `Trans` table. All the data in the column will be lost.
  - You are about to drop the column `created_date` on the `Trans` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Trans` table. All the data in the column will be lost.
  - You are about to drop the column `updated_date` on the `Trans` table. All the data in the column will be lost.
  - Added the required column `store_id` to the `Trans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trans_type_id` to the `Trans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Trans` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `Trans` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Trans" DROP CONSTRAINT "Trans_account_id_fkey";

-- DropForeignKey
ALTER TABLE "Trans" DROP CONSTRAINT "Trans_company_id_fkey";

-- AlterTable
ALTER TABLE "Journals" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Trans" DROP CONSTRAINT "Trans_pkey",
DROP COLUMN "account_id",
DROP COLUMN "company_id",
DROP COLUMN "created_date",
DROP COLUMN "type",
DROP COLUMN "updated_date",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "store_id" UUID NOT NULL,
ADD COLUMN     "trans_type_id" INTEGER NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "Trans_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "Trans_Type" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trans_Type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trans_Details" (
    "id" SERIAL NOT NULL,
    "trans_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT,

    CONSTRAINT "Trans_Details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Trans_Details_trans_id_idx" ON "Trans_Details"("trans_id");

-- CreateIndex
CREATE INDEX "Accounts_company_id_deleted_at_store_id_account_type_id_idx" ON "Accounts"("company_id", "deleted_at", "store_id", "account_type_id");

-- CreateIndex
CREATE INDEX "Companies_owner_id_deleted_at_idx" ON "Companies"("owner_id", "deleted_at");

-- CreateIndex
CREATE INDEX "Journals_store_id_deleted_at_idx" ON "Journals"("store_id", "deleted_at");

-- CreateIndex
CREATE INDEX "Scheduled_Trans_company_id_idx" ON "Scheduled_Trans"("company_id");

-- CreateIndex
CREATE INDEX "Stores_company_id_deleted_at_idx" ON "Stores"("company_id", "deleted_at");

-- CreateIndex
CREATE INDEX "Trans_store_id_trans_type_id_idx" ON "Trans"("store_id", "trans_type_id");

-- AddForeignKey
ALTER TABLE "Trans" ADD CONSTRAINT "Trans_trans_type_id_fkey" FOREIGN KEY ("trans_type_id") REFERENCES "Trans_Type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trans" ADD CONSTRAINT "Trans_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trans_Details" ADD CONSTRAINT "Trans_Details_trans_id_fkey" FOREIGN KEY ("trans_id") REFERENCES "Trans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trans_Details" ADD CONSTRAINT "Trans_Details_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

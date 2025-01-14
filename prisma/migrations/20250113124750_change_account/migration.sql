/*
  Warnings:

  - The primary key for the `Accounts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `type` on the `Accounts` table. All the data in the column will be lost.
  - Added the required column `account_type_id` to the `Accounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_id` to the `Accounts` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `Accounts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `acc_debit_id` on the `Auto_Trans` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `acc_kredit_id` on the `Auto_Trans` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `account_id` on the `Journal_Accounts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `account_id` to the `Scheduled_Trans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `account_id` to the `Scheduled_Trans_Accs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `account_id` to the `Trans` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Accounts" DROP CONSTRAINT "Accounts_store_id_fkey";

-- DropForeignKey
ALTER TABLE "Auto_Trans" DROP CONSTRAINT "Auto_Trans_acc_debit_id_fkey";

-- DropForeignKey
ALTER TABLE "Auto_Trans" DROP CONSTRAINT "Auto_Trans_acc_kredit_id_fkey";

-- DropForeignKey
ALTER TABLE "Journal_Accounts" DROP CONSTRAINT "Journal_Accounts_account_id_fkey";

-- DropForeignKey
ALTER TABLE "Scheduled_Trans" DROP CONSTRAINT "Scheduled_Trans_account_id_fkey";

-- DropForeignKey
ALTER TABLE "Scheduled_Trans_Accs" DROP CONSTRAINT "Scheduled_Trans_Accs_account_id_fkey";

-- DropForeignKey
ALTER TABLE "Trans" DROP CONSTRAINT "Trans_account_id_fkey";

-- AlterTable
ALTER TABLE "Accounts" DROP CONSTRAINT "Accounts_pkey",
DROP COLUMN "type",
ADD COLUMN     "account_type_id" INTEGER NOT NULL,
ADD COLUMN     "company_id" UUID NOT NULL,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "store_id" DROP NOT NULL,
ADD CONSTRAINT "Accounts_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Auto_Trans" DROP COLUMN "acc_debit_id",
ADD COLUMN     "acc_debit_id" UUID NOT NULL,
DROP COLUMN "acc_kredit_id",
ADD COLUMN     "acc_kredit_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Journal_Accounts" DROP COLUMN "account_id",
ADD COLUMN     "account_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Scheduled_Trans" DROP COLUMN "account_id",
ADD COLUMN     "account_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Scheduled_Trans_Accs" DROP COLUMN "account_id",
ADD COLUMN     "account_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Trans" DROP COLUMN "account_id",
ADD COLUMN     "account_id" UUID NOT NULL;

-- CreateTable
CREATE TABLE "Account_Types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Account_Types_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Accounts" ADD CONSTRAINT "Accounts_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Accounts" ADD CONSTRAINT "Accounts_account_type_id_fkey" FOREIGN KEY ("account_type_id") REFERENCES "Account_Types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journal_Accounts" ADD CONSTRAINT "Journal_Accounts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scheduled_Trans" ADD CONSTRAINT "Scheduled_Trans_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scheduled_Trans_Accs" ADD CONSTRAINT "Scheduled_Trans_Accs_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trans" ADD CONSTRAINT "Trans_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auto_Trans" ADD CONSTRAINT "Auto_Trans_acc_debit_id_fkey" FOREIGN KEY ("acc_debit_id") REFERENCES "Accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auto_Trans" ADD CONSTRAINT "Auto_Trans_acc_kredit_id_fkey" FOREIGN KEY ("acc_kredit_id") REFERENCES "Accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

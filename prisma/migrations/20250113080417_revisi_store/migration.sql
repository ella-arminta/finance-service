/*
  Warnings:

  - The primary key for the `Stores` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `Users` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `store_id` on the `Accounts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `store_id` on the `Journals` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `Stores` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `company_id` on table `Stores` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Accounts" DROP CONSTRAINT "Accounts_store_id_fkey";

-- DropForeignKey
ALTER TABLE "Journals" DROP CONSTRAINT "Journals_store_id_fkey";

-- DropForeignKey
ALTER TABLE "Stores" DROP CONSTRAINT "Stores_company_id_fkey";

-- DropForeignKey
ALTER TABLE "Users" DROP CONSTRAINT "Users_store_id_fkey";

-- AlterTable
ALTER TABLE "Accounts" DROP COLUMN "store_id",
ADD COLUMN     "store_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Journals" DROP COLUMN "store_id",
ADD COLUMN     "store_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Stores" DROP CONSTRAINT "Stores_pkey",
ADD COLUMN     "deleted_at" TIMESTAMP(3),
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "company_id" SET NOT NULL,
ADD CONSTRAINT "Stores_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "Users";

-- AddForeignKey
ALTER TABLE "Stores" ADD CONSTRAINT "Stores_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Accounts" ADD CONSTRAINT "Accounts_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journals" ADD CONSTRAINT "Journals_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

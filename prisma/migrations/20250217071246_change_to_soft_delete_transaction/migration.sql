/*
  Warnings:

  - You are about to drop the column `deleted_by` on the `Trans` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Trans_store_id_trans_type_id_idx";

-- DropIndex
DROP INDEX "Trans_Details_trans_id_idx";

-- AlterTable
ALTER TABLE "Trans" DROP COLUMN "deleted_by";

-- AlterTable
ALTER TABLE "Trans_Details" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Trans_store_id_trans_type_id_deleted_at_idx" ON "Trans"("store_id", "trans_type_id", "deleted_at");

-- CreateIndex
CREATE INDEX "Trans_Details_trans_id_deleted_at_idx" ON "Trans_Details"("trans_id", "deleted_at");

/*
  Warnings:

  - Added the required column `created_by` to the `Payable_Receivables` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Payable_Receivables" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "created_by" UUID NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3),
ADD COLUMN     "updated_by" UUID;

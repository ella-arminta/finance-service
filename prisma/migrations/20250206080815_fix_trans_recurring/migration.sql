/*
  Warnings:

  - You are about to drop the column `trans_period` on the `Trans_Recurring` table. All the data in the column will be lost.
  - Added the required column `recurring_period` to the `Trans_Recurring` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Trans_Recurring" DROP COLUMN "trans_period",
ADD COLUMN     "recurring_period" TEXT NOT NULL;

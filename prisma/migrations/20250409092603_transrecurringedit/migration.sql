/*
  Warnings:

  - You are about to drop the column `trans_last_date` on the `Trans_Recurring` table. All the data in the column will be lost.
  - You are about to drop the column `trans_start_date` on the `Trans_Recurring` table. All the data in the column will be lost.
  - The `monthOfYear` column on the `Trans_Recurring` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `startDate` to the `Trans_Recurring` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Trans_Recurring" DROP COLUMN "trans_last_date",
DROP COLUMN "trans_start_date",
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL,
DROP COLUMN "monthOfYear",
ADD COLUMN     "monthOfYear" INTEGER[];

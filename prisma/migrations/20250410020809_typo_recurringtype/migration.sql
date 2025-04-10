/*
  Warnings:

  - You are about to drop the column `RecurringType` on the `Trans_Recurring` table. All the data in the column will be lost.
  - Added the required column `recurringType` to the `Trans_Recurring` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Trans_Recurring" DROP COLUMN "RecurringType",
ADD COLUMN     "recurringType" "RecurringType" NOT NULL;

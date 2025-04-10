/*
  Warnings:

  - You are about to drop the column `recurrenceType` on the `Trans_Recurring` table. All the data in the column will be lost.
  - Added the required column `RecurringType` to the `Trans_Recurring` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RecurringType" AS ENUM ('DAY', 'WEEK', 'MONTH', 'YEAR');

-- AlterTable
ALTER TABLE "Trans_Recurring" DROP COLUMN "recurrenceType",
ADD COLUMN     "RecurringType" "RecurringType" NOT NULL;

-- DropEnum
DROP TYPE "RecurrenceType";

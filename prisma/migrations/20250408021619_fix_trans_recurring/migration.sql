/*
  Warnings:

  - You are about to drop the column `recurring_period_code` on the `Trans_Recurring` table. All the data in the column will be lost.
  - You are about to drop the `Recurring_Period` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `interval` to the `Trans_Recurring` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recurrenceType` to the `Trans_Recurring` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RecurrenceType" AS ENUM ('DAY', 'WEEK', 'MONTH', 'YEAR');

-- DropForeignKey
ALTER TABLE "Trans_Recurring" DROP CONSTRAINT "Trans_Recurring_recurring_period_code_fkey";

-- AlterTable
ALTER TABLE "Trans_Recurring" DROP COLUMN "recurring_period_code",
ADD COLUMN     "dayOfMonth" INTEGER,
ADD COLUMN     "dayOfYear" INTEGER,
ADD COLUMN     "daysOfWeek" INTEGER[],
ADD COLUMN     "interval" INTEGER NOT NULL,
ADD COLUMN     "last_recurring_date" TIMESTAMP(3),
ADD COLUMN     "monthOfYear" INTEGER,
ADD COLUMN     "recurrenceType" "RecurrenceType" NOT NULL;

-- DropTable
DROP TABLE "Recurring_Period";

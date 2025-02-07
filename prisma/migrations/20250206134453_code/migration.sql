/*
  Warnings:

  - You are about to drop the column `recurring_period_id` on the `Trans_Recurring` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `Recurring_Period` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `recurring_period_code` to the `Trans_Recurring` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Trans_Recurring" DROP CONSTRAINT "Trans_Recurring_recurring_period_id_fkey";

-- AlterTable
ALTER TABLE "Trans_Recurring" DROP COLUMN "recurring_period_id",
ADD COLUMN     "recurring_period_code" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Recurring_Period_code_key" ON "Recurring_Period"("code");

-- AddForeignKey
ALTER TABLE "Trans_Recurring" ADD CONSTRAINT "Trans_Recurring_recurring_period_code_fkey" FOREIGN KEY ("recurring_period_code") REFERENCES "Recurring_Period"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

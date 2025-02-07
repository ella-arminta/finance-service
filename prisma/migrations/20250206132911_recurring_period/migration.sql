/*
  Warnings:

  - You are about to drop the column `recurring_period` on the `Trans_Recurring` table. All the data in the column will be lost.
  - Added the required column `recurring_period_id` to the `Trans_Recurring` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Trans_Recurring" DROP COLUMN "recurring_period",
ADD COLUMN     "recurring_period_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Recurring_Period" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recurring_Period_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Trans_Recurring" ADD CONSTRAINT "Trans_Recurring_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trans_Recurring" ADD CONSTRAINT "Trans_Recurring_recurring_period_id_fkey" FOREIGN KEY ("recurring_period_id") REFERENCES "Recurring_Period"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

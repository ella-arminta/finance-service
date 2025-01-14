/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Account_Types` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `description` to the `Account_Types` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Account_Types" ADD COLUMN     "description" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Account_Types_name_key" ON "Account_Types"("name");

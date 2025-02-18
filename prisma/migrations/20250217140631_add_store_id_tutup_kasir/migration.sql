/*
  Warnings:

  - Added the required column `store_id` to the `TutupKasir` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TutupKasir" ADD COLUMN     "store_id" UUID NOT NULL;

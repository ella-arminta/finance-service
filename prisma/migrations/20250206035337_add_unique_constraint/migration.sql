/*
  Warnings:

  - A unique constraint covering the columns `[code,store_id]` on the table `Trans` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Trans_code_store_id_key" ON "Trans"("code", "store_id");

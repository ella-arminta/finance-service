/*
  Warnings:

  - You are about to drop the column `description` on the `Trans_Type` table. All the data in the column will be lost.
  - Changed the type of `created_by` on the `Trans` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `updated_by` on the `Trans` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `code` to the `Trans_Type` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Trans" DROP COLUMN "created_by",
ADD COLUMN     "created_by" UUID NOT NULL,
DROP COLUMN "updated_by",
ADD COLUMN     "updated_by" UUID NOT NULL;

-- AlterTable
ALTER TABLE "Trans_Type" DROP COLUMN "description",
ADD COLUMN     "code" TEXT NOT NULL;

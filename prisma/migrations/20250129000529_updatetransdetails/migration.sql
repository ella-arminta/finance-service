/*
  Warnings:

  - The primary key for the `Trans_Details` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `id` on the `Trans_Details` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Trans" ALTER COLUMN "total" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Trans_Details" DROP CONSTRAINT "Trans_Details_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE DOUBLE PRECISION,
ADD CONSTRAINT "Trans_Details_pkey" PRIMARY KEY ("id");

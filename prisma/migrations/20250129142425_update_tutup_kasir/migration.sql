/*
  Warnings:

  - You are about to drop the column `account_pusat` on the `TutupKasir` table. All the data in the column will be lost.
  - Added the required column `account_pusat_id` to the `TutupKasir` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `TutupKasir` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TutupKasir" DROP COLUMN "account_pusat",
ADD COLUMN     "account_pusat_id" UUID NOT NULL,
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "saldo_awal" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "penjualan_cash" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "penjualan_transfer" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "total_penjualan" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "pembelian" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "pengeluaran" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "gadai" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "ambil_gadai" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "setor_pusat" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "saldo_akhir" SET DATA TYPE DOUBLE PRECISION;

-- AddForeignKey
ALTER TABLE "TutupKasir" ADD CONSTRAINT "TutupKasir_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutupKasir" ADD CONSTRAINT "TutupKasir_account_pusat_id_fkey" FOREIGN KEY ("account_pusat_id") REFERENCES "Accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

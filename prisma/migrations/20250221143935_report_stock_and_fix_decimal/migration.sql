/*
  Warnings:

  - You are about to alter the column `sellPrice` on the `GoldPrice` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `buyPrice` on the `GoldPrice` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `amount` on the `Report_Journals` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `total` on the `Trans` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `sub_total_price` on the `Trans` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `tax_price` on the `Trans` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `weight_total` on the `Trans` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `amount` on the `Trans_Details` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `amount` on the `Trans_Details_Recurring` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `total` on the `Trans_Recurring` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `saldo_awal` on the `TutupKasir` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `penjualan_cash` on the `TutupKasir` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `penjualan_transfer` on the `TutupKasir` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `total_penjualan` on the `TutupKasir` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `pembelian` on the `TutupKasir` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `pengeluaran` on the `TutupKasir` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `gadai` on the `TutupKasir` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `ambil_gadai` on the `TutupKasir` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `setor_pusat` on the `TutupKasir` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `saldo_akhir` on the `TutupKasir` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.

*/
-- AlterTable
ALTER TABLE "GoldPrice" ALTER COLUMN "sellPrice" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "buyPrice" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Report_Journals" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Trans" ALTER COLUMN "total" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "sub_total_price" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "tax_price" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "weight_total" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Trans_Details" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Trans_Details_Recurring" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Trans_Recurring" ALTER COLUMN "total" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "TutupKasir" ALTER COLUMN "saldo_awal" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "penjualan_cash" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "penjualan_transfer" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "total_penjualan" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "pembelian" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "pengeluaran" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "gadai" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "ambil_gadai" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "setor_pusat" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "saldo_akhir" SET DATA TYPE DECIMAL(65,30);

-- CreateTable
CREATE TABLE "Stock_Source" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "Stock_Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report_Stocks" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "company_code" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "store_id" UUID NOT NULL,
    "store_code" TEXT NOT NULL,
    "store_name" TEXT NOT NULL,
    "source_id" INTEGER NOT NULL,
    "source_name" TEXT NOT NULL,
    "trans_id" UUID NOT NULL,
    "trans_code" TEXT NOT NULL,
    "trans_date" TIMESTAMP(3) NOT NULL,
    "category_id" UUID NOT NULL,
    "category_code" TEXT NOT NULL,
    "category_name" TEXT NOT NULL,
    "type_id" UUID NOT NULL,
    "type_code" TEXT NOT NULL,
    "type_name" TEXT NOT NULL,
    "product_id" UUID NOT NULL,
    "product_name" TEXT NOT NULL,
    "product_code_code" TEXT NOT NULL,
    "product_code_id" UUID NOT NULL,
    "weight" DECIMAL NOT NULL,
    "price" DECIMAL NOT NULL,

    CONSTRAINT "Report_Stocks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Report_Stocks" ADD CONSTRAINT "Report_Stocks_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "Stock_Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report_Stocks" ADD CONSTRAINT "Report_Stocks_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

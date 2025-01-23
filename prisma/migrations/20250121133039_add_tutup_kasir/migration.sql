-- CreateTable
CREATE TABLE "TutupKasir" (
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID NOT NULL,
    "saldo_awal" INTEGER NOT NULL,
    "penjualan_cash" INTEGER NOT NULL,
    "penjualan_transfer" INTEGER NOT NULL,
    "total_penjualan" INTEGER NOT NULL,
    "pembelian" INTEGER NOT NULL,
    "pengeluaran" INTEGER NOT NULL,
    "gadai" INTEGER NOT NULL,
    "ambil_gadai" INTEGER NOT NULL,
    "setor_pusat" INTEGER NOT NULL,
    "account_pusat" UUID NOT NULL,
    "saldo_akhir" INTEGER NOT NULL,
    "tanggal_buka" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TutupKasir_pkey" PRIMARY KEY ("id")
);

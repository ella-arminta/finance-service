import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const data = [
    {
      id: 1,
      action: 'goldSales',
      name: 'Pendapatan Penjualan Emas (Kredit)',
      description: 'Akun pendapatan yang digunakan toko ketika terjadi pada transaksi PENJUALAN EMAS/SALES',
    },
    {
      id: 2,
      action: 'discountSales',
      name: 'Diskon Penjualan (Debit)',
      description: 'Akun diskon yang digunakan toko ketika terjadi diskon penjualan emas pada transaksi PENJUALAN EMAS/SALES',
    },
    {
      id: 3,
      action: 'piutang',
      name: 'Piutang',
      description: 'Akun yang digunakan toko ketika terjadi piutang',
    },
    {
      id: 4,
      action: 'tax',
      name: 'Hutang Pajak Pembelian / Penjualan',
      description: 'Akun pajak yang digunakan toko ketika pada transaksi PEMBELIAN, TUKAR TAMBAH atau PENJUALAN EMAS (Kredit)',
    },
    {
      id: 5,
      action: 'pm1',
      name: 'Uang masuk dari penjualan metode Cash (Debit)',
      description: 'Akun yang digunakan untuk uang yang masuk pada transaksi PENJUALAN metode pembayaran CASH',
    },
    {
      id: 6,
      action: 'pm2',
      name: 'Uang masuk dari penjualan metode Bank Transfer (Debit)',
      description: 'Akun yang digunakan untuk uang yang masuk pada transaksi PENJUALAN metode pembayaran Bank Transfer',
    },
    {
      id: 7,
      action: 'pm3',
      name: 'Uang masuk dari penjualan metode Credit Card (Debit)',
      description: 'Akun yang digunakan untuk uang yang masuk pada transaksi PENJUALAN metode pembayaran Credit Card',
    },
    {
      id: 8,
      action: 'pm4',
      name: 'Uang masuk dari penjualan metode Debit Card (Debit)',
      description: 'Akun yang digunakan untuk uang yang masuk pada transaksi PENJUALAN metode pembayaran Debit Card',
    },
    {
      id: 9,
      action: 'persediaan',
      name: 'Persediaan',
      description: 'Akun yang digunakan toko untuk persediaan pada transaksi yang berhubungan dengan keluar masuk persediaan',
    }, 
    {
      id: 10,
      action: 'repair',
      name: 'Persediaan dalam reparasi',
      description: 'Akun persediaan toko ketika barang dalam kondisi reparasi',
    },
    {
      id: 11,
      action: 'repairCost',
      name: 'Biaya reparasi',
      description: 'Akun yang digunakan toko ketika terdapat biaya reparasi',
    },
    {
      id: 12,
      action: 'lost',
      name: 'Barang Keluar Hilang',
      description: 'Akun yang digunakan toko ketika terjadi barang keluar kondisi hilang',
    },
    {
      id: 13,
      action: 'other',
      name: 'Barang Keluar lainnya',
      description: 'Akun yang digunakan toko ketika terjadi barang keluar kondisi lainnya',
    },
    {
      id: 14,
      action: 'repairDeprec',
      name: 'Penyusutan emas setelah diperbaiki',
      description: 'Akun yang digunakan toko ketika terjadi penyusutan berat emas akibat diperbaiki',
    },
    {
      id: 15,
      action: 'cogs',
      name: 'HPP Toko',
      description: 'Akun yang digunakan toko untuk Harga Pokok Penjualan pada transaksi yang berhubungan dengan keluar masuk persediaan'
    },
    {
      id: 16,
      action: 'stockAdj',
      name: 'Penyesuaian Stok Reparasi',
      description: 'Akun yang digunakan toko ketika berat stok emas setelah reparasi bertambah',
    },
    {
      id: 17,
      action: 'purchaseCust',
      name: 'Purchase from Customer',
      description: 'Akun kas/bank yang digunakan toko ketika membeli emas dari customer',
    },
    {
      id: 18,
      action: 'pm5',
      name: 'Penjualan dibayar Midtrans',
      description: 'Akun yang digunakan toko ketika terjadi penjualan dibayar Midtrans',
    },
    {
      id: 19,
      action:'pendapatanDimuka',
      name: 'Pendapatan Diterima Dimuka (Kredit)',
      description: 'Akun yang digunakan toko ketika terjadi pendapatan diterima dimuka pada transaksi PENJUALAN EMAS',
    },
    {
      id: 20, 
      action: 'piutangPembelian',
      name: 'Piutang Pembelian Emas dari Customer (Debit)',
      description: 'Akun piutang yang digunakan toko ketika telah membayar namun belum mendapatkan emasnya dari customer pada transaksi PURCHASE EMAS dan TRADE EMAS'
    }
  ];  

  for (const item of data) {
    await prisma.action_Account_Settings.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        description: item.description,
      },
      create: item,
    });
  }

  console.log('Seed data upserted');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
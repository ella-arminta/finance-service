import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create multiple account types
  // misal diskon penjualan. dia itu di laba rugi masuk ke revenue, tapi dia terhitung sebagai beban. PERTANYAAN
  // kalo di jurnal tinggal setting transaksi itu masuk jurnal mana ya. 
  const action_account = await prisma.action_Account_Settings.createMany({
    data: [
      {
        id: 1,
        action: 'goldSales',
        name: 'Penjualan Emas',
        description: 'Akun yang digunakan toko ketika terjadi penjualan emas',
      },
      {
        id: 2,
        action: 'discountSales',
        name: 'Diskon Penjualan',
        description: 'Akun yang digunakan toko ketika terjadi diskon penjualan emas',
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
        name: 'Pajak Pembelian / Penjualan',
        description: 'Akun yang digunakan toko ketika terjadi pajak pembelian atau penjualan',
      },
      {
        id: 5,
        action: 'pm1',
        name: 'Penjualan dibayar Cash',
        description: 'Akun yang digunakan toko ketika terjadi penjualan dibayar cash',
      },
      {
        id: 6,
        action: 'pm2',
        name: 'Penjualan dibayar Bank Transfer',
        description: 'Akun yang digunakan toko ketika terjadi penjualan dibayar Bank Transfer',
      },
      {
        id: 7,
        action: 'pm3',
        name: 'Penjualan dibayar Credit Card',
        description: 'Akun yang digunakan toko ketika terjadi penjualan dibayar Credit Card',
      },
      {
        id: 8,
        action: 'pm4',
        name: 'Penjualan dibayar Debit Card',
        description: 'Akun yang digunakan toko ketika terjadi penjualan dibayar Debit Card',
      },
      {
        id: 9,
        action: 'persediaan',
        name: 'Persediaan',
        description: 'Akun yang digunakan toko untuk persediaan',
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
        description: 'Akun yang digunakan toko untuk Harga Pokok Penjualan saat terjadi transaksi penjualan'
      },
      {
        id: 16,
        action: 'stockAdj',
        name: 'Penyesuaian Stok Reparasi',
        description: 'Akun yang digunakan toko ketika berat stok emas setelah reparasi bertambah',
      }
    ],
    skipDuplicates: true,
  });

  console.log('Seed data created:', { action_account });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

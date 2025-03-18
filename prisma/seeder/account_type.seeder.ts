import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create multiple account types
  // misal diskon penjualan. dia itu di laba rugi masuk ke revenue, tapi dia terhitung sebagai beban. PERTANYAAN
  // kalo di jurnal tinggal setting transaksi itu masuk jurnal mana ya. 
  const account_types = await prisma.account_Types.createMany({
    data: [
      { name: 'Asset', description: "Asset : Kas, Bank, Giro,Asset, dll", code:1 ,created_at: new Date(), updated_at: new Date() },
      { name: 'Expense',  code:5, description: "Beban: Biaya operasional, biaya gaji pegawai, biaya lain-lain", created_at: new Date(), updated_at: new Date() },
      { name: 'Payable', code:2, description: "Hutang", created_at: new Date(), updated_at: new Date() },
      { name: 'Receivable', code:1 ,description:"Piutang" ,created_at: new Date(), updated_at: new Date() },
      { name: 'Revenue', code:4, description: "Pendapatan: Penjualan, Diskon penjualan, Pendapatan lain-lain, Retur penjualan, dll", created_at: new Date(), updated_at: new Date() },
      { name: 'Equity', code:3,description: "Ekuitas: Prive, Modal Pemilik, dll", created_at: new Date(), updated_at: new Date() },
      { name: 'Non-Operating Revenue', code:7, description: "Pendapatan non-operasional: Bunga deposito, Bunga tabungan, dll", created_at: new Date(), updated_at: new Date() },
      { name: 'Non-Operating Expense', code:8, description: "Beban non-operasional: Bunga pinjaman, dll", created_at: new Date(), updated_at: new Date() },
    ],
    skipDuplicates: true,
  });

  console.log('Seed data created:', { account_types });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

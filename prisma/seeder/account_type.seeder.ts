import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create multiple account types
  const account_types = await prisma.account_Types.createMany({
    data: [
      { name: 'Kas', description: "Kas : Kas, Bank, Giro,Asset, dll", code:1 ,created_at: new Date(), updated_at: new Date() },
      { name: 'Beban',  code:5, description: "Beban: Biaya operasional, biaya gaji pegawai, biaya lain-lain", created_at: new Date(), updated_at: new Date() },
      { name: 'Hutang', code:2, description: "Hutang", created_at: new Date(), updated_at: new Date() },
      { name: 'Piutang', code:1 ,description:"Piutang" ,created_at: new Date(), updated_at: new Date() },
      { name: 'Pendapatan', code:4, description: "Pendapatan: Penjualan, Diskon penjualan, Pendapatan lain-lain, Retur penjualan, dll", created_at: new Date(), updated_at: new Date() },
      { name: 'Ekuitas', code:3,description: "Ekuitas: Prive, Modal Pemilik, dll", created_at: new Date(), updated_at: new Date() },
      { name: 'Pendapatan non-operasional', code:7, description: "Pendapatan non-operasional: Bunga deposito, Bunga tabungan, dll", created_at: new Date(), updated_at: new Date() },
      { name: 'Beban non-operasional', code:8, description: "Beban non-operasional: Bunga pinjaman, dll", created_at: new Date(), updated_at: new Date() },
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

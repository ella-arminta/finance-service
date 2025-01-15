import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create multiple account types
  const account_types = await prisma.account_Types.createMany({
    data: [
      { name: 'Kas', description: "Kas : Kas, Bank, Giro,Asset, dll" ,created_at: new Date(), updated_at: new Date() },
      { name: 'Beban', description: "Beban: Biaya operasional, biaya gaji pegawai, biaya lain-lain", created_at: new Date(), updated_at: new Date() },
      { name: 'Hutang', description: "Hutang", created_at: new Date(), updated_at: new Date() },
      { name: 'Piutang', description:"Piutang" ,created_at: new Date(), updated_at: new Date() },
      { name: 'Pendapatan', description: "Pendapatan: Penjualan, Diskon penjualan, Pendapatan lain-lain, Retur penjualan, dll", created_at: new Date(), updated_at: new Date() },
      { name: 'Ekuitas', description: "Ekuitas: Prive, Modal Pemilik, dll", created_at: new Date(), updated_at: new Date() },
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

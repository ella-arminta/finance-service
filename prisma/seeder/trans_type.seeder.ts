import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create multiple account types
  const trans_types = await prisma.trans_Type.createMany({
    data: [
      { name: 'Uang keluar lain', code: "UKL", created_at: new Date(), updated_at: new Date(), id: 1 },
      { name: 'Uang masuk lain', code: "UML", created_at: new Date(), updated_at: new Date(), id: 2 },
      { name: 'Sales', code: "SAL", created_at: new Date(), updated_at: new Date(), id: 3 },
      { name: 'Purchase from Customer', code: "PUR", created_at: new Date(), updated_at: new Date(), id: 4 }, // purchase customer
      { name: 'Barang masuk dasaran', code: "MD", created_at: new Date(), updated_at: new Date(), id: 5 },
      { name: 'Barang keluar dasaran', code: "KD", created_at: new Date(), updated_at: new Date(), id: 6 },
      { name: 'Tukar tambah', code: "TT", created_at: new Date(), updated_at: new Date(), id: 7 },
      { name: 'Purchase from Supplier', code: "PURSUP", created_at: new Date(), updated_at: new Date(), id: 8 }, // purchase supplier
      { name: 'Bayar hutang/piutang', code: "BHP", created_at: new Date(), updated_at: new Date(), id: 9 },
    ],
    skipDuplicates: true,
  });

  console.log('Seed data created:', { trans_types });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

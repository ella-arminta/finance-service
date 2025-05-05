import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const data = [
    { name: 'Uang keluar lain', code: "UKL", created_at: new Date(), updated_at: new Date(), id: 1 },
    { name: 'Uang masuk lain', code: "UML", created_at: new Date(), updated_at: new Date(), id: 2 },
    { name: 'Sales', code: "SAL", created_at: new Date(), updated_at: new Date(), id: 3 },
    { name: 'Purchase from Customer', code: "PUR", created_at: new Date(), updated_at: new Date(), id: 4 }, // purchase customer
    { name: 'Barang masuk dasaran', code: "MD", created_at: new Date(), updated_at: new Date(), id: 5 },
    { name: 'Barang keluar dasaran', code: "KD", created_at: new Date(), updated_at: new Date(), id: 6 },
    { name: 'Tukar tambah', code: "TT", created_at: new Date(), updated_at: new Date(), id: 7 },
    { name: 'Purchase from Supplier', code: "PURSUP", created_at: new Date(), updated_at: new Date(), id: 8 }, // purchase supplier
    { name: 'Bayar hutang/piutang', code: "BHP", created_at: new Date(), updated_at: new Date(), id: 9 },
  ];

  for (const item of data) {
    await prisma.trans_Type.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        code: item.code,
        updated_at: new Date(),
      },
      create: {
        ...item,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  console.log('Seeded trans_types successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
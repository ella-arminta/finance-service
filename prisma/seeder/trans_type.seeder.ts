import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create multiple account types
  const trans_types = await prisma.trans_Type.createMany({
    data: [
      { name: 'Uang keluar lain', code: "UKL", created_at: new Date(), updated_at: new Date() },
      { name: 'Uang masuk lain', code: "UML", created_at: new Date(), updated_at: new Date() },
      { name: 'Jual', code: "J", created_at: new Date(), updated_at: new Date() },
      { name: 'Beli', code: "B", created_at: new Date(), updated_at: new Date() },
      { name: 'Barang masuk dasaran', code: "MD", created_at: new Date(), updated_at: new Date() },
      { name: 'Barang keluar dasaran', code: "KD", created_at: new Date(), updated_at: new Date() },
      { name: 'Tukar tambah', code: "TT", created_at: new Date(), updated_at: new Date() },
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

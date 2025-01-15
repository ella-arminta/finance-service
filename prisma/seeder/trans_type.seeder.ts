import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create multiple account types
  const trans_types = await prisma.trans_Type.createMany({
    data: [
      { name: 'Uang keluar lain', code: "KELUAR_LAIN", created_at: new Date(), updated_at: new Date() },
      { name: 'Uang masuk lain', code: "MASUK_LAIN", created_at: new Date(), updated_at: new Date() },
      { name: 'Jual', code: "JUAL", created_at: new Date(), updated_at: new Date() },
      { name: 'Beli', code: "BELI", created_at: new Date(), updated_at: new Date() },
      { name: 'Barang masuk dasaran', code: "MASUK_DASARAN", created_at: new Date(), updated_at: new Date() },
      { name: 'Barang keluar dasaran', code: "KELUAR_DASARAN", created_at: new Date(), updated_at: new Date() },
      { name: 'Tukar tambah', code: "TUKAR_TAMBAH", created_at: new Date(), updated_at: new Date() },
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

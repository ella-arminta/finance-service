import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create multiple account types
  // misal diskon penjualan. dia itu di laba rugi masuk ke revenue, tapi dia terhitung sebagai beban. PERTANYAAN
  // kalo di jurnal tinggal setting transaksi itu masuk jurnal mana ya. 
  const stock_sources = await prisma.stock_Source.createMany({
    data: [
      {
        id: 1,
        name: 'In Stock',
        code: 'INSTOCK',
      },
      {
        id: 2,
        name: 'Out Stock',
        code: 'OUTSTOCK',
      },
      {
        id: 3,
        name: 'Sales',
        code: 'SALES',
      },
      {
        id: 4,
        name: 'Trade',
        code: 'TRADE',
      },
      {
        id: 5,
        name: 'Purchase from Customer',
        code: 'PURCHASE',
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seed data created:', { stock_sources });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

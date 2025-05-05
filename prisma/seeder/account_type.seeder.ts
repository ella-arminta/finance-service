import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const accountTypes = [
    { name: 'Asset', description: "Asset : Kas, Bank, Giro,Asset, dll", code:1 ,created_at: new Date(), updated_at: new Date() },
    { name: 'Expense',  code:5, description: "Beban: Biaya operasional,Hpp,  biaya gaji pegawai, biaya lain-lain", created_at: new Date(), updated_at: new Date() },
    { name: 'Payable', code:2, description: "Hutang", created_at: new Date(), updated_at: new Date() },
    { name: 'Receivable', code:1 ,description:"Piutang" ,created_at: new Date(), updated_at: new Date() },
    { name: 'Revenue', code:4, description: "Pendapatan: Penjualan, Diskon penjualan, Pendapatan lain-lain, Retur penjualan, dll", created_at: new Date(), updated_at: new Date() },
    { name: 'Equity', code:3,description: "Ekuitas: Prive, Modal Pemilik, dll", created_at: new Date(), updated_at: new Date() },
    { name: 'Non-Operating Revenue', code:7, description: "Pendapatan non-operasional: Bunga deposito, Bunga tabungan, dll", created_at: new Date(), updated_at: new Date() },
    { name: 'Non-Operating Expense', code:8, description: "Beban non-operasional: Bunga pinjaman, dll", created_at: new Date(), updated_at: new Date() },
  ];


  for (const item of accountTypes) {
    await prisma.account_Types.upsert({
      where: { name: item.name }, // assuming 'name' is unique
      update: {
        code: item.code,
        description: item.description,
        updated_at: new Date(),
      },
      create: {
        ...item,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  console.log('Seeded account_Types successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

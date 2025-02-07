import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create multiple account types
  const recurringPeriod = await prisma.recurring_Period.createMany({
    data: [
        { name: 'Every Day', code: 'day' },
        { name: 'Every Week', code: 'week' },
        { name: 'Every 2 weeks', code: '2week' },
        { name: 'Every Month', code: 'month' },
        { name: 'Every 2 Month', code: '2month' },
        { name: 'Every 3 Month', code: '3month' },
        { name: 'Every 4 Month', code: '4month' },
        { name: 'Every 6 Month', code: '6month' },
        { name: 'Every Year', code: 'year' },
    ],
    skipDuplicates: true,
  });

  console.log('Seed data created:', { recurringPeriod });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding default category groups and categories...');

  // Clear any existing default entries
  await prisma.category.deleteMany({ where: { userId: null } });
  await prisma.categoryGroup.deleteMany({ where: { userId: null } });

  // Create groups
  const essentialGroup = await prisma.categoryGroup.create({
    data: {
      name: 'Essential',
      userId: null,
    },
  });

  const nonEssentialGroup = await prisma.categoryGroup.create({
    data: {
      name: 'Non-Essential',
      userId: null,
    },
  });

  // Categories under Essential
  await prisma.category.createMany({
    data: [
      { name: 'Rent', groupId: essentialGroup.id, userId: null, color: 'red' },
      { name: 'Groceries', groupId: essentialGroup.id, userId: null, color: 'green' },
      { name: 'Transportation', groupId: essentialGroup.id, userId: null, color: 'blue' },
      { name: 'Utilities', groupId: essentialGroup.id, userId: null, color: 'orange' },
      { name: 'Healthcare', groupId: essentialGroup.id, userId: null, color: 'purple' },
    ],
  });

  // Categories under Non-Essential
  await prisma.category.createMany({
    data: [
      { name: 'Leisure', groupId: nonEssentialGroup.id, userId: null, color: 'teal' },
      { name: 'Shopping', groupId: nonEssentialGroup.id, userId: null, color: 'lime' },
      { name: 'Dining Out', groupId: nonEssentialGroup.id, userId: null, color: 'yellow' },
      { name: 'Entertainment', groupId: nonEssentialGroup.id, userId: null, color: 'pink' },
      { name: 'Subscriptions', groupId: nonEssentialGroup.id, userId: null, color: 'gray' },
      { name: 'Personal', groupId: nonEssentialGroup.id, userId: null, color: 'cyan' },
    ],
  });

  console.log('✅ Done seeding defaults!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
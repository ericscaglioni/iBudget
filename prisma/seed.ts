import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Resetting DB...');
  await prisma.$executeRaw`TRUNCATE TABLE "accounts" CASCADE;`;
  await prisma.$executeRaw`TRUNCATE TABLE "transactions" CASCADE;`;
  console.log('✅ Done resetting DB!');

  console.log('🌱 Seeding default category groups and categories...');

  await prisma.category.deleteMany();
  await prisma.categoryGroup.deleteMany();

  const essentialGroup = await prisma.categoryGroup.create({
    data: { name: 'Essential', userId: null },
  });

  const nonEssentialGroup = await prisma.categoryGroup.create({
    data: { name: 'Non-Essential', userId: null },
  });

  await prisma.category.createMany({
    data: [
      { name: 'Rent', groupId: essentialGroup.id, userId: null, color: '#EF4444' },
      { name: 'Groceries', groupId: essentialGroup.id, userId: null, color: '#10B981' },
      { name: 'Transportation', groupId: essentialGroup.id, userId: null, color: '#3B82F6' },
      { name: 'Utilities', groupId: essentialGroup.id, userId: null, color: '#F97316' },
      { name: 'Healthcare', groupId: essentialGroup.id, userId: null, color: '#8B5CF6' },
    ],
  });

  await prisma.category.createMany({
    data: [
      { name: 'Leisure', groupId: nonEssentialGroup.id, userId: null, color: '#14B8A6' },
      { name: 'Shopping', groupId: nonEssentialGroup.id, userId: null, color: '#84CC16' },
      { name: 'Dining Out', groupId: nonEssentialGroup.id, userId: null, color: '#FACC15' },
      { name: 'Entertainment', groupId: nonEssentialGroup.id, userId: null, color: '#EC4899' },
      { name: 'Subscriptions', groupId: nonEssentialGroup.id, userId: null, color: '#6B7280' },
      { name: 'Personal', groupId: nonEssentialGroup.id, userId: null, color: '#06B6D4' },
      { name: 'Travel', groupId: nonEssentialGroup.id, userId: null, color: '#A78BFA' },
    ],
  });

  const incomeGroup = await prisma.categoryGroup.create({
    data: { name: 'Income', userId: null },
  });

  await prisma.category.createMany({
    data: [
      { name: 'Salary', groupId: incomeGroup.id, userId: null, color: '#22C55E', type: 'income' },
      { name: 'Freelance', groupId: incomeGroup.id, userId: null, color: '#0EA5E9', type: 'income' },
      { name: 'Investments', groupId: incomeGroup.id, userId: null, color: '#EAB308', type: 'income' },
      { name: 'Gifts', groupId: incomeGroup.id, userId: null, color: '#F472B6', type: 'income' },
    ],
  });

  const systemGroup = await prisma.categoryGroup.create({
    data: {
      name: "System",
      userId: null,
      isSystem: true,
    },
  });

  // 🚀 Add Transfer System Category
  await prisma.category.create({
    data: {
      name: 'Transfer',
      color: '#6366F1', // Indigo
      groupId: systemGroup.id,
      userId: null,
      isSystem: true,
      type: 'expense',
    },
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
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Resetting DB...');
  
  // MySQL doesn't support CASCADE with TRUNCATE, so we'll use DELETE instead
  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0;`;
  await prisma.$executeRaw`DELETE FROM transactions;`;
  await prisma.$executeRaw`DELETE FROM accounts;`;
  await prisma.$executeRaw`DELETE FROM categories;`;
  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1;`;
  
  console.log('✅ Done resetting DB!');

  console.log('🌱 Seeding default categories...');

  // Seed expense categories
  await prisma.category.createMany({
    data: [
      // Essential expenses
      { name: 'Rent', userId: null, color: '#EF4444', type: 'expense' },
      { name: 'Groceries', userId: null, color: '#10B981', type: 'expense' },
      { name: 'Transportation', userId: null, color: '#3B82F6', type: 'expense' },
      { name: 'Utilities', userId: null, color: '#F97316', type: 'expense' },
      { name: 'Healthcare', userId: null, color: '#8B5CF6', type: 'expense' },
      // Non-essential expenses
      { name: 'Leisure', userId: null, color: '#14B8A6', type: 'expense' },
      { name: 'Shopping', userId: null, color: '#84CC16', type: 'expense' },
      { name: 'Dining Out', userId: null, color: '#FACC15', type: 'expense' },
      { name: 'Entertainment', userId: null, color: '#EC4899', type: 'expense' },
      { name: 'Subscriptions', userId: null, color: '#6B7280', type: 'expense' },
      { name: 'Personal', userId: null, color: '#06B6D4', type: 'expense' },
      { name: 'Travel', userId: null, color: '#A78BFA', type: 'expense' },
    ],
  });

  // Seed income categories
  await prisma.category.createMany({
    data: [
      { name: 'Salary', userId: null, color: '#22C55E', type: 'income' },
      { name: 'Freelance', userId: null, color: '#0EA5E9', type: 'income' },
      { name: 'Investments', userId: null, color: '#EAB308', type: 'income' },
      { name: 'Gifts', userId: null, color: '#F472B6', type: 'income' },
    ],
  });

  // 🚀 Add Transfer System Category
  await prisma.category.create({
    data: {
      name: 'Transfer',
      color: '#6366F1', // Indigo
      userId: null,
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
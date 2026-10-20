-- Seed the system (default) categories, userId = NULL.
-- The app relies on these: "Transfer" is required by the dashboard and by transfers,
-- and the rest are cloned to each new user by initializeUserDefaults.
-- Idempotent: a category is only inserted if a system category with that name doesn't exist yet,
-- so it is safe on databases that were already seeded with `prisma db seed`.

-- Expense categories
INSERT INTO `categories` (`id`, `userId`, `name`, `color`, `type`, `createdAt`, `updatedAt`)
SELECT UUID(), NULL, 'Rent', '#EF4444', 'expense', NOW(3), NOW(3) FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `categories` WHERE `userId` IS NULL AND `name` = 'Rent');

INSERT INTO `categories` (`id`, `userId`, `name`, `color`, `type`, `createdAt`, `updatedAt`)
SELECT UUID(), NULL, 'Groceries', '#10B981', 'expense', NOW(3), NOW(3) FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `categories` WHERE `userId` IS NULL AND `name` = 'Groceries');

INSERT INTO `categories` (`id`, `userId`, `name`, `color`, `type`, `createdAt`, `updatedAt`)
SELECT UUID(), NULL, 'Transportation', '#3B82F6', 'expense', NOW(3), NOW(3) FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `categories` WHERE `userId` IS NULL AND `name` = 'Transportation');

INSERT INTO `categories` (`id`, `userId`, `name`, `color`, `type`, `createdAt`, `updatedAt`)
SELECT UUID(), NULL, 'Utilities', '#F97316', 'expense', NOW(3), NOW(3) FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `categories` WHERE `userId` IS NULL AND `name` = 'Utilities');

INSERT INTO `categories` (`id`, `userId`, `name`, `color`, `type`, `createdAt`, `updatedAt`)
SELECT UUID(), NULL, 'Healthcare', '#8B5CF6', 'expense', NOW(3), NOW(3) FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `categories` WHERE `userId` IS NULL AND `name` = 'Healthcare');

INSERT INTO `categories` (`id`, `userId`, `name`, `color`, `type`, `createdAt`, `updatedAt`)
SELECT UUID(), NULL, 'Leisure', '#14B8A6', 'expense', NOW(3), NOW(3) FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `categories` WHERE `userId` IS NULL AND `name` = 'Leisure');

INSERT INTO `categories` (`id`, `userId`, `name`, `color`, `type`, `createdAt`, `updatedAt`)
SELECT UUID(), NULL, 'Shopping', '#84CC16', 'expense', NOW(3), NOW(3) FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `categories` WHERE `userId` IS NULL AND `name` = 'Shopping');

INSERT INTO `categories` (`id`, `userId`, `name`, `color`, `type`, `createdAt`, `updatedAt`)
SELECT UUID(), NULL, 'Dining Out', '#FACC15', 'expense', NOW(3), NOW(3) FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `categories` WHERE `userId` IS NULL AND `name` = 'Dining Out');

INSERT INTO `categories` (`id`, `userId`, `name`, `color`, `type`, `createdAt`, `updatedAt`)
SELECT UUID(), NULL, 'Entertainment', '#EC4899', 'expense', NOW(3), NOW(3) FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `categories` WHERE `userId` IS NULL AND `name` = 'Entertainment');

INSERT INTO `categories` (`id`, `userId`, `name`, `color`, `type`, `createdAt`, `updatedAt`)
SELECT UUID(), NULL, 'Subscriptions', '#6B7280', 'expense', NOW(3), NOW(3) FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `categories` WHERE `userId` IS NULL AND `name` = 'Subscriptions');

INSERT INTO `categories` (`id`, `userId`, `name`, `color`, `type`, `createdAt`, `updatedAt`)
SELECT UUID(), NULL, 'Personal', '#06B6D4', 'expense', NOW(3), NOW(3) FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `categories` WHERE `userId` IS NULL AND `name` = 'Personal');

INSERT INTO `categories` (`id`, `userId`, `name`, `color`, `type`, `createdAt`, `updatedAt`)
SELECT UUID(), NULL, 'Travel', '#A78BFA', 'expense', NOW(3), NOW(3) FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `categories` WHERE `userId` IS NULL AND `name` = 'Travel');

-- Income categories
INSERT INTO `categories` (`id`, `userId`, `name`, `color`, `type`, `createdAt`, `updatedAt`)
SELECT UUID(), NULL, 'Salary', '#22C55E', 'income', NOW(3), NOW(3) FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `categories` WHERE `userId` IS NULL AND `name` = 'Salary');

INSERT INTO `categories` (`id`, `userId`, `name`, `color`, `type`, `createdAt`, `updatedAt`)
SELECT UUID(), NULL, 'Freelance', '#0EA5E9', 'income', NOW(3), NOW(3) FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `categories` WHERE `userId` IS NULL AND `name` = 'Freelance');

INSERT INTO `categories` (`id`, `userId`, `name`, `color`, `type`, `createdAt`, `updatedAt`)
SELECT UUID(), NULL, 'Investments', '#EAB308', 'income', NOW(3), NOW(3) FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `categories` WHERE `userId` IS NULL AND `name` = 'Investments');

INSERT INTO `categories` (`id`, `userId`, `name`, `color`, `type`, `createdAt`, `updatedAt`)
SELECT UUID(), NULL, 'Gifts', '#F472B6', 'income', NOW(3), NOW(3) FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `categories` WHERE `userId` IS NULL AND `name` = 'Gifts');

-- Transfer system category (required: used by transfers and excluded from income/expense totals)
INSERT INTO `categories` (`id`, `userId`, `name`, `color`, `type`, `createdAt`, `updatedAt`)
SELECT UUID(), NULL, 'Transfer', '#6366F1', 'expense', NOW(3), NOW(3) FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `categories` WHERE `userId` IS NULL AND `name` = 'Transfer');

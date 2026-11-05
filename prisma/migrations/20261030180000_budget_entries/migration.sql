-- CreateTable
CREATE TABLE `budget_entries` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `yearMonth` VARCHAR(7) NOT NULL,
    `currency` VARCHAR(8) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `expectedAmount` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `budget_entries_userId_yearMonth_currency_idx`(`userId`, `yearMonth`, `currency`),
    UNIQUE INDEX `budget_entries_userId_yearMonth_currency_categoryId_key`(`userId`, `yearMonth`, `currency`, `categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `budget_entries` ADD CONSTRAINT `budget_entries_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budget_entries` ADD CONSTRAINT `budget_entries_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

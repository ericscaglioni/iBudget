-- CreateTable
CREATE TABLE `budget_exchanges` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `yearMonth` VARCHAR(7) NOT NULL,
    `currency` VARCHAR(8) NOT NULL,
    `expectedIn` DECIMAL(10, 2) NOT NULL,
    `expectedOut` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `budget_exchanges_userId_yearMonth_currency_key`(`userId`, `yearMonth`, `currency`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `budget_exchanges` ADD CONSTRAINT `budget_exchanges_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

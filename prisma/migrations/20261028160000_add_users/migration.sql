-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `name` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Backfill one row per Clerk user id already stored on other tables.
-- email and name stay null here; the deploy script fills them from Clerk.
INSERT INTO `users` (`id`, `createdAt`, `updatedAt`)
SELECT `userId`, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM (
    SELECT `userId` FROM `accounts`
    UNION
    SELECT `userId` FROM `transactions`
    UNION
    SELECT `userId` FROM `categories` WHERE `userId` IS NOT NULL
    UNION
    SELECT `userId` FROM `user_settings`
    UNION
    SELECT `userId` FROM `user_guide`
) AS `existing`
WHERE `userId` IS NOT NULL AND `userId` <> '';

-- AddForeignKey
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_settings` ADD CONSTRAINT `user_settings_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_guide` ADD CONSTRAINT `user_guide_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

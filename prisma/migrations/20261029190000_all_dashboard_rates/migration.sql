-- AlterTable
ALTER TABLE `user_settings` ADD COLUMN `openDashboardOn` VARCHAR(8) NOT NULL DEFAULT 'home';

-- CreateTable
CREATE TABLE `exchange_rate_snapshots` (
    `base` VARCHAR(8) NOT NULL,
    `fetchedOn` DATE NOT NULL,
    `asOf` DATE NOT NULL,
    `rates` JSON NOT NULL,
    `fetchedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`base`, `fetchedOn`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

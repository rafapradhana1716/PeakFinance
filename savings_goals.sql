CREATE TABLE `savings_goals` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `user_id` INT(11) NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `target_amount` DECIMAL(15, 0) NOT NULL,
    `current_amount` DECIMAL(15, 0) DEFAULT 0,
    `status` ENUM('active', 'achieved') DEFAULT 'active',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP(),
    PRIMARY KEY (`id`),
    -- Index untuk mempercepat query berdasarkan user
    KEY `user_id` (`user_id`),
    -- Foreign Key ke tabel users
    CONSTRAINT `fk_user_savings` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE `transactions` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `user_id` INT(11) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `type` ENUM('income', 'expense', 'saving') NOT NULL,
    `category` VARCHAR(50) DEFAULT NULL,
    `amount` DECIMAL(15, 0) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `savings_goal_id` INT(11) DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
    
    PRIMARY KEY (`id`),
    -- Index untuk mempercepat pencarian berdasarkan user
    KEY `user_id` (`user_id`),
    -- Index untuk relasi ke tabel savings_goals
    KEY `savings_goal_id` (`savings_goal_id`),
    
    -- Foreign Key agar data konsisten
    CONSTRAINT `fk_user_transaction` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_savings_goal` FOREIGN KEY (`savings_goal_id`) REFERENCES `savings_goals` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
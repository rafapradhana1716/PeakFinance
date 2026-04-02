CREATE TABLE `transactions` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `user_id` INT(11) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `type` ENUM('income', 'expense') NOT NULL,
    `category` VARCHAR(50) DEFAULT NULL,
    `amount` DECIMAL(15, 0) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
    
    -- Primary Key
    PRIMARY KEY (`id`),
    
    -- Indexing for performance
    KEY `user_id` (`user_id`),
    
    -- Foreign Key Constraint (Menjaga agar user_id harus ada di tabel users)
    CONSTRAINT `fk_transactions_user` 
    FOREIGN KEY (`user_id`) 
    REFERENCES `users` (`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
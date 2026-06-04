-- Flyway migration: upgrade orders table for checkout fields (order number, payment, statuses, timestamps)

-- MySQL note: `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` is not supported on MySQL 8.
-- Make this migration idempotent via information_schema checks + dynamic SQL.

SET @schema := DATABASE();

-- order_number
SET @exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'order_number'
);
SET @sql := IF(@exists = 0,
    'ALTER TABLE orders ADD COLUMN order_number VARCHAR(50) NOT NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- payment_method
SET @exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'payment_method'
);
SET @sql := IF(@exists = 0,
    "ALTER TABLE orders ADD COLUMN payment_method VARCHAR(16) NOT NULL DEFAULT 'cash'",
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- payment_status
SET @exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'payment_status'
);
SET @sql := IF(@exists = 0,
    "ALTER TABLE orders ADD COLUMN payment_status VARCHAR(16) NOT NULL DEFAULT 'pending'",
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- order_status
SET @exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'order_status'
);
SET @sql := IF(@exists = 0,
    "ALTER TABLE orders ADD COLUMN order_status VARCHAR(16) NOT NULL DEFAULT 'pending'",
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- created_at
SET @exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'created_at'
);
SET @sql := IF(@exists = 0,
    "ALTER TABLE orders ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- updated_at
SET @exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'updated_at'
);
SET @sql := IF(@exists = 0,
    "ALTER TABLE orders ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Backfill order_status from legacy status (if status exists)
SET @status_exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'status'
);
SET @sql := IF(@status_exists > 0, 'UPDATE orders SET order_status = COALESCE(order_status, status)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Unique index for order_number
SET @idx_exists := (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = 'orders' AND INDEX_NAME = 'ux_orders_order_number'
);
SET @sql := IF(@idx_exists = 0,
    'CREATE UNIQUE INDEX ux_orders_order_number ON orders(order_number)',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Allow hard-delete of users while preserving order history
--
-- Steps:
-- 1) Make orders.user_id nullable
-- 2) Ensure FK to users is ON DELETE SET NULL

-- Notes:
-- Some MySQL installations can throw collation mix errors when comparing information_schema strings
-- against session variables. Avoid that by using DATABASE() directly in the predicate.

-- 1) user_id nullable
SET @sql := 'ALTER TABLE orders MODIFY user_id BIGINT NULL';
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2) Drop FK if it exists, then recreate

-- Find existing FK name that points from orders(user_id) -> users(id)
SET @fk_name := (
  SELECT rc.CONSTRAINT_NAME
  FROM information_schema.REFERENTIAL_CONSTRAINTS rc
  JOIN information_schema.KEY_COLUMN_USAGE kcu
    ON kcu.CONSTRAINT_SCHEMA = rc.CONSTRAINT_SCHEMA
   AND kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
   AND kcu.TABLE_NAME = rc.TABLE_NAME
  WHERE rc.CONSTRAINT_SCHEMA = DATABASE()
    AND rc.TABLE_NAME = 'orders'
    AND rc.REFERENCED_TABLE_NAME = 'users'
    AND kcu.COLUMN_NAME = 'user_id'
  LIMIT 1
);

SET @sql := IF(@fk_name IS NULL, 'SELECT 1', CONCAT('ALTER TABLE orders DROP FOREIGN KEY ', @fk_name));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Recreate FK with a stable name
SET @sql := 'ALTER TABLE orders ADD CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL';
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

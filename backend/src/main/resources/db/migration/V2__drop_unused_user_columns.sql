-- Drop columns no longer used on users table, compatible with older MySQL 8.x (no IF EXISTS in DROP COLUMN)
-- Build an ALTER TABLE statement dynamically for the columns that actually exist.

-- Find which of the target columns currently exist
SELECT GROUP_CONCAT(CONCAT(' DROP COLUMN ', COLUMN_NAME) SEPARATOR ',')
INTO @drops
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME IN ('verification_token', 'password_reset_token', 'password_reset_expiry');

-- Build and run the ALTER TABLE only when needed
SET @sql = IF(@drops IS NULL, 'SELECT 1', CONCAT('ALTER TABLE users', @drops));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add soft-delete columns for users to avoid FK constraint violations when a user has related rows
-- (orders, carts, etc.).

-- MySQL 8.0 does NOT support `ADD COLUMN IF NOT EXISTS`, so we guard with information_schema.

SET @db := DATABASE();

-- is_deleted
SET @stmt := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'is_deleted'
    ),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0'
  )
);
PREPARE s1 FROM @stmt;
EXECUTE s1;
DEALLOCATE PREPARE s1;

-- deleted_at
SET @stmt := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'deleted_at'
    ),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN deleted_at DATETIME NULL'
  )
);
PREPARE s2 FROM @stmt;
EXECUTE s2;
DEALLOCATE PREPARE s2;

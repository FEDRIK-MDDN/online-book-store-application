-- Add profile_image_url column to users table if missing
-- Use dynamic SQL to remain compatible with MySQL variants lacking ADD COLUMN IF NOT EXISTS

-- Check if column exists
SELECT COUNT(*) INTO @exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME = 'profile_image_url';

SET @sql = IF(@exists = 0,
  'ALTER TABLE users ADD COLUMN profile_image_url VARCHAR(512) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

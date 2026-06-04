-- Flyway migration: add availability and status columns to books
ALTER TABLE books
    ADD COLUMN available BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE books
    ADD COLUMN status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE';

-- Backfill: ensure rows with stock = 0 are marked unavailable/out of stock
UPDATE books SET available = FALSE, status = 'OUT_OF_STOCK' WHERE stock = 0;

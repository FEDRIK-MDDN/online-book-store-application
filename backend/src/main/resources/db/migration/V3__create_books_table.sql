-- Flyway migration: create books table
CREATE TABLE IF NOT EXISTS books (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    stock INT NOT NULL,
    description TEXT,
    image_url VARCHAR(1024)
);

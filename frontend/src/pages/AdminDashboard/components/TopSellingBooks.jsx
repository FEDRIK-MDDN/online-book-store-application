import React from 'react';
import './TopSellingBooks.css';

export default function TopSellingBooks({ books }) {
  // Sort books by sales or stock (inverse) and take top 5
  const topBooks = books
    ?.sort((a, b) => (b.sales || 100 - b.stock || 0) - (a.sales || 100 - a.stock || 0))
    .slice(0, 5) || [];

  const formatPrice = (price) => {
    return `$${parseFloat(price || 0).toFixed(2)}`;
  };

  const formatSales = (book) => {
    if (book.sales) return book.sales;
    // Estimate sales from stock (assuming initial stock was higher)
    return Math.floor((100 - (book.stock || 50)) / 10);
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    // If it's already a full URL, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')) {
      return imageUrl;
    }
    // If it's a relative path, construct the full URL
    return `http://localhost:8080${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  };

  return (
    <div className="top-books-card">
      <div className="top-books-header">
        <h3>Top Selling Books</h3>
        <div className="pagination-dots">
          <span className="dot active"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      </div>

      <div className="books-list">
        {topBooks.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📚</span>
            <p>No books available</p>
          </div>
        ) : (
          topBooks.map((book, index) => (
            <div key={book.id || index} className="book-item">
              <div className="book-rank">{index + 1}</div>
              <div className="book-image">
                <img 
                  src={getImageUrl(book.imageUrl) || 'https://via.placeholder.com/50x70?text=Book'} 
                  alt={book.title || 'Book'}
                  onError={(e) => e.target.src = 'https://via.placeholder.com/50x70?text=Book'}
                />
              </div>
              <div className="book-info">
                <h4 className="book-title">{book.title || 'Untitled Book'}</h4>
                <p className="book-author">{book.author || 'Unknown Author'}</p>
                <div className="book-meta">
                  <span className="book-sales">📊 {formatSales(book)} sales</span>
                  <span className="book-price">{formatPrice(book.price)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

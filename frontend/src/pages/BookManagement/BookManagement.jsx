import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../authContext';
import { adminApi } from '../../api';
import './BookManagement.css';

const BookManagement = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    price: '',
    description: '',
    stock: '',
    category: '',
    status: 'ACTIVE',
    available: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const token = user?.token;

  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminApi.getBooks(token);
      console.log('📚 Fetched books from backend:', data);
      if (data.length > 0) {
        console.log('📖 First book example:', {
          id: data[0].id,
          title: data[0].title,
          available: data[0].available,
          status: data[0].status
        });
      }
      setBooks(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load books');
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await adminApi.getCategories(token);
      console.log('🏷️ Fetched categories:', data);
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setCategories([]);
    }
  }, [token]);

  useEffect(() => {
    fetchBooks();
    fetchCategories();
  }, [fetchBooks, fetchCategories]);

  const handleOpenModal = (book = null) => {
    if (book) {
      console.log('📝 Opening edit modal with book:', {
        id: book.id,
        title: book.title,
        available: book.available,
        status: book.status
      });
      setEditingBook(book);
      setFormData({
        title: book.title || '',
        author: book.author || '',
        price: book.price || '',
        description: book.description || '',
        stock: book.stock || '',
        category: book.category || '',
        status: book.status || 'ACTIVE',
        available: Boolean(book.available),
        imageUrl: book.imageUrl || '',
      });
      setImagePreview(book.imageUrl || '');
    } else {
      setEditingBook(null);
      setFormData({
        title: '',
        author: '',
        price: '',
        description: '',
        stock: '',
        category: '',
        status: 'ACTIVE',
        available: true,
        imageUrl: '',
      });
      setImagePreview('');
    }
    setImageFile(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBook(null);
    setFormData({
      title: '',
      author: '',
      price: '',
      description: '',
      stock: '',
      category: '',
      status: 'ACTIVE',
      available: true,
    });
    setImageFile(null);
    setImagePreview('');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const bookData = {
        title: formData.title,
        author: formData.author,
        price: parseFloat(formData.price),
        description: formData.description,
        stock: parseInt(formData.stock),
        category: formData.category,
        status: formData.status, // String: "ACTIVE" or "OUT_OF_STOCK"
        available: formData.available === true, // Ensure it's a boolean
      };

      console.log('📤 SEND:', { available: bookData.available, status: bookData.status });

      let savedBook;
      if (editingBook) {
        savedBook = await adminApi.updateBook(token, editingBook.id, bookData);
      } else {
        savedBook = await adminApi.createBook(token, bookData);
      }
      
      console.log('📥 RECEIVED:', savedBook);
      console.log('📥 Available:', savedBook.available, 'Type:', typeof savedBook.available);
      console.log('📥 Status:', savedBook.status);

      // Upload image if file is selected
      if (imageFile && savedBook.id) {
        try {
          await adminApi.uploadBookImage(token, savedBook.id, imageFile);
        } catch (imgErr) {
          console.error('Image upload failed:', imgErr);
          alert(`Book ${editingBook ? 'updated' : 'created'} but image upload failed: ${imgErr.message}`);
        }
      }

      handleCloseModal();
      
      // Force refresh: clear books first, then fetch fresh data
      setBooks([]);
      await new Promise(resolve => setTimeout(resolve, 100));
      await fetchBooks();
      
      alert(`Book ${editingBook ? 'updated' : 'created'} successfully!`);
    } catch (err) {
      console.error('Submit error:', err);
      alert(err.message || `Failed to ${editingBook ? 'update' : 'create'} book`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (bookId) => {
    if (!window.confirm('Are you sure you want to delete this book?')) {
      return;
    }
    try {
      await adminApi.deleteBook(token, bookId);
      await fetchBooks();
      alert('Book deleted successfully!');
    } catch (err) {
      alert(err.message || 'Failed to delete book');
    }
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || book.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };

  const formatPrice = (price) => {
    if (price == null) return 'N/A';
    return `LKR ${parseFloat(price).toFixed(2)}`;
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    // If it's already a full URL, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')) {
      return imageUrl;
    }
    // If it's a relative path, construct the full URL
    // Try localhost:8080 (Spring Boot backend) first
    return `http://localhost:8080${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  };

  return (
    <div className="book-management">
      <div className="book-management-header">
        <div>
          <h1>Book Management</h1>
          <p className="subtitle">Manage your online bookstore inventory</p>
        </div>
        <button className="btn-add-book" onClick={() => handleOpenModal()}>
          + Add New Book
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="book-management-filters">
        <input
          type="text"
          placeholder="Search books..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="status-filter"
        >
          <option value="all">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading books...</div>
      ) : (
        <div className="book-table-container">
          <table className="book-table">
            <thead>
              <tr>
                <th>Book ID</th>
                <th>Image</th>
                <th>Book Name</th>
                <th>Author</th>
                <th>Price (LKR)</th>
                <th>Stock</th>
                <th>Available</th>
                <th>Status</th>
                <th>Added Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBooks.length === 0 ? (
                <tr>
                  <td colSpan="10" className="no-data">No books found</td>
                </tr>
              ) : (
                filteredBooks.map((book) => (
                  <tr key={book.id}>
                    <td>#{book.id}</td>
                    <td>
                      <div className="book-image">
                        {book.imageUrl ? (
                          <img 
                            src={getImageUrl(book.imageUrl)} 
                            alt={book.title}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                            }}
                          />
                        ) : (
                          <div className="no-image">No Image</div>
                        )}
                      </div>
                    </td>
                    <td>{book.title}</td>
                    <td>{book.author || 'N/A'}</td>
                    <td>{formatPrice(book.price)}</td>
                    <td>{book.stock || 0}</td>
                    <td style={{ minWidth: '120px', width: '120px', textAlign: 'center', padding: '16px' }}>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: book.available ? '#d4edda' : '#f8d7da',
                        color: book.available ? '#155724' : '#721c24'
                      }}>
                        {book.available ? 'YES' : 'NO'}
                      </span>
                    </td>
                    <td style={{ minWidth: '120px', width: '120px', textAlign: 'center', padding: '16px' }}>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: book.status === 'ACTIVE' ? '#d4edda' : '#ffc107',
                        color: book.status === 'ACTIVE' ? '#155724' : '#856404'
                      }}>
                        {book.status === 'OUT_OF_STOCK' ? 'OUT OF STOCK' : book.status}
                      </span>
                    </td>
                    <td>{formatDate(book.createdAt || book.createdDate || book.addedDate || new Date().toISOString())}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-edit"
                          onClick={() => handleOpenModal(book)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(book.id)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingBook ? 'Edit Book' : 'Add New Book'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Book Name *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter book name"
                  />
                </div>
                <div className="form-group">
                  <label>Author *</label>
                  <input
                    type="text"
                    name="author"
                    value={formData.author}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter author name"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price (LKR) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    step="0.01"
                    min="0"
                    placeholder="Enter price"
                  />
                </div>
                <div className="form-group">
                  <label>Stock *</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    required
                    min="0"
                    placeholder="Enter stock quantity"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <small style={{ color: '#999', fontSize: '0.85rem' }}>
                    No categories available. Create categories first.
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>Book Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="4"
                  placeholder="Enter book description"
                />
              </div>

              <div className="form-group">
                <label>Book Image</label>
                <input
                  type="file"
                  id="bookImage"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                <div className="image-upload-area">
                  {!imagePreview ? (
                    <button
                      type="button"
                      className="image-upload-button"
                      onClick={() => document.getElementById('bookImage').click()}
                    >
                      <span className="upload-icon">📁</span>
                      Choose Image
                    </button>
                  ) : (
                    <>
                      <div className="image-preview">
                        <img src={imagePreview} alt="Preview" />
                        <button
                          type="button"
                          className="btn-remove-image"
                          onClick={handleRemoveImage}
                          title="Remove image"
                        >
                          ×
                        </button>
                      </div>
                      <button
                        type="button"
                        className="image-change-button"
                        onClick={() => document.getElementById('bookImage').click()}
                      >
                        <span className="upload-icon">🔄</span>
                        Change Image
                      </button>
                    </>
                  )}
                  {imageFile && (
                    <div className="image-file-info">
                      <span>📎 {imageFile.name}</span>
                      <span className="file-size">({(imageFile.size / 1024).toFixed(2)} KB)</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                  </select>
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="available"
                      checked={formData.available}
                      onChange={handleInputChange}
                    />
                    Book is available
                  </label>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : (editingBook ? 'Update Book' : 'Create Book')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookManagement;

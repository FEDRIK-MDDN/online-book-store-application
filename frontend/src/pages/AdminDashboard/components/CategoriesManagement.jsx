import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../authContext';
import { adminApi } from '../../../api';
import { categoryCache } from '../../../utils/categoryCache';
import './CategoriesManagement.css';

const CategoriesManagement = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const token = user?.token;

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminApi.getCategories(token);
      console.log('🏷️ Fetched categories from backend:', data);
      const categoriesArray = Array.isArray(data) ? data : [];
      setCategories(categoriesArray);
      // Cache categories for public pages
      categoryCache.save(categoriesArray);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenModal = (category = null) => {
    if (category) {
      console.log('📝 Opening edit modal with category:', category);
      setEditingCategory(category);
      setFormData({
        name: category.name || '',
        description: category.description || '',
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const categoryData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
      };

      if (!categoryData.name) {
        alert('Category name is required');
        return;
      }

      console.log('📤 Submitting category:', categoryData);

      if (editingCategory) {
        await adminApi.updateCategory(token, editingCategory.id, categoryData);
        alert('Category updated successfully!');
      } else {
        await adminApi.createCategory(token, categoryData);
        alert('Category created successfully!');
      } // This will also update the cache

      handleCloseModal();
      await fetchCategories();
    } catch (err) {
      console.error('Submit error:', err);
      alert(err.message || `Failed to ${editingCategory ? 'update' : 'create'} category`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (categoryId, categoryName) => {
    if (!window.confirm(`Are you sure you want to delete the category "${categoryName}"?`)) {
      return;
    }
    try {
      await adminApi.deleteCategory(token, categoryId);
      await fetchCategories(); // This will also update the cache
      alert('Category deleted successfully!');
    } catch (err) {
      alert(err.message || 'Failed to delete category');
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="categories-management-loading">
        <div className="spinner"></div>
        <p>Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="categories-management">
      <div className="categories-header">
        <div className="categories-header-left">
          <h2>🏷️ Categories Management</h2>
          <p className="categories-subtitle">Manage book categories</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <span className="btn-icon">➕</span>
          Add Category
        </button>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <div className="categories-controls">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="categories-stats">
          <span className="stat-badge">Total: {categories.length}</span>
          <span className="stat-badge">Showing: {filteredCategories.length}</span>
        </div>
      </div>

      <div className="categories-grid">
        {filteredCategories.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📂</span>
            <p>No categories found</p>
            <button className="btn btn-secondary" onClick={() => handleOpenModal()}>
              Create your first category
            </button>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <div key={category.id} className="category-card">
              <div className="category-card-header">
                <h3 className="category-name">{category.name}</h3>
                <div className="category-actions">
                  <button
                    className="btn-icon-action edit"
                    onClick={() => handleOpenModal(category)}
                    title="Edit category"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon-action delete"
                    onClick={() => handleDelete(category.id, category.name)}
                    title="Delete category"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              {category.description && (
                <p className="category-description">{category.description}</p>
              )}
              <div className="category-meta">
                <span className="category-id">ID: {category.id}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCategory ? '✏️ Edit Category' : '➕ Add New Category'}</h3>
              <button className="modal-close" onClick={handleCloseModal}>
                ✖️
              </button>
            </div>
            <form onSubmit={handleSubmit} className="category-form">
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Category Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Fiction, Science, History"
                  className="form-input"
                  required
                  maxLength={50}
                />
              </div>

              <div className="form-group">
                <label htmlFor="description" className="form-label">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter a brief description of this category..."
                  className="form-textarea"
                  rows={4}
                  maxLength={2000}
                />
                <div className="char-count">
                  {formData.description.length} / 2000
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || !formData.name.trim()}
                >
                  {submitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesManagement;

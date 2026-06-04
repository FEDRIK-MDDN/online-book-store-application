import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../authContext';
import { adminApi } from '../../../api';
import jsPDF from 'jspdf';
import './UsersManagement.css';

export default function UsersManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('USER');
  const [processing, setProcessing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: ''
  });
  const [addFormData, setAddFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'USER'
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.getUsers(user.token);
      setUsers(response);
      setFilteredUsers(response);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [user.token]);

  const filterUsers = useCallback(() => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(u => u.role === filterRole);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, filterRole]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0][0];
  };

  const getRandomColor = (name) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  const toggleMenu = (userId) => {
    setActiveMenu(activeMenu === userId ? null : userId);
  };

  const handleViewProfile = (user) => {
    setSelectedUser(user);
    setActiveMenu(null);
    // Open profile view
  };

  const handleEditDetails = (userItem) => {
    setSelectedUser(userItem);
    setEditFormData({
      name: userItem.name || '',
      email: userItem.email || ''
    });
    setShowEditModal(true);
    setActiveMenu(null);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;
    
    setProcessing(true);
    try {
      const result = await adminApi.updateUser(selectedUser.id, editFormData, user.token);
      
      // Update users list with the edited user
      setUsers(users.map(u => 
        u.id === selectedUser.id ? { ...u, ...result } : u
      ));
      
      setShowEditModal(false);
      setSelectedUser(null);
      alert('User details updated successfully!');
    } catch (error) {
      console.error('Failed to update user:', error);
      alert(`Failed to update user: ${error.data?.message || error.message || 'Please try again.'}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleAddUser = async () => {
    // Validate form
    if (!addFormData.name || !addFormData.email || !addFormData.password) {
      alert('Please fill in all required fields.');
      return;
    }

    if (addFormData.password !== addFormData.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    if (addFormData.password.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }

    setProcessing(true);
    try {
      const userData = {
        name: addFormData.name,
        email: addFormData.email,
        password: addFormData.password,
        confirmPassword: addFormData.confirmPassword
      };

      // Create user with optional role parameter
      const result = await adminApi.createUser(userData, user.token);
      
      // If role is ADMIN, update the role
      if (addFormData.role === 'ADMIN') {
        await adminApi.updateUserRole(result.id, 'ADMIN', user.token);
        result.role = 'ADMIN';
      }
      
      // Add new user to the list
      setUsers([...users, result]);
      
      // Reset form and close modal
      setAddFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'USER'
      });
      setShowAddUserModal(false);
      alert('User created successfully!');
    } catch (error) {
      console.error('Failed to create user:', error);
      alert(`Failed to create user: ${error.data?.message || error.message || 'Please try again.'}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleChangePermission = (userItem) => {
    setSelectedUser(userItem);
    setSelectedRole(userItem.role || 'USER');
    setShowPermissionModal(true);
    setActiveMenu(null);
  };

  const handleSaveRole = async () => {
    if (!selectedUser) return;
    
    setProcessing(true);
    try {
      await adminApi.updateUserRole(selectedUser.id, selectedRole, user.token);
      
      // Update local state
      setUsers(users.map(u => 
        u.id === selectedUser.id ? { ...u, role: selectedRole } : u
      ));
      
      setShowPermissionModal(false);
      setSelectedUser(null);
      alert('User role updated successfully!');
    } catch (error) {
      console.error('Failed to update role:', error);
      alert('Failed to update user role. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleUserStatus = async (userItem) => {
    const isActive = userItem.enabled !== false; // Assume enabled by default
    const action = isActive ? 'deactivate' : 'activate';
    
    if (!window.confirm(`Are you sure you want to ${action} ${userItem.name || userItem.email}?`)) {
      return;
    }

    try {
      if (isActive) {
        await adminApi.deactivateUser(userItem.id, user.token);
      } else {
        await adminApi.activateUser(userItem.id, user.token);
      }
      
      // Update local state
      setUsers(users.map(u => 
        u.id === userItem.id ? { ...u, enabled: !isActive } : u
      ));
      
      alert(`User ${action}d successfully!`);
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
      alert(`Failed to ${action} user. Please try again.`);
    }
    setActiveMenu(null);
  };

  const handleExportDetails = (userItem) => {
    try {
      // Create new PDF document
      const doc = new jsPDF();
      
      // Set up the PDF styling
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPosition = 20;

      // Title
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text('User Details Report', margin, yPosition);
      
      yPosition += 10;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, yPosition);
      
      // Reset text color
      doc.setTextColor(0);
      yPosition += 15;
      
      // Draw separator line
      doc.setDrawColor(200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // User Information Section
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Personal Information', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      
      const addField = (label, value) => {
        doc.setFont(undefined, 'bold');
        doc.text(`${label}:`, margin, yPosition);
        doc.setFont(undefined, 'normal');
        doc.text(value || 'N/A', margin + 40, yPosition);
        yPosition += 7;
      };

      addField('ID', String(userItem.id));
      addField('Full Name', userItem.name);
      addField('Email', userItem.email);
      addField('Username', userItem.username || userItem.email);
      
      yPosition += 5;
      
      // Account Details Section
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Account Details', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      
      const roleInfo = getRoleLabel(userItem.role);
      addField('Role', roleInfo.label);
      addField('Status', userItem.enabled !== false ? 'Active' : 'Inactive');
      addField('Last Active', formatDate(userItem.lastActive));
      addField('Date Added', formatDate(userItem.createdAt));
      
      yPosition += 5;

      // Additional Information Section
      if (userItem.phone || userItem.address || userItem.notes) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Additional Information', margin, yPosition);
        yPosition += 8;

        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        
        if (userItem.phone) addField('Phone', userItem.phone);
        if (userItem.address) addField('Address', userItem.address);
        if (userItem.notes) {
          doc.setFont(undefined, 'bold');
          doc.text('Notes:', margin, yPosition);
          yPosition += 7;
          doc.setFont(undefined, 'normal');
          const splitNotes = doc.splitTextToSize(userItem.notes, pageWidth - 2 * margin);
          doc.text(splitNotes, margin, yPosition);
          yPosition += splitNotes.length * 5;
        }
      }

      // Footer
      yPosition = doc.internal.pageSize.getHeight() - 20;
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('Online Bookstore - User Management System', margin, yPosition);
      doc.text(`Page 1 of 1`, pageWidth - margin - 20, yPosition);

      // Save the PDF
      doc.save(`user-${userItem.username || userItem.email}-details.pdf`);
      
      setActiveMenu(null);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export user details. Please try again.');
    }
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
    setActiveMenu(null);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;
    
    setProcessing(true);
    try {
      console.log('Permanently deleting user:', { id: selectedUser.id, email: selectedUser.email });
      const result = await adminApi.deleteUser(selectedUser.id, user.token);
      console.log('Delete user response:', result);
      
      // Update users list by removing the deleted user
      setUsers(users.filter(u => u.id !== selectedUser.id));
      setShowDeleteModal(false);
      setSelectedUser(null);
      alert('User permanently deleted successfully! Order history has been preserved.');
    } catch (error) {
      console.error('Failed to delete user - Full error:', {
        error,
        status: error.status,
        data: error.data,
        message: error.message,
        userId: selectedUser.id,
        userEmail: selectedUser.email
      });
      
      // Show detailed error message
      let errorMessage = 'Failed to delete user. ';
      if (error.status === 403) {
        errorMessage += 'You do not have permission to delete users.';
      } else if (error.status === 404) {
        errorMessage += 'User not found.';
      } else if (error.status === 400) {
        // Handle bad request (e.g., trying to delete own account)
        errorMessage += error.data?.message || 'Invalid request.';
      } else if (error.status === 500) {
        // Show backend error message if available
        if (error.data?.message) {
          errorMessage += `Server error: ${error.data.message}`;
        } else {
          errorMessage += 'Server error. Please check backend logs for details.';
        }
      } else if (error.data?.message) {
        errorMessage += error.data.message;
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please try again.';
      }
      
      // Add technical details for debugging
      if (process.env.NODE_ENV === 'development') {
        errorMessage += `\n\nDebug Info:\nUser ID: ${selectedUser.id}\nStatus: ${error.status || 'unknown'}\nEndpoint: DELETE /admin/users/${selectedUser.id}`;
      }
      
      alert(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const getRoleLabel = (role) => {
    const roleMap = {
      'ADMIN': { label: 'Admin', color: '#3B82F6' },
      'USER': { label: 'User', color: '#10B981' },
      'MANAGER': { label: 'Manager', color: '#8B5CF6' },
      'EDITOR': { label: 'Editor', color: '#F59E0B' }
    };
    return roleMap[role] || { label: role || 'User', color: '#6B7280' };
  };

  // Add sample data if no users exist
  useEffect(() => {
    if (!loading && users.length === 0) {
      const now = new Date();
      const sampleUsers = [
        {
          id: 1,
          name: 'Maurice Wilkins',
          email: 'mwilkins@company.co',
          role: 'MANAGER',
          lastActive: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          createdAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString() // 45 days ago
        },
        {
          id: 2,
          name: 'Eugene Aguirre',
          email: 'eugeneaguirre@lorem.com',
          role: 'USER',
          lastActive: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          createdAt: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000).toISOString() // 120 days ago
        },
        {
          id: 3,
          name: 'Dominick M. Gutierres',
          email: 'domgut@ipsum.io',
          role: 'EDITOR',
          lastActive: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
          createdAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days ago
        },
        {
          id: 4,
          name: 'Sarah Johnson',
          email: 'sarah.johnson@bookstore.com',
          role: 'ADMIN',
          lastActive: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
          createdAt: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString() // 180 days ago
        },
        {
          id: 5,
          name: 'Michael Chen',
          email: 'mchen@bookstore.com',
          role: 'USER',
          lastActive: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
          createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days ago
        }
      ];
      setUsers(sampleUsers);
      setFilteredUsers(sampleUsers);
    }
  }, [loading, users.length]);

  if (loading) {
    return (
      <div className="users-loading">
        <div className="spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="users-management">
      <div className="users-header">
        <div className="users-title-section">
          <h1 className="users-title">User management</h1>
          <p className="users-subtitle">Manage your team members and their account permissions here.</p>
        </div>
      </div>

      <div className="users-controls">
        <div className="users-count">
          <h2>All users <span className="count-badge">{filteredUsers.length}</span></h2>
        </div>
        
        <div className="users-actions">
          <div className="search-box">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18 18l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <button 
            className={`filters-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M2.5 5h15M5 10h10M7.5 15h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Filters
          </button>

          <button 
            className="add-user-btn"
            onClick={() => setShowAddUserModal(true)}
          >
            <span className="plus-icon">+</span>
            Add user
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Role:</label>
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
              <option value="all">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="USER">User</option>
            </select>
          </div>
        </div>
      )}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th className="name-col">
                Name
                <svg className="sort-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3v10M12 9l-4 4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </th>
              <th className="email-col">Email</th>
              <th className="role-col">
                Role(s)
                <svg className="sort-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3v10M12 9l-4 4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </th>
              <th className="last-active-col">
                Last active
                <svg className="sort-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3v10M12 9l-4 4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </th>
              <th className="date-added-col">Date added</th>
              <th className="actions-col"></th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((userItem) => {
              const roleInfo = getRoleLabel(userItem.role);
              return (
                <tr key={userItem.id}>
                  <td className="name-col">
                    <div className="user-name">{userItem.name}</div>
                  </td>
                  <td className="email-col">
                    <div className="user-email">{userItem.email}</div>
                  </td>
                  <td className="role-col">
                    <span 
                      className="role-badge" 
                      style={{ backgroundColor: roleInfo.color }}
                    >
                      {roleInfo.label}
                    </span>
                  </td>
                  <td className="last-active-col">
                    {formatDate(userItem.lastActive)}
                  </td>
                  <td className="date-added-col">
                    {formatDate(userItem.createdAt)}
                  </td>
                  <td className="actions-col">
                  <button 
                    className="menu-btn"
                    onClick={() => toggleMenu(userItem.id)}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
                      <circle cx="10" cy="4" r="1.5" fill="currentColor"/>
                      <circle cx="10" cy="16" r="1.5" fill="currentColor"/>
                    </svg>
                  </button>
                  
                  {activeMenu === userItem.id && (
                    <div className="dropdown-menu">
                      <button onClick={() => handleViewProfile(userItem)}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M10 12a3 3 0 100-6 3 3 0 000 6zM2 18a8 8 0 0116 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        View profile
                      </button>
                      <button onClick={() => handleEditDetails(userItem)}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M14 2l4 4-10 10H4v-4L14 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Edit details
                      </button>
                      <button onClick={() => handleChangePermission(userItem)}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M10 2v4m0 8v4M4.93 4.93l2.83 2.83m5.66 5.66l2.83 2.83M2 10h4m8 0h4M4.93 15.07l2.83-2.83m5.66-5.66l2.83-2.83" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        Change role
                      </button>
                      <button onClick={() => handleToggleUserStatus(userItem)}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M10 2a8 8 0 100 16 8 8 0 000-16z" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        {userItem.enabled !== false ? 'Deactivate user' : 'Activate user'}
                      </button>
                      <button onClick={() => handleExportDetails(userItem)}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M6 10l4 4 4-4M10 3v11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M3 17h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        Export details
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteUser(userItem)}
                      >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M3 5h14M8 5V3h4v2m-6 3v8m4-8v8M5 5l1 12h8l1-12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Delete user
                        <span className="delete-indicator"></span>
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="no-users">
            <p>No users found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => !processing && setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete User</h3>
              <button className="modal-close" onClick={() => !processing && setShowDeleteModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to permanently delete <strong>{selectedUser?.name || selectedUser?.email}</strong>?</p>
              <p className="warning-text" style={{ color: '#dc2626', fontWeight: 'bold' }}>
                ⚠️ This action cannot be undone!
              </p>
              <div style={{ marginTop: '16px', fontSize: '14px', color: '#6b7280', lineHeight: '1.6' }}>
                <p style={{ marginBottom: '8px' }}>What will happen:</p>
                <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
                  <li>User account will be permanently removed</li>
                  <li>User cannot log in anymore</li>
                  <li>Order history will be preserved for accounting</li>
                  <li>Cart data will be deleted</li>
                </ul>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setShowDeleteModal(false)}
                disabled={processing}
              >
                Cancel
              </button>
              <button 
                className="btn-danger" 
                onClick={confirmDeleteUser}
                disabled={processing}
              >
                {processing ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="modal-overlay" onClick={() => !processing && setShowAddUserModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New User</h3>
              <button className="modal-close" onClick={() => !processing && setShowAddUserModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form className="edit-form" onSubmit={(e) => { e.preventDefault(); handleAddUser(); }}>
                <div className="form-group">
                  <label htmlFor="addName">Full Name *</label>
                  <input
                    type="text"
                    id="addName"
                    value={addFormData.name}
                    onChange={(e) => setAddFormData({...addFormData, name: e.target.value})}
                    placeholder="Enter full name"
                    required
                    disabled={processing}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="addEmail">Email *</label>
                  <input
                    type="email"
                    id="addEmail"
                    value={addFormData.email}
                    onChange={(e) => setAddFormData({...addFormData, email: e.target.value})}
                    placeholder="Enter email address"
                    required
                    disabled={processing}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="addPassword">Password *</label>
                  <input
                    type="password"
                    id="addPassword"
                    value={addFormData.password}
                    onChange={(e) => setAddFormData({...addFormData, password: e.target.value})}
                    placeholder="Enter password (min. 6 characters)"
                    required
                    minLength={6}
                    disabled={processing}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="addConfirmPassword">Confirm Password *</label>
                  <input
                    type="password"
                    id="addConfirmPassword"
                    value={addFormData.confirmPassword}
                    onChange={(e) => setAddFormData({...addFormData, confirmPassword: e.target.value})}
                    placeholder="Confirm password"
                    required
                    disabled={processing}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="addRole">Role</label>
                  <select
                    id="addRole"
                    value={addFormData.role}
                    onChange={(e) => setAddFormData({...addFormData, role: e.target.value})}
                    disabled={processing}
                  >
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div className="form-info">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="8" stroke="#3B82F6" strokeWidth="1.5"/>
                    <path d="M10 10v4M10 6v1" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <p>The new user will receive their login credentials via email.</p>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setShowAddUserModal(false)}
                disabled={processing}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleAddUser}
                disabled={processing}
              >
                {processing ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => !processing && setShowEditModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit User Details</h3>
              <button className="modal-close" onClick={() => !processing && setShowEditModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form className="edit-form" onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}>
                <div className="form-group">
                  <label htmlFor="editName">Full Name</label>
                  <input
                    type="text"
                    id="editName"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    placeholder="Enter full name"
                    required
                    disabled={processing}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="editEmail">Email</label>
                  <input
                    type="email"
                    id="editEmail"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                    placeholder="Enter email address"
                    required
                    disabled={processing}
                  />
                </div>

                <div className="form-info">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="8" stroke="#3B82F6" strokeWidth="1.5"/>
                    <path d="M10 10v4M10 6v1" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <p>Changes will be saved to the user's profile immediately.</p>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setShowEditModal(false)}
                disabled={processing}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleSaveEdit}
                disabled={processing}
              >
                {processing ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permission Modal */}
      {showPermissionModal && (
        <div className="modal-overlay" onClick={() => !processing && setShowPermissionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change User Role</h3>
              <button className="modal-close" onClick={() => !processing && setShowPermissionModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="userRole">Select Role for <strong>{selectedUser?.name || selectedUser?.email}</strong></label>
                <select
                  id="userRole"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  disabled={processing}
                  className="role-select"
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="form-info">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="8" stroke="#3B82F6" strokeWidth="1.5"/>
                  <path d="M10 10v4M10 6v1" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <p>Changing the role will update the user's access permissions immediately.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setShowPermissionModal(false)}
                disabled={processing}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleSaveRole}
                disabled={processing}
              >
                {processing ? 'Saving...' : 'Save Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

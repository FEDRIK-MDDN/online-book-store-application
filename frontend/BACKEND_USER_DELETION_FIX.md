# ⚠️ BACKEND FIX REQUIRED - User Deletion Error

## Problem
When trying to delete a user from the Admin Dashboard, you get the error:
```
Failed to delete user. Server error. The user might have associated data that prevents deletion.
```

## Root Cause
The backend database has foreign key constraints that prevent user deletion when the user has associated data such as:
- **Orders** (user_id references the user)
- **Cart items** (user_email or user_id references the user)
- **Other related entities** that depend on the user

## Current Backend Endpoint
```
DELETE /admin/users/{id}
```

The backend is likely throwing a constraint violation exception when trying to delete a user who has orders or cart data.

## Solution Options

### Option 1: CASCADE DELETE (Recommended for Admin)
Update your JPA entity relationships to cascade the delete operation. This will automatically delete all related data when a user is deleted.

#### In `UserModel.java`:
```java
@Entity
@Table(name = "users")
public class UserModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // ... other fields ...
    
    // Add cascade delete for orders
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Order> orders;
    
    // Add cascade delete for cart items (if you have a Cart entity)
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Cart cart;
}
```

#### In `Order.java`:
```java
@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserModel user;
    
    // ... other fields ...
}
```

### Option 2: Manual Cleanup in AdminController
Clean up related data before deleting the user.

#### In `AdminController.java`:
```java
@DeleteMapping("/users/{id}")
public ResponseEntity<?> deleteUser(
        @PathVariable Long id,
        @RequestHeader("Authorization") String token) {
    try {
        validateAdminToken(token);
        
        // Find the user
        Optional<UserModel> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404)
                .body(Map.of("message", "User not found"));
        }
        
        UserModel user = userOpt.get();
        
        // Prevent deleting yourself
        String requestEmail = jwtUtil.extractUsername(token.substring(7));
        if (user.getEmail().equals(requestEmail)) {
            return ResponseEntity.status(400)
                .body(Map.of("message", "Cannot delete your own account"));
        }
        
        // Clean up related data before deletion
        try {
            // 1. Delete user's orders
            orderRepository.deleteByUserId(id);
            
            // 2. Delete user's cart
            cartRepository.deleteByUserId(id);
            
            // 3. Delete any other related entities
            // reviewRepository.deleteByUserId(id);
            // wishlistRepository.deleteByUserId(id);
            
            // 4. Now safe to delete the user
            userRepository.deleteById(id);
            
            return ResponseEntity.ok(
                Map.of("message", "User and associated data deleted successfully")
            );
            
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "message", "Failed to delete user: " + e.getMessage(),
                    "details", "Please check database constraints and try again"
                ));
        }
        
    } catch (Exception e) {
        return ResponseEntity.status(401)
            .body(Map.of("message", "Unauthorized: " + e.getMessage()));
    }
}
```

### Option 3: Soft Delete (Best Practice for Production)
Instead of actually deleting users, mark them as deleted. This preserves data integrity and allows for data recovery.

#### Update `UserModel.java`:
```java
@Entity
@Table(name = "users")
public class UserModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    private String email;
    private String password;
    private String role;
    private Boolean verified = false;
    
    // Add soft delete flag
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;
    
    @Column(name = "deleted_at")
    private Date deletedAt;
    
    // ... other fields and methods ...
}
```

#### Update `UserRepository.java`:
```java
public interface UserRepository extends JpaRepository<UserModel, Long> {
    Optional<UserModel> findByEmail(String email);
    
    // Find only active (non-deleted) users
    @Query("SELECT u FROM UserModel u WHERE u.isDeleted = false")
    List<UserModel> findAllActive();
    
    // Find including deleted users (for admin)
    List<UserModel> findAll();
}
```

#### Update `AdminController.java`:
```java
@DeleteMapping("/users/{id}")
public ResponseEntity<?> deleteUser(
        @PathVariable Long id,
        @RequestHeader("Authorization") String token) {
    try {
        validateAdminToken(token);
        
        Optional<UserModel> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404)
                .body(Map.of("message", "User not found"));
        }
        
        UserModel user = userOpt.get();
        
        // Prevent deleting yourself
        String requestEmail = jwtUtil.extractUsername(token.substring(7));
        if (user.getEmail().equals(requestEmail)) {
            return ResponseEntity.status(400)
                .body(Map.of("message", "Cannot delete your own account"));
        }
        
        // Soft delete - mark as deleted
        user.setIsDeleted(true);
        user.setDeletedAt(new Date());
        userRepository.save(user);
        
        return ResponseEntity.ok(
            Map.of("message", "User deleted successfully (soft delete)")
        );
        
    } catch (Exception e) {
        return ResponseEntity.status(401)
            .body(Map.of("message", "Unauthorized: " + e.getMessage()));
    }
}

// Optional: Add endpoint to permanently delete soft-deleted users
@DeleteMapping("/users/{id}/permanent")
public ResponseEntity<?> permanentlyDeleteUser(
        @PathVariable Long id,
        @RequestHeader("Authorization") String token) {
    try {
        validateAdminToken(token);
        
        Optional<UserModel> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty() || !userOpt.get().getIsDeleted()) {
            return ResponseEntity.status(404)
                .body(Map.of("message", "User not found or not marked for deletion"));
        }
        
        // Clean up related data then permanently delete
        orderRepository.deleteByUserId(id);
        cartRepository.deleteByUserId(id);
        userRepository.deleteById(id);
        
        return ResponseEntity.ok(
            Map.of("message", "User permanently deleted")
        );
        
    } catch (Exception e) {
        return ResponseEntity.status(500)
            .body(Map.of("message", "Failed to delete user: " + e.getMessage()));
    }
}
```

## Recommended Approach

**For Development/Testing**: Use **Option 2** (Manual Cleanup) - Simple and effective

**For Production**: Use **Option 3** (Soft Delete) - Best practice that preserves data integrity

## Implementation Steps

1. **Choose your approach** based on your needs
2. **Update the backend code** with the selected solution
3. **Test the deletion** with a test user who has orders
4. **Restart the backend server**
5. **Try deleting a user** from the Admin Dashboard

## Frontend Already Handles Errors Well

The frontend code in `UsersManagement.jsx` already has proper error handling:

```javascript
const confirmDeleteUser = async () => {
  if (!selectedUser) return;
  
  setProcessing(true);
  try {
    await adminApi.deleteUser(selectedUser.id, user.token);
    
    // Update users list by removing the deleted user
    setUsers(users.filter(u => u.id !== selectedUser.id));
    setShowDeleteModal(false);
    setSelectedUser(null);
    alert('User deleted successfully!');
  } catch (error) {
    console.error('Failed to delete user:', error);
    
    // Show detailed error message
    let errorMessage = 'Failed to delete user. ';
    if (error.status === 403) {
      errorMessage += 'You do not have permission to delete users.';
    } else if (error.status === 404) {
      errorMessage += 'User not found.';
    } else if (error.status === 500) {
      errorMessage += 'Server error. The user might have associated data that prevents deletion.';
    } else if (error.data?.message || error.message) {
      errorMessage += error.data?.message || error.message;
    } else {
      errorMessage += 'Please try again.';
    }
    
    alert(errorMessage);
  } finally {
    setProcessing(false);
  }
};
```

The frontend will display the appropriate error message once the backend is fixed.

## Testing After Fix

1. **Create a test user** with some orders
2. **Try to delete the user** from Admin Dashboard
3. **Verify** the user and their associated data are handled correctly
4. **Check database** to ensure data consistency

## Database Schema Recommendation

If using MySQL/PostgreSQL, ensure proper foreign key constraints:

```sql
-- For hard delete with cascade
ALTER TABLE orders 
ADD CONSTRAINT fk_orders_user 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

ALTER TABLE cart_items 
ADD CONSTRAINT fk_cart_items_user 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;
```

Or for soft delete approach:

```sql
-- Add soft delete columns
ALTER TABLE users 
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN deleted_at TIMESTAMP NULL;

-- Update queries to filter out deleted users
-- (Handle this in your JPA queries as shown above)
```

---

## Summary

**Problem**: Database constraint violations when deleting users with orders/cart data

**Solution**: ✅ **IMPLEMENTED - Option 3 (Soft Delete)**

**Status**: ✅ **COMPLETED** - Backend soft delete implemented successfully

**Implementation Details**:
- Added `deleted` and `deletedAt` fields to `UserModel`
- Created soft-delete-aware repository queries (`findByEmailAndDeletedFalse`, etc.)
- Updated `UserServiceImpl` to soft delete users instead of hard delete
- Database migration V15 adds `is_deleted` and `deleted_at` columns
- Login and authentication now ignore soft-deleted users
- Order history and data integrity preserved

**Priority**: ✅ Resolved - Admin can now delete users without constraint violations

# Backend Hard Delete Implementation Guide

## Overview
To enable permanent user deletion from the database, you need to handle foreign key constraints by either using CASCADE DELETE or manually cleaning up related data before deletion.

## Current Issue
When trying to delete a user, the database throws a foreign key constraint violation because users have related records in:
- `orders` table
- `cart_items` or `carts` table
- Potentially other tables (reviews, wishlists, etc.)

## Solution Options

### Option 1: Manual Cleanup (Recommended for Control)

Update your `UserServiceImpl.deleteUser()` method to clean up related data first:

```java
@Service
@Transactional
public class UserServiceImpl implements UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private CartRepository cartRepository;
    
    @Override
    @Transactional
    public void deleteUser(Long id) {
        UserModel user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        
        // Step 1: Handle orders (IMPORTANT: Choose one approach)
        
        // Approach A: Delete all user's orders (loses purchase history)
        orderRepository.deleteByUserId(id);
        
        // Approach B: Keep orders but nullify user reference (preserves history)
        // orderRepository.setUserIdToNullByUserId(id);
        
        // Step 2: Delete user's cart
        cartRepository.deleteByUserId(id);
        
        // Step 3: Delete other related data
        // reviewRepository.deleteByUserId(id);
        // wishlistRepository.deleteByUserId(id);
        // addressRepository.deleteByUserId(id);
        
        // Step 4: Now safe to delete the user
        userRepository.deleteById(id);
        
        log.info("User with id {} and all related data permanently deleted", id);
    }
}
```

**Required Repository Methods:**

Add these to your repositories:

```java
// OrderRepository.java
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    // Option A: Delete orders (loses history)
    @Modifying
    @Transactional
    @Query("DELETE FROM Order o WHERE o.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);
    
    // Option B: Preserve orders (recommended for e-commerce)
    @Modifying
    @Transactional
    @Query("UPDATE Order o SET o.user = null WHERE o.user.id = :userId")
    void setUserIdToNullByUserId(@Param("userId") Long userId);
}

// CartRepository.java
public interface CartRepository extends JpaRepository<Cart, Long> {
    @Modifying
    @Transactional
    @Query("DELETE FROM Cart c WHERE c.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);
    
    // Or if you have cart_items table
    @Modifying
    @Transactional
    @Query("DELETE FROM CartItem ci WHERE ci.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);
}
```

### Option 2: Database CASCADE DELETE (Automatic)

Modify your database schema to automatically delete related records:

```sql
-- Drop existing foreign key constraints
ALTER TABLE orders 
DROP FOREIGN KEY fk_orders_user_id;  -- Use your actual constraint name

ALTER TABLE cart_items 
DROP FOREIGN KEY fk_cart_items_user_id;

-- Add CASCADE DELETE constraints
ALTER TABLE orders 
ADD CONSTRAINT fk_orders_user_id 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

ALTER TABLE cart_items 
ADD CONSTRAINT fk_cart_items_user_id 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

-- Repeat for other tables with user foreign keys
```

**To find existing constraint names:**
```sql
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    REFERENCED_TABLE_NAME
FROM 
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE 
    REFERENCED_TABLE_NAME = 'users'
    AND TABLE_SCHEMA = 'your_database_name';
```

Then your service method becomes simple:
```java
@Override
@Transactional
public void deleteUser(Long id) {
    UserModel user = userRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    
    // With CASCADE DELETE, this automatically deletes all related records
    userRepository.deleteById(id);
    
    log.info("User with id {} permanently deleted (cascaded)", id);
}
```

### Option 3: JPA Cascade in Entity (Application-Level)

Update your `UserModel.java` entity:

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
    
    // Add cascade delete for orders
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Order> orders = new ArrayList<>();
    
    // Add cascade delete for cart
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Cart cart;
    
    // Add cascade for other relationships
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Review> reviews = new ArrayList<>();
    
    // ... getters and setters
}
```

Make sure corresponding entities reference the user:
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
    
    // ... other fields
}
```

## Recommendation for E-commerce

**For a bookstore, I recommend Option 1 with Approach B (preserve orders):**

```java
@Override
@Transactional
public void deleteUser(Long id) {
    UserModel user = userRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    
    // Keep orders for accounting but remove user reference
    orderRepository.setUserIdToNullByUserId(id);
    
    // Delete cart (temporary data)
    cartRepository.deleteByUserId(id);
    
    // Delete user
    userRepository.deleteById(id);
    
    log.info("User {} permanently deleted, orders preserved", id);
}
```

**Why?**
- ✅ Orders preserved for accounting/tax records
- ✅ Revenue data remains intact
- ✅ Complies with financial record-keeping requirements
- ✅ Can still analyze historical sales data
- ✅ Order status and fulfillment tracking continues

## Security Enhancements

Add these checks to your delete method:

```java
@Override
@Transactional
public void deleteUser(Long id, String requestEmail) {
    UserModel user = userRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    
    // Prevent self-deletion
    if (user.getEmail().equals(requestEmail)) {
        throw new IllegalArgumentException("Cannot delete your own account");
    }
    
    // Prevent deleting other admins (optional)
    if ("ADMIN".equals(user.getRole())) {
        throw new IllegalArgumentException("Cannot delete admin accounts");
    }
    
    // Clean up related data
    orderRepository.setUserIdToNullByUserId(id);
    cartRepository.deleteByUserId(id);
    
    // Delete user
    userRepository.deleteById(id);
    
    log.info("User {} permanently deleted by admin {}", id, requestEmail);
}
```

Update your AdminController:
```java
@DeleteMapping("/users/{id}")
public ResponseEntity<?> deleteUser(
        @PathVariable Long id,
        @RequestHeader("Authorization") String token) {
    try {
        validateAdminToken(token);
        
        // Extract email from token to prevent self-deletion
        String requestEmail = jwtUtil.extractUsername(token.substring(7));
        
        userService.deleteUser(id, requestEmail);
        
        return ResponseEntity.ok(
            Map.of("message", "User permanently deleted successfully")
        );
        
    } catch (IllegalArgumentException e) {
        return ResponseEntity.status(400)
            .body(Map.of("message", e.getMessage()));
    } catch (Exception e) {
        return ResponseEntity.status(500)
            .body(Map.of("message", "Failed to delete user: " + e.getMessage()));
    }
}
```

## Testing Steps

1. **Before implementing**, backup your database
2. **Test with a user who has:**
   - At least one order
   - Items in cart
   - Other related data
3. **Verify:**
   - User is removed from `users` table
   - Orders are handled correctly (deleted or user_id set to null)
   - Cart is deleted
   - No orphaned records remain

## SQL Test Queries

```sql
-- Check user exists
SELECT * FROM users WHERE id = <user_id>;

-- Check user's orders
SELECT * FROM orders WHERE user_id = <user_id>;

-- Check user's cart
SELECT * FROM cart_items WHERE user_id = <user_id>;

-- After deletion, verify cleanup
SELECT * FROM users WHERE id = <user_id>;  -- Should be empty
SELECT * FROM orders WHERE user_id = <user_id>;  -- Should be empty or user_id=NULL
SELECT * FROM cart_items WHERE user_id = <user_id>;  -- Should be empty
```

## Remove Soft Delete Code (If You Added It)

If you previously implemented soft delete, remove:

1. **From UserModel.java:**
   ```java
   // Remove these fields
   private Boolean deleted = false;
   private LocalDateTime deletedAt;
   ```

2. **From UserRepository.java:**
   ```java
   // Change back from:
   Optional<UserModel> findByEmailAndDeletedFalse(String email);
   // To:
   Optional<UserModel> findByEmail(String email);
   ```

3. **Drop database columns:**
   ```sql
   ALTER TABLE users DROP COLUMN is_deleted;
   ALTER TABLE users DROP COLUMN deleted_at;
   ```

## Summary

**Quick Implementation Checklist:**

- [ ] Choose your approach (Manual cleanup recommended)
- [ ] Add repository methods (`deleteByUserId` or `setUserIdToNullByUserId`)
- [ ] Update `UserServiceImpl.deleteUser()` to clean up data
- [ ] Add security checks (prevent self-deletion)
- [ ] Test with user who has orders and cart
- [ ] Verify all related data is handled correctly
- [ ] Consider keeping order history for accounting

**Frontend is already ready** - it just calls `DELETE /admin/users/{id}` endpoint.

Once implemented, user deletion will work without foreign key errors!

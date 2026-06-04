# Backend Hard Delete Implementation (User Deletion)

This project currently fails to delete users who have related records (orders, carts, cart items, etc.) because **foreign key constraints** prevent deleting a referenced `users` row.

Your frontend already calls the correct endpoint (`DELETE /admin/users/{id}`); the backend must choose a strategy to satisfy DB constraints.

## Important: What “hard delete” means here
Hard delete = the `users` row is physically removed from the database.

Because orders typically must be preserved for accounting, the **recommended** hard-delete approach is:

1. Clean up the user’s **cart** (safe to delete)
2. **Preserve order history** but remove the reference to the deleted user, by **setting `orders.user_id` to NULL**
3. Delete the user row

This yields:
- ✅ User fully removed
- ✅ Orders preserved
- ✅ No FK violations

---

## Option A (Recommended): Preserve orders, delete user

### 1) Database changes (Flyway)

You must allow `orders.user_id` to be nullable and define the FK action.

Create a new Flyway migration, for example:

- `VXX__orders_user_fk_on_delete_set_null.sql`

It should:
- Make `orders.user_id` nullable
- Drop and recreate the foreign key as `ON DELETE SET NULL`

> Exact SQL differs depending on existing FK name.

#### Example (adjust FK name to your DB)
```sql
-- 1) Make the column nullable
ALTER TABLE orders MODIFY user_id BIGINT NULL;

-- 2) Drop existing FK (replace FK name with your actual name)
ALTER TABLE orders DROP FOREIGN KEY fk_orders_user;

-- 3) Recreate FK with ON DELETE SET NULL
ALTER TABLE orders
  ADD CONSTRAINT fk_orders_user
  FOREIGN KEY (user_id) REFERENCES users(id)
  ON DELETE SET NULL;
```

### 2) Repository helpers
Add to `CartRepository`:
```java
void deleteByUser(UserModel user);
```

Add to `OrderRepository`:
```java
@Modifying
@Query("update OrderModel o set o.user = null where o.user.id = :userId")
int clearUserReference(@Param("userId") Long userId);
```

### 3) Service logic
In `UserServiceImpl.deleteUser(id)` (admin path):

```java
@Transactional
public void deleteUser(Long id) {
    UserModel user = repo.findById(id)
        .orElseThrow(() -> new NotFoundException("User not found"));

    // delete cart + items
    cartRepository.findByUser(user).ifPresent(cart -> {
        cartItemRepository.deleteByCartId(cart.getId());
        cartRepository.delete(cart);
    });

    // preserve orders but detach user
    orderRepository.clearUserReference(id);

    // finally hard delete user
    repo.delete(user);
}
```

---

## Option B: Full cascade delete (delete everything)
If admin deletion should purge all data:

- Add cascading / orphanRemoval where appropriate
- Or set database foreign keys to `ON DELETE CASCADE`

⚠️ Not recommended for production e-commerce because you lose order records.

---

## Option C: Manual cleanup (delete orders too)
Delete order items → orders → cart items → cart → user.

Works, but removes financial history.

---

## Notes / pitfalls
- If you change `orders.user_id` to nullable, update your JPA mapping:
  - `@ManyToOne(optional = true)` and nullable join column.
- Ensure the service method is `@Transactional`.
- Be careful with Flyway migrations: use correct FK names.

---

## Verification checklist
- Delete user who has:
  - cart items
  - orders + order items
- Expected:
  - user row removed
  - cart removed
  - orders remain (with `user_id` = NULL)



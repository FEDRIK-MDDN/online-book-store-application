# Fix for Clear Cart Issue

## Problem
The `clearCart` method may not be working due to lazy loading issues with `cart.getItems()`.

## Solution
Replace the `clearCart` method in `CartServiceImpl.java` with this improved version:

```java
@Override
@Transactional
public void clearCart(String userEmail) {
    CartModel cart = getOrCreateCartForUser(userEmail);
    
    // Explicitly query all items for this cart to avoid lazy loading issues
    List<CartItemModel> items = itemRepo.findByCart(cart);
    
    if (!items.isEmpty()) {
        // Delete all cart items
        itemRepo.deleteAllInBatch(items);
        
        // Clear the collection to keep entities in sync
        cart.getItems().clear();
    }
    
    // Save the cart
    cartRepo.save(cart);
}
```

## Additional Repository Method Needed

Make sure your `CartItemRepository` has this method:

```java
List<CartItemModel> findByCart(CartModel cart);
```

## Alternative Solution (If above doesn't work)

If the batch delete still has issues, use this approach:

```java
@Override
@Transactional
public void clearCart(String userEmail) {
    CartModel cart = getOrCreateCartForUser(userEmail);
    
    // Use a custom delete query to avoid entity loading issues
    itemRepo.deleteByCart(cart);
    
    // Clear the collection
    cart.getItems().clear();
    
    // Save the cart
    cartRepo.save(cart);
}
```

And add this method to `CartItemRepository`:

```java
@Modifying
@Query("DELETE FROM CartItemModel c WHERE c.cart = :cart")
void deleteByCart(@Param("cart") CartModel cart);
```

Make sure to import:
```java
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
```

## Testing

After making these changes:
1. Rebuild your backend: `mvn clean install`
2. Restart the backend server
3. Test the Clear Cart button in the frontend
4. Check the browser console for any error messages
5. Verify in the database that cart_item records are actually deleted

# CRITICAL: Backend Circular Reference Fix

## Problem
Your backend has circular JSON serialization between `Order` and `OrderItem`:
- Order → items → order → items → order (infinite loop)

This causes the response to have a `message` property with corrupted JSON string instead of proper array.

## Solution

### Option 1: Add @JsonIgnore (Quick Fix)

In your `OrderItem.java` entity, add `@JsonIgnore` to the `order` field:

```java
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "order_items")
public class OrderItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    @JsonIgnore  // ← ADD THIS LINE
    private Order order;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "book_id")
    private Book book;
    
    private Integer quantity;
    private BigDecimal price;
    
    // ... rest of the class
}
```

### Option 2: Use DTOs (Best Practice)

Create a `OrderResponseDto` instead of returning entities directly:

```java
public class OrderResponseDto {
    private Long id;
    private String orderStatus;
    private String paymentStatus;
    private BigDecimal totalPrice;
    private LocalDateTime orderDate;
    private List<OrderItemDto> items;
    // No circular reference to parent order
}

public class OrderItemDto {
    private Long id;
    private Integer quantity;
    private BigDecimal price;
    private BookDto book;
    // No reference to parent order - breaks the cycle
}
```

Then in your controller:

```java
@GetMapping("/history")
public ResponseEntity<List<OrderResponseDto>> getOrderHistory() {
    List<Order> orders = orderService.getOrderHistory(userId);
    List<OrderResponseDto> dtos = orders.stream()
        .map(this::toDto)
        .collect(Collectors.toList());
    return ResponseEntity.ok(dtos);
}
```

## After Fixing

Rebuild and restart your backend. The response should be a clean JSON array:

```json
[
  {
    "id": 9,
    "orderStatus": "pending",
    "totalPrice": 1500.00,
    "items": [
      {
        "id": 9,
        "quantity": 2,
        "price": 750.00,
        "book": {
          "id": 5,
          "title": "Book Title",
          "imageUrl": "/uploads/book.jpg"
        }
      }
    ]
  }
]
```

## Steps to Apply Fix

1. Add `@JsonIgnore` to `OrderItem.order` field
2. Rebuild: `.\mvnw clean compile`
3. Restart backend: `.\mvnw spring-boot:run`
4. Refresh your Orders page
5. Orders should now display correctly

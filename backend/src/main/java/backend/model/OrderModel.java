package backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "orders",
        indexes = {
                @Index(name = "ux_orders_order_number", columnList = "order_number", unique = true)
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrderModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Allow null so order history remains after hard delete of a user
    @ManyToOne(optional = true)
    @JoinColumn(name = "user_id", nullable = true)
    private UserModel user;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItemModel> items = new ArrayList<>();

    @Column(name = "order_number", nullable = false, length = 50, unique = true)
    private String orderNumber;

    @Column(name = "total_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalPrice;

    @Column(nullable = false)
    private OffsetDateTime orderDate;

    /**
     * Legacy field kept for backward compatibility with existing database rows / code.
     * Prefer using orderStatus going forward.
     */
    @Column(nullable = false)
    private String status; // Pending, Completed, Cancelled

    @Column(name = "payment_method", nullable = false, length = 16)
    private String paymentMethod; // card, cash

    @Column(name = "payment_status", nullable = false, length = 16)
    private String paymentStatus; // pending, completed, failed, cancelled

    @Column(name = "order_status", nullable = false, length = 16)
    private String orderStatus; // pending, processing, shipped, delivered, cancelled

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}

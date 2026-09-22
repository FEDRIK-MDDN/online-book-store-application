package backend.service;

import backend.dto.OrderPlaceRequest;
import backend.exception.NotFoundException;
import backend.model.*;
import backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class OrderServiceImpl implements OrderService {

    private static final DateTimeFormatter ORDER_NUMBER_TS = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final UserRepository userRepo;
    private final CartRepository cartRepo;
    private final CartItemRepository cartItemRepo;
    private final OrderRepository orderRepo;
    private final OrderItemRepository orderItemRepo;
    private final BillingAddressRepository billingAddressRepo;
    private final PaymentRepository paymentRepo;

    public OrderServiceImpl(UserRepository userRepo,
                            CartRepository cartRepo,
                            CartItemRepository cartItemRepo,
                            OrderRepository orderRepo,
                            OrderItemRepository orderItemRepo,
                            BillingAddressRepository billingAddressRepo,
                            PaymentRepository paymentRepo) {
        this.userRepo = userRepo;
        this.cartRepo = cartRepo;
        this.cartItemRepo = cartItemRepo;
        this.orderRepo = orderRepo;
        this.orderItemRepo = orderItemRepo;
        this.billingAddressRepo = billingAddressRepo;
        this.paymentRepo = paymentRepo;
    }

    @Override
    @Transactional
    public OrderModel placeOrder(String userEmail) {
        // Backward compatible method: default to cash checkout without billing address.
        return placeOrder(userEmail, null);
    }

    @Override
    @Transactional
    public OrderModel placeOrder(String userEmail, OrderPlaceRequest request) {
        UserModel user = userRepo.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User not found"));

        CartModel cart = cartRepo.findByUser(user)
                .orElseThrow(() -> new NotFoundException("Cart not found"));

        List<CartItemModel> items = cartItemRepo.findByCart(cart);
        if (items.isEmpty()) throw new IllegalStateException("Cart is empty");

        String paymentMethod = request != null ? request.getPaymentMethod() : "cash";
        if (paymentMethod == null || paymentMethod.isBlank()) paymentMethod = "cash";
        paymentMethod = paymentMethod.toLowerCase();

        // Normalize "cod" (Cash on Delivery) to "cash" for internal processing
        if (paymentMethod.equals("cod")) paymentMethod = "cash";

        if (!paymentMethod.equals("cash") && !paymentMethod.equals("card") && !paymentMethod.equals("bank")) {
            throw new IllegalArgumentException("Unsupported payment method: " + paymentMethod);
        }

        // If it's card payment, require card details
        if (paymentMethod.equals("card") && (request == null || request.getCardDetails() == null)) {
            throw new IllegalArgumentException("cardDetails is required for card payment");
        }

        // Normalize card details (frontend may send expiryDate or month/year)
        if (paymentMethod.equals("card")) {
            var cd = request.getCardDetails();
            if (cd != null && (cd.getExpiry() == null || cd.getExpiry().isBlank())) {
                String mm = cd.getExpiryMonth();
                String yy = cd.getExpiryYear();
                if (mm != null && yy != null && !mm.isBlank() && !yy.isBlank()) {
                    // Normalize year to YY
                    String yy2 = yy.length() == 4 ? yy.substring(2) : yy;
                    cd.setExpiry(String.format("%02d/%s", Integer.parseInt(mm), yy2));
                }
            }
        }

        OffsetDateTime now = OffsetDateTime.now();

        // Calculate total BEFORE saving the order (orders.total_price is NOT NULL)
        BigDecimal total = BigDecimal.ZERO;
        for (CartItemModel ci : items) {
            BigDecimal unit = ci.getBook().getPrice();
            total = total.add(unit.multiply(BigDecimal.valueOf(ci.getQuantity())));
        }

        OrderModel order = new OrderModel();
        order.setUser(user);
        order.setOrderDate(now);
        order.setTotalPrice(total);

        order.setOrderNumber(generateOrderNumber(user.getId(), now));
        order.setPaymentMethod(paymentMethod);
        order.setPaymentStatus("pending");

        // Admin-controlled lifecycle status should start as pending.
        order.setOrderStatus("pending");

        order.setCreatedAt(now);
        order.setUpdatedAt(now);

        // legacy status
        order.setStatus("Pending");

        // Save once with required fields set
        order = orderRepo.save(order);

        // Save billing address (optional)
        if (request != null && request.getBillingAddress() != null) {
            BillingAddressModel ba = new BillingAddressModel();
            ba.setOrder(order);
            ba.setUser(user);
            ba.setEmail(request.getBillingAddress().getEmail());
            ba.setFirstName(request.getBillingAddress().getFirstName());
            ba.setLastName(request.getBillingAddress().getLastName());
            ba.setAddress(request.getBillingAddress().getAddress());
            ba.setCity(request.getBillingAddress().getCity());
            ba.setState(request.getBillingAddress().getState());
            ba.setZipCode(request.getBillingAddress().getZipCode());
            ba.setCountry(request.getBillingAddress().getCountry());
            billingAddressRepo.save(ba);
        }

        // Create order items
        for (CartItemModel ci : items) {
            OrderItemModel oi = new OrderItemModel();
            oi.setOrder(order);
            oi.setBook(ci.getBook());
            oi.setQuantity(ci.getQuantity());
            oi.setUnitPrice(ci.getBook().getPrice());
            orderItemRepo.save(oi);
        }

        // Create payment record
        PaymentModel payment = paymentRepo.findByOrder(order).orElse(new PaymentModel());
        payment.setOrder(order);
        payment.setMethod(paymentMethod.toUpperCase());

        // This project currently treats payments as completed immediately.
        payment.setStatus("Completed");
        payment.setPaidAt(now);
        order.setPaymentStatus("completed");
        paymentRepo.save(payment);

        // Do NOT force orderStatus to "completed" here. Admin will move it through
        // pending -> processing -> shipped -> delivered (or cancelled).
        order.setUpdatedAt(OffsetDateTime.now());
        order = orderRepo.save(order);

        // clear cart
        cartItemRepo.deleteAll(items);

        return order;
    }

    private String generateOrderNumber(Long userId, OffsetDateTime now) {
        String ts = now.format(ORDER_NUMBER_TS);
        int rnd = (int) (Math.random() * 9000) + 1000;
        return "ORD-" + ts + "-U" + userId + "-" + rnd;
    }

    @Override
    public List<OrderModel> getOrderHistory(String userEmail) {
        UserModel user = userRepo.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User not found"));
        return orderRepo.findHistoryWithItems(user);
    }

    @Override
    public OrderModel getById(Long id) {
        return orderRepo.findByIdWithItems(id)
                .orElseThrow(() -> new NotFoundException("Order not found"));
    }

    @Override
    public List<OrderModel> getAll() {
        return orderRepo.findAll();
    }

    @Override
    @Transactional
    public OrderModel updateOrderStatus(Long orderId, String newStatus) {
        if (newStatus == null || newStatus.isBlank()) {
            throw new IllegalArgumentException("orderStatus is required");
        }

        // Validate against allowed statuses using enum.
        OrderStatus parsed;
        try {
            parsed = OrderStatus.valueOf(newStatus.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid orderStatus. Allowed: pending, processing, shipped, delivered, cancelled");
        }

        OrderModel order = orderRepo.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));

        order.setOrderStatus(parsed.name().toLowerCase());
        order.setUpdatedAt(OffsetDateTime.now());

        // Optional: keep legacy field somewhat aligned for older clients
        if (parsed == OrderStatus.CANCELLED) {
            order.setStatus("Cancelled");
        }

        return orderRepo.save(order);
    }

    @Override
    @Transactional
    public void deleteOrder(Long orderId, String userEmail) {
        UserModel user = userRepo.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User not found"));

        OrderModel order = orderRepo.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found"));

        // Verify the order belongs to this user
        if (order.getUser() == null || order.getUser().getId() == null || !order.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You can only delete your own orders");
        }

        // Delete related records first (due to foreign key constraints)
        orderItemRepo.deleteAll(orderItemRepo.findByOrder(order));
        billingAddressRepo.findByOrder(order).ifPresent(billingAddressRepo::delete);
        paymentRepo.findByOrder(order).ifPresent(paymentRepo::delete);

        // Finally delete the order
        orderRepo.delete(order);
    }
}

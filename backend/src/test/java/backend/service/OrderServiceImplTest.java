package backend.service;

import backend.model.*;
import backend.repository.*;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

public class OrderServiceImplTest {

    @Test
    void placeOrder_happyPath() {
        UserRepository userRepo = Mockito.mock(UserRepository.class);
        CartRepository cartRepo = Mockito.mock(CartRepository.class);
        CartItemRepository cartItemRepo = Mockito.mock(CartItemRepository.class);
        OrderRepository orderRepo = Mockito.mock(OrderRepository.class);
        OrderItemRepository orderItemRepo = Mockito.mock(OrderItemRepository.class);
        BillingAddressRepository billingAddressRepo = Mockito.mock(BillingAddressRepository.class);
        PaymentRepository paymentRepo = Mockito.mock(PaymentRepository.class);

        UserModel user = new UserModel();
        user.setId(1L);
        user.setEmail("u@example.com");

        CartModel cart = new CartModel();
        cart.setId(10L);
        cart.setUser(user);

        BookModel book = new BookModel();
        book.setId(2L);
        book.setPrice(new BigDecimal("12.50"));

        CartItemModel ci = new CartItemModel();
        ci.setId(100L);
        ci.setCart(cart);
        ci.setBook(book);
        ci.setQuantity(2);

        when(userRepo.findByEmail("u@example.com")).thenReturn(Optional.of(user));
        when(cartRepo.findByUser(user)).thenReturn(Optional.of(cart));
        when(cartItemRepo.findByCart(cart)).thenReturn(Arrays.asList(ci));

        when(orderRepo.save(any(OrderModel.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderItemRepo.save(any(OrderItemModel.class))).thenAnswer(inv -> inv.getArgument(0));
        when(paymentRepo.findByOrder(any(OrderModel.class))).thenReturn(Optional.empty());
        when(paymentRepo.save(any(PaymentModel.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderService service = new OrderServiceImpl(
                userRepo,
                cartRepo,
                cartItemRepo,
                orderRepo,
                orderItemRepo,
                billingAddressRepo,
                paymentRepo
        );

        OrderModel order = service.placeOrder("u@example.com");
        assertNotNull(order);
        assertEquals("pending", order.getOrderStatus());
        assertEquals("completed", order.getPaymentStatus());
        assertEquals("Pending", order.getStatus());
        assertEquals(new BigDecimal("25.00"), order.getTotalPrice());
    }

    @Test
    void placeOrder_emptyCartThrows() {
        UserRepository userRepo = Mockito.mock(UserRepository.class);
        CartRepository cartRepo = Mockito.mock(CartRepository.class);
        CartItemRepository cartItemRepo = Mockito.mock(CartItemRepository.class);
        OrderRepository orderRepo = Mockito.mock(OrderRepository.class);
        OrderItemRepository orderItemRepo = Mockito.mock(OrderItemRepository.class);
        BillingAddressRepository billingAddressRepo = Mockito.mock(BillingAddressRepository.class);
        PaymentRepository paymentRepo = Mockito.mock(PaymentRepository.class);

        UserModel user = new UserModel();
        user.setId(1L);
        user.setEmail("u@example.com");

        CartModel cart = new CartModel();
        cart.setId(10L);
        cart.setUser(user);

        when(userRepo.findByEmail("u@example.com")).thenReturn(Optional.of(user));
        when(cartRepo.findByUser(user)).thenReturn(Optional.of(cart));
        when(cartItemRepo.findByCart(cart)).thenReturn(Collections.emptyList());

        OrderService service = new OrderServiceImpl(
                userRepo,
                cartRepo,
                cartItemRepo,
                orderRepo,
                orderItemRepo,
                billingAddressRepo,
                paymentRepo
        );

        assertThrows(IllegalStateException.class, () -> service.placeOrder("u@example.com"));
    }
}

package backend.service;

import backend.exception.NotFoundException;
import backend.model.OrderModel;
import backend.model.PaymentModel;
import backend.model.UserModel;
import backend.repository.OrderRepository;
import backend.repository.PaymentRepository;
import backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

public class PaymentServiceImplTest {

    @Test
    void cod_happyPath() {
        PaymentRepository paymentRepo = Mockito.mock(PaymentRepository.class);
        OrderRepository orderRepo = Mockito.mock(OrderRepository.class);
        UserRepository userRepo = Mockito.mock(UserRepository.class);

        UserModel user = new UserModel();
        user.setId(1L);
        user.setEmail("u@example.com");

        OrderModel order = new OrderModel();
        order.setId(55L);
        order.setUser(user);
        order.setStatus("Pending");
        order.setOrderStatus("pending");
        order.setPaymentStatus("pending");

        when(userRepo.findByEmail("u@example.com")).thenReturn(Optional.of(user));
        when(orderRepo.findById(55L)).thenReturn(Optional.of(order));
        when(paymentRepo.findByOrder(order)).thenReturn(Optional.empty());
        when(paymentRepo.save(any(PaymentModel.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderRepo.save(any(OrderModel.class))).thenAnswer(inv -> inv.getArgument(0));

        PaymentService service = new PaymentServiceImpl(paymentRepo, orderRepo, userRepo);
        PaymentModel payment = service.cashOnDelivery("u@example.com", 55L);

        assertNotNull(payment);
        assertEquals("COD", payment.getMethod());
        assertEquals("Completed", payment.getStatus());
        assertNotNull(payment.getPaidAt());

        // Payment completion should not imply shipping lifecycle completion
        assertEquals("completed", order.getPaymentStatus());
        assertEquals("pending", order.getOrderStatus());
        assertEquals("Pending", order.getStatus());
    }

    @Test
    void cod_throwsWhenOrderNotOwnedByUser() {
        PaymentRepository paymentRepo = Mockito.mock(PaymentRepository.class);
        OrderRepository orderRepo = Mockito.mock(OrderRepository.class);
        UserRepository userRepo = Mockito.mock(UserRepository.class);

        UserModel user = new UserModel(); user.setId(1L); user.setEmail("u@example.com");
        UserModel other = new UserModel(); other.setId(2L);
        OrderModel order = new OrderModel(); order.setId(55L); order.setUser(other);

        when(userRepo.findByEmail("u@example.com")).thenReturn(Optional.of(user));
        when(orderRepo.findById(55L)).thenReturn(Optional.of(order));

        PaymentService service = new PaymentServiceImpl(paymentRepo, orderRepo, userRepo);
        assertThrows(IllegalArgumentException.class, () -> service.cashOnDelivery("u@example.com", 55L));
    }

    @Test
    void cod_throwsWhenUserNotFound() {
        PaymentRepository paymentRepo = Mockito.mock(PaymentRepository.class);
        OrderRepository orderRepo = Mockito.mock(OrderRepository.class);
        UserRepository userRepo = Mockito.mock(UserRepository.class);

        when(userRepo.findByEmail("missing@example.com")).thenReturn(Optional.empty());
        PaymentService service = new PaymentServiceImpl(paymentRepo, orderRepo, userRepo);
        assertThrows(NotFoundException.class, () -> service.cashOnDelivery("missing@example.com", 1L));
    }
}

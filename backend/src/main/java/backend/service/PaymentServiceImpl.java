package backend.service;

import backend.exception.NotFoundException;
import backend.model.OrderModel;
import backend.model.PaymentModel;
import backend.model.UserModel;
import backend.repository.OrderRepository;
import backend.repository.PaymentRepository;
import backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Service
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepo;
    private final OrderRepository orderRepo;
    private final UserRepository userRepo;

    public PaymentServiceImpl(PaymentRepository paymentRepo, OrderRepository orderRepo, UserRepository userRepo) {
        this.paymentRepo = paymentRepo;
        this.orderRepo = orderRepo;
        this.userRepo = userRepo;
    }

    @Override
    @Transactional
    public PaymentModel cashOnDelivery(String userEmail, Long orderId) {
        UserModel user = userRepo.findByEmail(userEmail).orElseThrow(() -> new NotFoundException("User not found"));
        OrderModel order = orderRepo.findById(orderId).orElseThrow(() -> new NotFoundException("Order not found"));
        if (!order.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Order does not belong to user");
        }
        // Create or update payment record
        PaymentModel payment = paymentRepo.findByOrder(order).orElse(new PaymentModel());
        payment.setOrder(order);
        payment.setMethod("COD");
        payment.setStatus("Completed");
        payment.setPaidAt(OffsetDateTime.now());
        payment = paymentRepo.save(payment);

        // Payment completion should NOT mark the shipping lifecycle as completed.
        // Ensure paymentStatus is reflected; keep/initialize orderStatus as pending.
        order.setPaymentStatus("completed");
        if (order.getOrderStatus() == null || order.getOrderStatus().isBlank()) {
            order.setOrderStatus("pending");
        }
        order.setUpdatedAt(OffsetDateTime.now());
        orderRepo.save(order);

        return payment;
    }
}

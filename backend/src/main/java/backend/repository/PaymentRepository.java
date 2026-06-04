package backend.repository;

import backend.model.PaymentModel;
import backend.model.OrderModel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<PaymentModel, Long> {
    Optional<PaymentModel> findByOrder(OrderModel order);
}


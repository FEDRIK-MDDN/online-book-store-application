package backend.repository;

import backend.model.BillingAddressModel;
import backend.model.OrderModel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BillingAddressRepository extends JpaRepository<BillingAddressModel, Long> {
    Optional<BillingAddressModel> findByOrder(OrderModel order);
}

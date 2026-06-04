package backend.repository;

import backend.model.OrderItemModel;
import backend.model.OrderModel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItemModel, Long> {
    List<OrderItemModel> findByOrder(OrderModel order);
}


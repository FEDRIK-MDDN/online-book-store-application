package backend.service;

import backend.dto.OrderPlaceRequest;
import backend.model.OrderModel;

import java.util.List;

public interface OrderService {
    OrderModel placeOrder(String userEmail);

    OrderModel placeOrder(String userEmail, OrderPlaceRequest request);

    List<OrderModel> getOrderHistory(String userEmail);
    OrderModel getById(Long id);
    List<OrderModel> getAll(); // added method to list all orders for admin

    OrderModel updateOrderStatus(Long orderId, String newStatus);

    void deleteOrder(Long orderId, String userEmail);
}

package backend.controller;

import backend.dto.OrderPlaceRequest;
import backend.model.OrderModel;
import backend.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    private final OrderService service;

    public OrderController(OrderService service) {
        this.service = service;
    }

    @PostMapping("/place")
    @PreAuthorize("isAuthenticated()")
    public OrderModel placeOrder(@RequestBody @Valid OrderPlaceRequest request,
                                 Authentication authentication) {
        String userEmail = authentication.getName();
        return service.placeOrder(userEmail, request);
    }

    @GetMapping("/history")
    @PreAuthorize("isAuthenticated()")
    public List<OrderModel> history(Authentication authentication) {
        String userEmail = authentication.getName();
        return service.getOrderHistory(userEmail);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public OrderModel getOne(@PathVariable Long id) {
        return service.getById(id);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public void deleteOrder(@PathVariable Long id, Authentication authentication) {
        String userEmail = authentication.getName();
        service.deleteOrder(id, userEmail);
    }
}

package backend.controller;

import backend.model.CartModel;
import backend.service.CartService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/cart")
@CrossOrigin(origins = "*")
public class CartController {

    private final CartService service;

    public CartController(CartService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public CartModel getCart(Authentication authentication) {
        String userEmail = authentication.getName();
        return service.getOrCreateCartForUser(userEmail);
    }

    @PostMapping("/add")
    @PreAuthorize("isAuthenticated()")
    public CartModel addToCart(@RequestParam("bookId") Long bookId,
                               @RequestParam("quantity") int quantity,
                               Authentication authentication) {
        String userEmail = authentication.getName();
        return service.addToCart(userEmail, bookId, quantity);
    }

    @PostMapping("/update")
    @PreAuthorize("isAuthenticated()")
    public CartModel updateItem(@RequestParam("bookId") Long bookId,
                                @RequestParam("quantity") int quantity,
                                Authentication authentication) {
        String userEmail = authentication.getName();
        return service.updateItem(userEmail, bookId, quantity);
    }

    @DeleteMapping("/remove")
    @PreAuthorize("isAuthenticated()")
    public CartModel removeFromCart(@RequestParam("bookId") Long bookId,
                                    Authentication authentication) {
        String userEmail = authentication.getName();
        return service.removeFromCart(userEmail, bookId);
    }

    @DeleteMapping("/clear")
    @PreAuthorize("isAuthenticated()")
    public Map<String, Object> clear(Authentication authentication) {
        String userEmail = authentication.getName();
        service.clearCart(userEmail);
        return Map.of(
                "message", "Cart cleared successfully",
                "success", true
        );
    }
}

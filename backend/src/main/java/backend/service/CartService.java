package backend.service;

import backend.model.CartModel;

public interface CartService {
    CartModel getOrCreateCartForUser(String userEmail);
    CartModel addToCart(String userEmail, Long bookId, int quantity);
    CartModel updateItem(String userEmail, Long bookId, int quantity);
    CartModel removeFromCart(String userEmail, Long bookId);
    void clearCart(String userEmail);
}


package backend.service;

import backend.exception.NotFoundException;
import backend.model.*;
import backend.repository.BookRepository;
import backend.repository.CartItemRepository;
import backend.repository.CartRepository;
import backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepo;
    private final CartItemRepository itemRepo;
    private final UserRepository userRepo;
    private final BookRepository bookRepo;

    public CartServiceImpl(CartRepository cartRepo, CartItemRepository itemRepo, UserRepository userRepo, BookRepository bookRepo) {
        this.cartRepo = cartRepo;
        this.itemRepo = itemRepo;
        this.userRepo = userRepo;
        this.bookRepo = bookRepo;
    }

    @Override
    @Transactional
    public CartModel getOrCreateCartForUser(String userEmail) {
        UserModel user = userRepo.findByEmail(userEmail).orElseThrow(() -> new NotFoundException("User not found"));

        return cartRepo.findByUserWithItems(user).orElseGet(() -> {
            CartModel cart = new CartModel();
            cart.setUser(user);
            return cartRepo.save(cart);
        });
    }

    @Override
    @Transactional
    public CartModel addToCart(String userEmail, Long bookId, int quantity) {
        if (quantity <= 0) throw new IllegalArgumentException("Quantity must be positive");
        CartModel cart = getOrCreateCartForUser(userEmail);
        BookModel book = bookRepo.findById(bookId).orElseThrow(() -> new NotFoundException("Book not found"));
        CartItemModel item = itemRepo.findByCartAndBook(cart, book).orElse(null);
        if (item == null) {
            item = new CartItemModel();
            item.setCart(cart);
            item.setBook(book);
            item.setQuantity(quantity);
        } else {
            item.setQuantity(item.getQuantity() + quantity);
        }
        itemRepo.save(item);
        return cart;
    }

    @Override
    @Transactional
    public CartModel updateItem(String userEmail, Long bookId, int quantity) {
        if (quantity <= 0) throw new IllegalArgumentException("Quantity must be positive");
        CartModel cart = getOrCreateCartForUser(userEmail);
        BookModel book = bookRepo.findById(bookId).orElseThrow(() -> new NotFoundException("Book not found"));
        CartItemModel item = itemRepo.findByCartAndBook(cart, book).orElseThrow(() -> new NotFoundException("Cart item not found"));
        item.setQuantity(quantity);
        itemRepo.save(item);
        return cart;
    }

    @Override
    @Transactional
    public CartModel removeFromCart(String userEmail, Long bookId) {
        CartModel cart = getOrCreateCartForUser(userEmail);

        int deleted = itemRepo.deleteByCartIdAndBookId(cart.getId(), bookId);
        if (deleted == 0) {
            throw new NotFoundException("Cart item not found");
        }

        // Return an updated cart with items + books fetched to avoid lazy-loading issues in JSON serialization
        return cartRepo.findByUserWithItems(cart.getUser()).orElse(cart);
    }

    @Override
    @Transactional
    public void clearCart(String userEmail) {
        CartModel cart = getOrCreateCartForUser(userEmail);

        // Delete by cart ID to avoid any entity loading/lookup
        itemRepo.deleteByCartId(cart.getId());

        // Keep the persistence context consistent
        cart.getItems().clear();
        cartRepo.save(cart);
    }
}

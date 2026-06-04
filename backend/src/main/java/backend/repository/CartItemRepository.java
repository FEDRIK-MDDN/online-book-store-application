package backend.repository;

import backend.model.CartItemModel;
import backend.model.CartModel;
import backend.model.BookModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItemModel, Long> {
    List<CartItemModel> findByCart(CartModel cart);
    Optional<CartItemModel> findByCartAndBook(CartModel cart, BookModel book);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from CartItemModel ci where ci.cart.id = :cartId")
    void deleteByCartId(@Param("cartId") Long cartId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from CartItemModel ci where ci.cart.id = :cartId and ci.book.id = :bookId")
    int deleteByCartIdAndBookId(@Param("cartId") Long cartId, @Param("bookId") Long bookId);
}

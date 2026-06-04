package backend.repository;

import backend.model.CartModel;
import backend.model.UserModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CartRepository extends JpaRepository<CartModel, Long> {
    Optional<CartModel> findByUser(UserModel user);

    @Query("select distinct c from CartModel c left join fetch c.items i left join fetch i.book where c.user = :user")
    Optional<CartModel> findByUserWithItems(@Param("user") UserModel user);

    void deleteByUser(UserModel user);
}

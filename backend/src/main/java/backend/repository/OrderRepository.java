package backend.repository;

import backend.model.OrderModel;
import backend.model.UserModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<OrderModel, Long> {
    @Query("select distinct o from OrderModel o " +
           "left join fetch o.items i " +
           "left join fetch i.book " +
           "where o.user = :user " +
           "order by o.orderDate desc")
    List<OrderModel> findHistoryWithItems(@Param("user") UserModel user);

    @Query("select distinct o from OrderModel o " +
           "left join fetch o.items i " +
           "left join fetch i.book " +
           "where o.id = :id")
    Optional<OrderModel> findByIdWithItems(@Param("id") Long id);

    List<OrderModel> findByUserOrderByOrderDateDesc(UserModel user);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update OrderModel o set o.user = null where o.user.id = :userId")
    int clearUserReference(@Param("userId") Long userId);
}

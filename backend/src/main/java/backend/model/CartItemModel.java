package backend.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "cart_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CartItemModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "cart_id", nullable = false)
    @JsonBackReference // complements @JsonManagedReference in CartModel.items
    private CartModel cart;

    @ManyToOne(optional = false)
    @JoinColumn(name = "book_id", nullable = false)
    private BookModel book;

    @NotNull
    @Min(1)
    @Column(nullable = false)
    private Integer quantity;
}

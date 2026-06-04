package backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;

@Entity
@Table(name = "books")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BookModel {

    private static final Logger log = LoggerFactory.getLogger(BookModel.class);

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String title;

    @NotBlank
    @Column(nullable = false)
    private String author;

    // Simple category string for now; later can be normalized to Category entity
    @NotBlank
    @Column(nullable = false)
    private String category;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = true)
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @NotNull
    @Min(0)
    @Column(nullable = false)
    private Integer stock;

    @Column(length = 4000)
    private String description;

    @Column(name = "image_url")
    private String imageUrl;

    // --- Admin columns ---
    @Column(nullable = false)
    private Boolean available;

    public enum BookStatus {
        ACTIVE,
        OUT_OF_STOCK
    }

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private BookStatus status;

    @PrePersist
    private void setDefaultsOnInsert() {
        boolean hasStock = this.stock != null && this.stock > 0;
        log.debug("[BookModel@PrePersist] BEFORE id={}, stock={}, available={}, status={}", id, stock, available, status);
        if (!hasStock) {
            // No stock: default unavailable and OUT_OF_STOCK
            if (this.available == null) this.available = false;
            this.status = BookStatus.OUT_OF_STOCK;
        } else {
            // Has stock: default to available=true & ACTIVE if unset
            if (this.available == null) this.available = true;
            if (this.status == null) this.status = BookStatus.ACTIVE;
        }
        log.debug("[BookModel@PrePersist] AFTER  id={}, stock={}, available={}, status={}", id, stock, available, status);
    }

    @PreUpdate
    private void deriveOnlyWhenUnsetOnUpdate() {
        boolean hasStock = this.stock != null && this.stock > 0;
        log.debug("[BookModel@PreUpdate] BEFORE id={}, stock={}, available={}, status={}", id, stock, available, status);
        // Only set defaults when null; do not override explicitly set values
        if (this.available == null) {
            this.available = hasStock; // default: available follows stock presence
        }
        if (this.status == null) {
            this.status = hasStock ? BookStatus.ACTIVE : BookStatus.OUT_OF_STOCK;
        }
        log.debug("[BookModel@PreUpdate] AFTER  id={}, stock={}, available={}, status={}", id, stock, available, status);
    }
}

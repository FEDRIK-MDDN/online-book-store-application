package backend.repository;

import backend.model.ReviewModel;
import backend.model.BookModel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<ReviewModel, Long> {
    List<ReviewModel> findByBookOrderByCreatedAtDesc(BookModel book);
    Page<ReviewModel> findByBookOrderByCreatedAtDesc(BookModel book, Pageable pageable);
}


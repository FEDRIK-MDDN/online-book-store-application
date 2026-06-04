package backend.repository;

import backend.model.BookModel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookRepository extends JpaRepository<BookModel, Long> {
    List<BookModel> findByCategoryIgnoreCase(String category);
    List<BookModel> findByAuthorIgnoreCase(String author);
    List<BookModel> findByTitleContainingIgnoreCase(String titlePart);
    // Paged variants
    Page<BookModel> findAll(Pageable pageable);
    Page<BookModel> findByCategoryIgnoreCase(String category, Pageable pageable);
    Page<BookModel> findByAuthorIgnoreCase(String author, Pageable pageable);
    Page<BookModel> findByTitleContainingIgnoreCase(String titlePart, Pageable pageable);
}

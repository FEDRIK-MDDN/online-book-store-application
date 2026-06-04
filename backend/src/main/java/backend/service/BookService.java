package backend.service;

import backend.model.BookModel;
import org.springframework.data.domain.Page;

import java.util.List;

public interface BookService {
    BookModel create(BookModel book);
    BookModel getById(Long id);
    List<BookModel> getAll();
    Page<BookModel> getAllPaged(int page, int size, String sortBy, String direction);
    BookModel update(Long id, BookModel book);
    void delete(Long id);
    List<BookModel> findByCategory(String category);
    Page<BookModel> findByCategoryPaged(String category, int page, int size, String sortBy, String direction);
    List<BookModel> findByAuthor(String author);
    Page<BookModel> findByAuthorPaged(String author, int page, int size, String sortBy, String direction);
    List<BookModel> searchByTitle(String query);
    Page<BookModel> searchByTitlePaged(String query, int page, int size, String sortBy, String direction);
}

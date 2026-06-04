package backend.service;

import backend.exception.NotFoundException;
import backend.model.BookModel;
import backend.repository.BookRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BookServiceImpl implements BookService {

    private final BookRepository repo;

    public BookServiceImpl(BookRepository repo) {
        this.repo = repo;
    }

    private PageRequest pr(int page, int size, String sortBy, String direction) {
        Sort sort = ("desc".equalsIgnoreCase(direction) ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending());
        return PageRequest.of(page, size, sort);
    }

    @Override
    public BookModel create(BookModel book) {
        return repo.save(book);
    }

    @Override
    public BookModel getById(Long id) {
        return repo.findById(id).orElseThrow(() -> new NotFoundException("Book not found"));
    }

    @Override
    public List<BookModel> getAll() {
        return repo.findAll();
    }

    @Override
    public Page<BookModel> getAllPaged(int page, int size, String sortBy, String direction) {
        return repo.findAll(pr(page, size, sortBy, direction));
    }

    @Override
    public BookModel update(Long id, BookModel book) {
        BookModel existing = repo.findById(id).orElseThrow(() -> new NotFoundException("Book not found"));
        existing.setTitle(book.getTitle());
        existing.setAuthor(book.getAuthor());
        existing.setCategory(book.getCategory());
        existing.setPrice(book.getPrice());
        existing.setStock(book.getStock());
        existing.setDescription(book.getDescription());
        existing.setImageUrl(book.getImageUrl());
        // Persist admin-set availability and status
        existing.setAvailable(book.getAvailable());
        existing.setStatus(book.getStatus());
        return repo.save(existing);
    }

    @Override
    public void delete(Long id) {
        if (!repo.existsById(id)) throw new NotFoundException("Book not found");
        repo.deleteById(id);
    }

    @Override
    public List<BookModel> findByCategory(String category) {
        return repo.findByCategoryIgnoreCase(category);
    }

    @Override
    public Page<BookModel> findByCategoryPaged(String category, int page, int size, String sortBy, String direction) {
        return repo.findByCategoryIgnoreCase(category, pr(page, size, sortBy, direction));
    }

    @Override
    public List<BookModel> findByAuthor(String author) {
        return repo.findByAuthorIgnoreCase(author);
    }

    @Override
    public Page<BookModel> findByAuthorPaged(String author, int page, int size, String sortBy, String direction) {
        return repo.findByAuthorIgnoreCase(author, pr(page, size, sortBy, direction));
    }

    @Override
    public List<BookModel> searchByTitle(String query) {
        return repo.findByTitleContainingIgnoreCase(query);
    }

    @Override
    public Page<BookModel> searchByTitlePaged(String query, int page, int size, String sortBy, String direction) {
        return repo.findByTitleContainingIgnoreCase(query, pr(page, size, sortBy, direction));
    }
}

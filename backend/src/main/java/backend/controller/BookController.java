package backend.controller;

import backend.model.BookModel;
import backend.service.BookService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/books")
@Validated
public class BookController {

    private final BookService service;

    public BookController(BookService service) {
        this.service = service;
    }

    @GetMapping
    public List<BookModel> all() {
        return service.getAll();
    }

    @GetMapping("/paged")
    public Page<BookModel> allPaged(@RequestParam(defaultValue = "0") int page,
                                    @RequestParam(defaultValue = "10") int size,
                                    @RequestParam(defaultValue = "id") String sortBy,
                                    @RequestParam(defaultValue = "asc") String direction) {
        return service.getAllPaged(page, size, sortBy, direction);
    }

    @GetMapping("/{id}")
    public BookModel getOne(@PathVariable Long id) {
        return service.getById(id);
    }

    @GetMapping("/category/{category}")
    public List<BookModel> byCategory(@PathVariable String category) {
        return service.findByCategory(category);
    }

    @GetMapping("/category/{category}/paged")
    public Page<BookModel> byCategoryPaged(@PathVariable String category,
                                           @RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "10") int size,
                                           @RequestParam(defaultValue = "id") String sortBy,
                                           @RequestParam(defaultValue = "asc") String direction) {
        return service.findByCategoryPaged(category, page, size, sortBy, direction);
    }

    @GetMapping("/author/{author}")
    public List<BookModel> byAuthor(@PathVariable String author) {
        return service.findByAuthor(author);
    }

    @GetMapping("/author/{author}/paged")
    public Page<BookModel> byAuthorPaged(@PathVariable String author,
                                         @RequestParam(defaultValue = "0") int page,
                                         @RequestParam(defaultValue = "10") int size,
                                         @RequestParam(defaultValue = "id") String sortBy,
                                         @RequestParam(defaultValue = "asc") String direction) {
        return service.findByAuthorPaged(author, page, size, sortBy, direction);
    }

    @GetMapping("/search")
    public List<BookModel> search(@RequestParam("q") String query) {
        return service.searchByTitle(query);
    }

    @GetMapping("/search/paged")
    public Page<BookModel> searchPaged(@RequestParam("q") String query,
                                       @RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "10") int size,
                                       @RequestParam(defaultValue = "id") String sortBy,
                                       @RequestParam(defaultValue = "asc") String direction) {
        return service.searchByTitlePaged(query, page, size, sortBy, direction);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public BookModel create(@RequestBody @Valid BookModel book) {
        return service.create(book);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public BookModel update(@PathVariable Long id, @RequestBody @Valid BookModel book) {
        return service.update(id, book);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public String delete(@PathVariable Long id) {
        service.delete(id);
        return "Book deleted successfully!";
    }
}

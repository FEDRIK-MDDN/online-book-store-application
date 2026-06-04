package backend.controller;

import backend.model.CategoryModel;
import backend.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/categories")
@Validated
public class CategoryController {

    private final CategoryService service;

    public CategoryController(CategoryService service) {
        this.service = service;
    }

    @GetMapping
    public List<CategoryModel> all() {
        return service.getAll();
    }

    @GetMapping("/paged")
    public Page<CategoryModel> allPaged(@RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "10") int size) {
        return service.getAllPaged(page, size);
    }

    @GetMapping("/{id}")
    public CategoryModel getOne(@PathVariable Long id) {
        return service.getById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public CategoryModel create(@RequestBody @Valid CategoryModel category) {
        return service.create(category);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public CategoryModel update(@PathVariable Long id, @RequestBody @Valid CategoryModel category) {
        return service.update(id, category);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public String delete(@PathVariable Long id) {
        service.delete(id);
        return "Category deleted successfully!";
    }
}

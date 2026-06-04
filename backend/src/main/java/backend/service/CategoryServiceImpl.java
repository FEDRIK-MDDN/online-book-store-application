package backend.service;

import backend.exception.NotFoundException;
import backend.model.CategoryModel;
import backend.repository.CategoryRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository repo;

    public CategoryServiceImpl(CategoryRepository repo) {
        this.repo = repo;
    }

    @Override
    public CategoryModel create(CategoryModel category) {
        repo.findByNameIgnoreCase(category.getName()).ifPresent(c -> { throw new IllegalArgumentException("Category already exists"); });
        return repo.save(category);
    }

    @Override
    public CategoryModel getById(Long id) {
        return repo.findById(id).orElseThrow(() -> new NotFoundException("Category not found"));
    }

    @Override
    public List<CategoryModel> getAll() {
        return repo.findAll();
    }

    @Override
    public Page<CategoryModel> getAllPaged(int page, int size) {
        return repo.findAll(PageRequest.of(page, size));
    }

    @Override
    public CategoryModel update(Long id, CategoryModel category) {
        CategoryModel existing = repo.findById(id).orElseThrow(() -> new NotFoundException("Category not found"));
        existing.setName(category.getName());
        existing.setDescription(category.getDescription());
        return repo.save(existing);
    }

    @Override
    public void delete(Long id) {
        if (!repo.existsById(id)) throw new NotFoundException("Category not found");
        repo.deleteById(id);
    }
}

package backend.service;

import backend.model.CategoryModel;
import org.springframework.data.domain.Page;

import java.util.List;

public interface CategoryService {
    CategoryModel create(CategoryModel category);
    CategoryModel getById(Long id);
    List<CategoryModel> getAll();
    Page<CategoryModel> getAllPaged(int page, int size);
    CategoryModel update(Long id, CategoryModel category);
    void delete(Long id);
}

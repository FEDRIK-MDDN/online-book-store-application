package backend.service;

import backend.model.ReviewModel;
import org.springframework.data.domain.Page;

import java.util.List;

public interface ReviewService {
    ReviewModel addReview(String userEmail, Long bookId, int rating, String comment);
    List<ReviewModel> getReviewsForBook(Long bookId);
    Page<ReviewModel> getReviewsForBookPaged(Long bookId, int page, int size);
}


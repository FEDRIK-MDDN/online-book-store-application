package backend.controller;

import backend.dto.ReviewRequest;
import backend.model.ReviewModel;
import backend.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reviews")
public class ReviewController {

    private final ReviewService service;

    public ReviewController(ReviewService service) {
        this.service = service;
    }

    @PostMapping
    public ReviewModel addReview(@RequestBody @Valid ReviewRequest request) {
        return service.addReview(request.getEmail(), request.getBookId(), request.getRating(), request.getComment());
    }

    @GetMapping("/book/{bookId}")
    public List<ReviewModel> getByBook(@PathVariable Long bookId) {
        return service.getReviewsForBook(bookId);
    }

    @GetMapping("/book/{bookId}/paged")
    public Page<ReviewModel> getByBookPaged(@PathVariable Long bookId,
                                            @RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "10") int size) {
        return service.getReviewsForBookPaged(bookId, page, size);
    }
}


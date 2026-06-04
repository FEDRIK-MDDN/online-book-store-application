package backend.service;

import backend.exception.NotFoundException;
import backend.model.BookModel;
import backend.model.ReviewModel;
import backend.model.UserModel;
import backend.repository.BookRepository;
import backend.repository.ReviewRepository;
import backend.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;

@Service
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepo;
    private final UserRepository userRepo;
    private final BookRepository bookRepo;

    public ReviewServiceImpl(ReviewRepository reviewRepo, UserRepository userRepo, BookRepository bookRepo) {
        this.reviewRepo = reviewRepo;
        this.userRepo = userRepo;
        this.bookRepo = bookRepo;
    }

    @Override
    public ReviewModel addReview(String userEmail, Long bookId, int rating, String comment) {
        UserModel user = userRepo.findByEmail(userEmail).orElseThrow(() -> new NotFoundException("User not found"));
        BookModel book = bookRepo.findById(bookId).orElseThrow(() -> new NotFoundException("Book not found"));
        ReviewModel review = new ReviewModel();
        review.setUser(user);
        review.setBook(book);
        review.setRating(rating);
        review.setComment(comment);
        review.setCreatedAt(OffsetDateTime.now());
        return reviewRepo.save(review);
    }

    @Override
    public List<ReviewModel> getReviewsForBook(Long bookId) {
        BookModel book = bookRepo.findById(bookId).orElseThrow(() -> new NotFoundException("Book not found"));
        return reviewRepo.findByBookOrderByCreatedAtDesc(book);
    }

    @Override
    public Page<ReviewModel> getReviewsForBookPaged(Long bookId, int page, int size) {
        BookModel book = bookRepo.findById(bookId).orElseThrow(() -> new NotFoundException("Book not found"));
        return reviewRepo.findByBookOrderByCreatedAtDesc(book, PageRequest.of(page, size));
    }
}


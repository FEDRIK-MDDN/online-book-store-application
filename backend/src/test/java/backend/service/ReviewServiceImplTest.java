package backend.service;

import backend.exception.NotFoundException;
import backend.model.BookModel;
import backend.model.ReviewModel;
import backend.model.UserModel;
import backend.repository.BookRepository;
import backend.repository.ReviewRepository;
import backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

public class ReviewServiceImplTest {

    @Test
    void addReview_happyPath() {
        ReviewRepository reviewRepo = Mockito.mock(ReviewRepository.class);
        UserRepository userRepo = Mockito.mock(UserRepository.class);
        BookRepository bookRepo = Mockito.mock(BookRepository.class);

        UserModel user = new UserModel(); user.setId(1L); user.setEmail("u@example.com");
        BookModel book = new BookModel(); book.setId(2L);
        when(userRepo.findByEmail("u@example.com")).thenReturn(Optional.of(user));
        when(bookRepo.findById(2L)).thenReturn(Optional.of(book));
        when(reviewRepo.save(any(ReviewModel.class))).thenAnswer(inv -> inv.getArgument(0));

        ReviewService service = new ReviewServiceImpl(reviewRepo, userRepo, bookRepo);
        ReviewModel saved = service.addReview("u@example.com", 2L, 5, "Great book");
        assertNotNull(saved);
        assertEquals(5, saved.getRating());
        assertEquals("Great book", saved.getComment());
        assertEquals(book, saved.getBook());
        assertEquals(user, saved.getUser());
        assertNotNull(saved.getCreatedAt());
    }

    @Test
    void getReviewsForBook_returnsList() {
        ReviewRepository reviewRepo = Mockito.mock(ReviewRepository.class);
        UserRepository userRepo = Mockito.mock(UserRepository.class);
        BookRepository bookRepo = Mockito.mock(BookRepository.class);

        BookModel book = new BookModel(); book.setId(3L);
        when(bookRepo.findById(3L)).thenReturn(Optional.of(book));
        when(reviewRepo.findByBookOrderByCreatedAtDesc(book)).thenReturn(Collections.emptyList());

        ReviewService service = new ReviewServiceImpl(reviewRepo, userRepo, bookRepo);
        assertNotNull(service.getReviewsForBook(3L));
    }

    @Test
    void addReview_throwsWhenUserNotFound() {
        ReviewRepository reviewRepo = Mockito.mock(ReviewRepository.class);
        UserRepository userRepo = Mockito.mock(UserRepository.class);
        BookRepository bookRepo = Mockito.mock(BookRepository.class);
        when(userRepo.findByEmail("missing@example.com")).thenReturn(Optional.empty());
        ReviewService service = new ReviewServiceImpl(reviewRepo, userRepo, bookRepo);
        assertThrows(NotFoundException.class, () -> service.addReview("missing@example.com", 1L, 4, "ok"));
    }
}


package backend.service;

import backend.model.PaymentModel;

public interface PaymentService {
    PaymentModel cashOnDelivery(String userEmail, Long orderId);
}


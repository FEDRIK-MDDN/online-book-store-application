package backend.controller;

import backend.dto.PaymentRequest;
import backend.model.PaymentModel;
import backend.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/payments")
public class PaymentController {

    private final PaymentService service;

    public PaymentController(PaymentService service) {
        this.service = service;
    }

    @PostMapping("/cod")
    public PaymentModel cod(@RequestBody @Valid PaymentRequest request) {
        return service.cashOnDelivery(request.getEmail(), request.getOrderId());
    }
}


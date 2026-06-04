package backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OrderPlaceRequest {

    @NotBlank
    private String paymentMethod; // "card" | "cash"

    @Valid
    private BillingAddressDto billingAddress;

    @Valid
    private CardDetailsDto cardDetails;
}


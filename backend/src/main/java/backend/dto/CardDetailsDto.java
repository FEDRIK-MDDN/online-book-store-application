package backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class CardDetailsDto {

    @NotBlank
    @JsonAlias({"cardholderName", "nameOnCard", "name"})
    private String cardHolderName;

    // Accept multiple possible key names from frontend
    @NotBlank
    @JsonAlias({"number"})
    private String cardNumber;

    /**
     * Accept either a single expiry string (MM/YY) or month+year fields from the frontend.
     * If expiry is not provided, it will be derived from month/year by the service layer.
     */
    @JsonAlias({"expiryDate"})
    @Pattern(regexp = "^(0[1-9]|1[0-2])/[0-9]{2}$", message = "expiry must be MM/YY")
    private String expiry;

    @JsonAlias({"expirationMonth", "expiryMonth"})
    private String expiryMonth;

    @JsonAlias({"expirationYear", "expiryYear"})
    private String expiryYear;

    @NotBlank
    @JsonAlias({"cvc", "securityCode"})
    @Pattern(regexp = "^[0-9]{3,4}$", message = "cvv must be 3 or 4 digits")
    private String cvv;
}

package br.com.nucleo.api.finance.controller;

import br.com.nucleo.api.finance.dto.CreateFinancialCreditCardRequest;
import br.com.nucleo.api.finance.dto.FinancialCreditCardResponse;
import br.com.nucleo.api.finance.dto.UpdateFinancialCreditCardRequest;
import br.com.nucleo.api.finance.service.FinancialCreditCardService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/finance/credit-cards")
public class FinancialCreditCardController {

    private final FinancialCreditCardService cardService;

    public FinancialCreditCardController(
            FinancialCreditCardService cardService
    ) {
        this.cardService = cardService;
    }

    @PostMapping
    public ResponseEntity<FinancialCreditCardResponse> create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody
            CreateFinancialCreditCardRequest request
    ) {
        FinancialCreditCardResponse response =
                cardService.create(userId(jwt), request);

        return ResponseEntity
                .created(
                        URI.create(
                                "/api/finance/credit-cards/"
                                        + response.id()
                        )
                )
                .body(response);
    }

    @GetMapping
    public List<FinancialCreditCardResponse> list(
            @AuthenticationPrincipal Jwt jwt
    ) {
        return cardService.list(userId(jwt));
    }

    @GetMapping("/{cardId}")
    public FinancialCreditCardResponse findById(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID cardId
    ) {
        return cardService.findById(userId(jwt), cardId);
    }

    @PutMapping("/{cardId}")
    public FinancialCreditCardResponse update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID cardId,
            @Valid @RequestBody
            UpdateFinancialCreditCardRequest request
    ) {
        return cardService.update(
                userId(jwt),
                cardId,
                request
        );
    }

    @PatchMapping("/{cardId}/activate")
    public FinancialCreditCardResponse activate(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID cardId
    ) {
        return cardService.activate(userId(jwt), cardId);
    }

    @PatchMapping("/{cardId}/deactivate")
    public FinancialCreditCardResponse deactivate(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID cardId
    ) {
        return cardService.deactivate(userId(jwt), cardId);
    }

    @DeleteMapping("/{cardId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID cardId
    ) {
        cardService.delete(userId(jwt), cardId);
        return ResponseEntity.noContent().build();
    }

    private UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}
package br.com.nucleo.api.finance.controller;

import br.com.nucleo.api.finance.dto.CreateFinancialCreditCardPurchaseRequest;
import br.com.nucleo.api.finance.dto.FinancialCreditCardPurchaseResponse;
import br.com.nucleo.api.finance.dto.UpdateFinancialCreditCardPurchaseRequest;
import br.com.nucleo.api.finance.service.FinancialCreditCardPurchaseService;
import jakarta.validation.Valid;
import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/finance/credit-card-purchases")
public class FinancialCreditCardPurchaseController {

    private final FinancialCreditCardPurchaseService purchaseService;

    public FinancialCreditCardPurchaseController(
            FinancialCreditCardPurchaseService purchaseService
    ) {
        this.purchaseService = purchaseService;
    }

    @PostMapping
    public ResponseEntity<FinancialCreditCardPurchaseResponse> create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody
            CreateFinancialCreditCardPurchaseRequest request
    ) {
        FinancialCreditCardPurchaseResponse response =
                purchaseService.create(
                        userId(jwt),
                        request
                );

        return ResponseEntity
                .created(
                        URI.create(
                                "/api/finance/credit-card-purchases/"
                                        + response.id()
                        )
                )
                .body(response);
    }

    @GetMapping
    public List<FinancialCreditCardPurchaseResponse> search(
            @AuthenticationPrincipal Jwt jwt,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate from,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate to
    ) {
        return purchaseService.search(
                userId(jwt),
                from,
                to
        );
    }

    @GetMapping("/{purchaseId}")
    public FinancialCreditCardPurchaseResponse findById(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID purchaseId
    ) {
        return purchaseService.findById(
                userId(jwt),
                purchaseId
        );
    }

    @PutMapping("/{purchaseId}")
    public FinancialCreditCardPurchaseResponse update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID purchaseId,
            @Valid @RequestBody
            UpdateFinancialCreditCardPurchaseRequest request
    ) {
        return purchaseService.update(
                userId(jwt),
                purchaseId,
                request
        );
    }

    @PatchMapping("/{purchaseId}/cancel")
    public FinancialCreditCardPurchaseResponse cancel(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID purchaseId
    ) {
        return purchaseService.cancel(
                userId(jwt),
                purchaseId
        );
    }

    @PatchMapping("/{purchaseId}/restore")
    public FinancialCreditCardPurchaseResponse restore(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID purchaseId
    ) {
        return purchaseService.restore(
                userId(jwt),
                purchaseId
        );
    }

    @DeleteMapping("/{purchaseId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID purchaseId
    ) {
        purchaseService.delete(
                userId(jwt),
                purchaseId
        );

        return ResponseEntity.noContent().build();
    }

    private UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}
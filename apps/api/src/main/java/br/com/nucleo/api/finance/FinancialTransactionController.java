package br.com.nucleo.api.finance;

import jakarta.validation.Valid;
import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/finance/transactions")
public class FinancialTransactionController {

    private final FinancialTransactionService transactionService;

    public FinancialTransactionController(
            FinancialTransactionService transactionService
    ) {
        this.transactionService = transactionService;
    }

    @PostMapping
    public ResponseEntity<FinancialTransactionResponse> create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody
            CreateFinancialTransactionRequest request
    ) {
        FinancialTransactionResponse response =
                transactionService.create(
                        userId(jwt),
                        request
                );

        return ResponseEntity
                .created(
                        URI.create(
                                "/api/finance/transactions/"
                                        + response.id()
                        )
                )
                .body(response);
    }

    @GetMapping
    public List<FinancialTransactionResponse> search(
            @AuthenticationPrincipal Jwt jwt,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate from,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate to,

            @RequestParam(required = false)
            FinancialTransactionType type,

            @RequestParam(required = false)
            FinancialTransactionStatus status,

            @RequestParam(required = false)
            UUID accountId,

            @RequestParam(required = false)
            UUID categoryId
    ) {
        return transactionService.search(
                userId(jwt),
                from,
                to,
                type,
                status,
                accountId,
                categoryId
        );
    }

    @GetMapping("/{transactionId}")
    public FinancialTransactionResponse findById(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID transactionId
    ) {
        return transactionService.findById(
                userId(jwt),
                transactionId
        );
    }

    @PutMapping("/{transactionId}")
    public FinancialTransactionResponse update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID transactionId,
            @Valid @RequestBody
            UpdateFinancialTransactionRequest request
    ) {
        return transactionService.update(
                userId(jwt),
                transactionId,
                request
        );
    }

    @PatchMapping("/{transactionId}/pay")
    public FinancialTransactionResponse markAsPaid(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID transactionId
    ) {
        return transactionService.markAsPaid(
                userId(jwt),
                transactionId
        );
    }

    @PatchMapping("/{transactionId}/pending")
    public FinancialTransactionResponse markAsPending(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID transactionId
    ) {
        return transactionService.markAsPending(
                userId(jwt),
                transactionId
        );
    }

    @PatchMapping("/{transactionId}/cancel")
    public FinancialTransactionResponse cancel(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID transactionId
    ) {
        return transactionService.cancel(
                userId(jwt),
                transactionId
        );
    }

    @PatchMapping("/{transactionId}/restore")
    public FinancialTransactionResponse restore(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID transactionId
    ) {
        return transactionService.restore(
                userId(jwt),
                transactionId
        );
    }

    @DeleteMapping("/{transactionId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID transactionId
    ) {
        transactionService.delete(
                userId(jwt),
                transactionId
        );

        return ResponseEntity.noContent().build();
    }

    private UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}
package br.com.nucleo.api.finance.controller;

import br.com.nucleo.api.finance.dto.FinancialCreditCardInvoiceResponse;
import br.com.nucleo.api.finance.dto.PayFinancialCreditCardInvoiceRequest;
import br.com.nucleo.api.finance.service.FinancialCreditCardInvoiceService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/finance/credit-card-invoices")
public class FinancialCreditCardInvoiceController {

    private final FinancialCreditCardInvoiceService invoiceService;

    public FinancialCreditCardInvoiceController(
            FinancialCreditCardInvoiceService invoiceService
    ) {
        this.invoiceService = invoiceService;
    }

    @GetMapping
    public List<FinancialCreditCardInvoiceResponse> list(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam UUID creditCardId
    ) {
        return invoiceService.list(
                userId(jwt),
                creditCardId
        );
    }

    @GetMapping("/{invoiceId}")
    public FinancialCreditCardInvoiceResponse findById(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID invoiceId
    ) {
        return invoiceService.findById(
                userId(jwt),
                invoiceId
        );
    }

    @PatchMapping("/{invoiceId}/close")
    public FinancialCreditCardInvoiceResponse close(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID invoiceId
    ) {
        return invoiceService.close(
                userId(jwt),
                invoiceId
        );
    }

    @PatchMapping("/{invoiceId}/reopen")
    public FinancialCreditCardInvoiceResponse reopen(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID invoiceId
    ) {
        return invoiceService.reopen(
                userId(jwt),
                invoiceId
        );
    }

    @PostMapping("/{invoiceId}/pay")
    public FinancialCreditCardInvoiceResponse pay(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID invoiceId,
            @Valid @RequestBody
            PayFinancialCreditCardInvoiceRequest request
    ) {
        return invoiceService.pay(
                userId(jwt),
                invoiceId,
                request
        );
    }

    @DeleteMapping("/{invoiceId}/payment")
    public FinancialCreditCardInvoiceResponse reversePayment(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID invoiceId
    ) {
        return invoiceService.reversePayment(
                userId(jwt),
                invoiceId
        );
    }

    @DeleteMapping("/{invoiceId}")
    public ResponseEntity<Void> deleteEmptyInvoice(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID invoiceId
    ) {
        invoiceService.deleteEmptyInvoice(
                userId(jwt),
                invoiceId
        );

        return ResponseEntity.noContent().build();
    }

    private UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}
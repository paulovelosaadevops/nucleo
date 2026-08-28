package br.com.nucleo.api.finance.controller;

import br.com.nucleo.api.finance.dto.FinancialInvoiceImportConfirmRequest;
import br.com.nucleo.api.finance.dto.FinancialInvoiceImportPreviewResponse;
import br.com.nucleo.api.finance.dto.FinancialInvoiceImportResponse;
import br.com.nucleo.api.finance.dto.FinancialInvoiceImportResultResponse;
import br.com.nucleo.api.finance.dto.FinancialInvoiceImportRollbackResponse;
import br.com.nucleo.api.finance.service.FinancialInvoiceImportService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/api/finance/invoice-imports")
public class FinancialInvoiceImportController {
    private final FinancialInvoiceImportService service;

    public FinancialInvoiceImportController(
            FinancialInvoiceImportService service
    ) {
        this.service = service;
    }

    @PostMapping("/preview")
    public FinancialInvoiceImportPreviewResponse preview(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam UUID cardId,
            @RequestPart("file") MultipartFile file
    ) {
        return service.preview(userId(jwt), cardId, file);
    }

    @PostMapping("/{token}/confirm")
    public FinancialInvoiceImportResultResponse confirm(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String token,
            @Valid @RequestBody FinancialInvoiceImportConfirmRequest request
    ) {
        return service.confirm(userId(jwt), token, request);
    }

    @GetMapping
    public List<FinancialInvoiceImportResponse> list(
            @AuthenticationPrincipal Jwt jwt
    ) {
        return service.list(userId(jwt));
    }

    @GetMapping("/{importId}")
    public FinancialInvoiceImportResponse findById(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID importId
    ) {
        return service.findById(userId(jwt), importId);
    }

    @PostMapping("/{importId}/rollback")
    public FinancialInvoiceImportRollbackResponse rollback(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID importId
    ) {
        return service.rollback(userId(jwt), importId);
    }

    private UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}

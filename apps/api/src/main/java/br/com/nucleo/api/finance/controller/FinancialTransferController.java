package br.com.nucleo.api.finance.controller;

import br.com.nucleo.api.finance.dto.CreateFinancialTransferRequest;
import br.com.nucleo.api.finance.dto.FinancialTransferResponse;
import br.com.nucleo.api.finance.service.FinancialTransferService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/finance/transfers")
public class FinancialTransferController {
    private final FinancialTransferService transferService;

    public FinancialTransferController(FinancialTransferService transferService) {
        this.transferService = transferService;
    }

    @PostMapping
    public ResponseEntity<FinancialTransferResponse> create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateFinancialTransferRequest request
    ) {
        FinancialTransferResponse response = transferService.create(userId(jwt), request);
        return ResponseEntity
                .created(URI.create("/api/finance/transfers/" + response.id()))
                .body(response);
    }

    private UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}

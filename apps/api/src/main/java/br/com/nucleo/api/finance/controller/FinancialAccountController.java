package br.com.nucleo.api.finance.controller;

import br.com.nucleo.api.finance.dto.ChangeInitialBalanceRequest;
import br.com.nucleo.api.finance.dto.CreateFinancialAccountRequest;
import br.com.nucleo.api.finance.dto.DeleteFinancialAccountResponse;
import br.com.nucleo.api.finance.dto.FinancialAccountResponse;
import br.com.nucleo.api.finance.dto.UpdateFinancialAccountRequest;
import br.com.nucleo.api.finance.service.FinancialAccountService;

import jakarta.validation.Valid;
import java.net.URI;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/finance/accounts")
public class FinancialAccountController {

    private final FinancialAccountService accountService;

    public FinancialAccountController(
            FinancialAccountService accountService
    ) {
        this.accountService = accountService;
    }

    @PostMapping
    public ResponseEntity<FinancialAccountResponse> create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody
            CreateFinancialAccountRequest request
    ) {
        FinancialAccountResponse response =
                accountService.create(
                        userId(jwt),
                        request
                );

        return ResponseEntity
                .created(
                        URI.create(
                                "/api/finance/accounts/"
                                        + response.id()
                        )
                )
                .body(response);
    }

    @GetMapping
    public List<FinancialAccountResponse> list(
            @AuthenticationPrincipal Jwt jwt
    ) {
        return accountService.list(userId(jwt));
    }

    @GetMapping("/{accountId}")
    public FinancialAccountResponse findById(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID accountId
    ) {
        return accountService.findById(
                userId(jwt),
                accountId
        );
    }

    @PutMapping("/{accountId}")
    public FinancialAccountResponse update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID accountId,
            @Valid @RequestBody
            UpdateFinancialAccountRequest request
    ) {
        return accountService.update(
                userId(jwt),
                accountId,
                request
        );
    }

    @PatchMapping("/{accountId}/initial-balance")
    public FinancialAccountResponse changeInitialBalance(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID accountId,
            @Valid @RequestBody
            ChangeInitialBalanceRequest request
    ) {
        return accountService.changeInitialBalance(
                userId(jwt),
                accountId,
                request
        );
    }

    @PatchMapping("/{accountId}/activate")
    public FinancialAccountResponse activate(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID accountId
    ) {
        return accountService.activate(
                userId(jwt),
                accountId
        );
    }

    @PatchMapping("/{accountId}/deactivate")
    public FinancialAccountResponse deactivate(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID accountId
    ) {
        return accountService.deactivate(
                userId(jwt),
                accountId
        );
    }

    @DeleteMapping("/{accountId}")
    public DeleteFinancialAccountResponse delete(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID accountId
    ) {
        return accountService.delete(
                userId(jwt),
                accountId
        );
    }

    private UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}

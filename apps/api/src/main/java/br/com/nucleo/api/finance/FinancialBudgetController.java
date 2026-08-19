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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/finance/budgets")
public class FinancialBudgetController {

    private final FinancialBudgetService budgetService;

    public FinancialBudgetController(
            FinancialBudgetService budgetService
    ) {
        this.budgetService = budgetService;
    }

    @PostMapping
    public ResponseEntity<FinancialBudgetResponse> create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody
            CreateFinancialBudgetRequest request
    ) {
        FinancialBudgetResponse response =
                budgetService.create(
                        userId(jwt),
                        request
                );

        return ResponseEntity
                .created(
                        URI.create(
                                "/api/finance/budgets/"
                                        + response.id()
                        )
                )
                .body(response);
    }

    @GetMapping
    public List<FinancialBudgetResponse> list(
            @AuthenticationPrincipal Jwt jwt,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate referenceMonth
    ) {
        return budgetService.list(
                userId(jwt),
                referenceMonth
        );
    }

    @PutMapping("/{budgetId}")
    public FinancialBudgetResponse update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID budgetId,
            @Valid @RequestBody
            UpdateFinancialBudgetRequest request
    ) {
        return budgetService.update(
                userId(jwt),
                budgetId,
                request
        );
    }

    @DeleteMapping("/{budgetId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID budgetId
    ) {
        budgetService.delete(
                userId(jwt),
                budgetId
        );

        return ResponseEntity.noContent().build();
    }

    private UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}
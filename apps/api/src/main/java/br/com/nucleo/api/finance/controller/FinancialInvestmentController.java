package br.com.nucleo.api.finance.controller;

import br.com.nucleo.api.finance.dto.CreateFinancialInvestmentRequest;
import br.com.nucleo.api.finance.dto.FinancialInvestmentDashboardResponse;
import br.com.nucleo.api.finance.dto.FinancialInvestmentResponse;
import br.com.nucleo.api.finance.dto.InvestmentTransferRequest;
import br.com.nucleo.api.finance.dto.ReconcileInvestmentRequest;
import br.com.nucleo.api.finance.service.FinancialInvestmentService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/finance/investments")
public class FinancialInvestmentController {
    private final FinancialInvestmentService investmentService;

    public FinancialInvestmentController(FinancialInvestmentService investmentService) {
        this.investmentService = investmentService;
    }

    @GetMapping("/dashboard")
    public FinancialInvestmentDashboardResponse dashboard(@AuthenticationPrincipal Jwt jwt) {
        return investmentService.dashboard(userId(jwt));
    }

    @GetMapping
    public List<FinancialInvestmentResponse> list(@AuthenticationPrincipal Jwt jwt) {
        return investmentService.list(userId(jwt));
    }

    @GetMapping("/{investmentId}")
    public FinancialInvestmentResponse findById(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID investmentId
    ) {
        return investmentService.findById(userId(jwt), investmentId);
    }

    @PostMapping
    public ResponseEntity<FinancialInvestmentResponse> create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateFinancialInvestmentRequest request
    ) {
        FinancialInvestmentResponse response = investmentService.create(userId(jwt), request);
        return ResponseEntity.created(URI.create("/api/finance/investments/" + response.id()))
                .body(response);
    }

    @PostMapping("/{investmentId}/contributions")
    public FinancialInvestmentResponse contribute(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID investmentId,
            @Valid @RequestBody InvestmentTransferRequest request
    ) {
        return investmentService.contribute(userId(jwt), investmentId, request);
    }

    @PostMapping("/{investmentId}/redemptions")
    public FinancialInvestmentResponse redeem(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID investmentId,
            @Valid @RequestBody InvestmentTransferRequest request
    ) {
        return investmentService.redeem(userId(jwt), investmentId, request);
    }

    @PostMapping("/{investmentId}/reconciliations")
    public FinancialInvestmentResponse reconcile(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID investmentId,
            @Valid @RequestBody ReconcileInvestmentRequest request
    ) {
        return investmentService.reconcile(userId(jwt), investmentId, request);
    }

    private UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}

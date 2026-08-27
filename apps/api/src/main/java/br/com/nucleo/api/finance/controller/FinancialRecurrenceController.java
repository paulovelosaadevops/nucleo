package br.com.nucleo.api.finance.controller;

import br.com.nucleo.api.finance.dto.CreateFinancialRecurrenceRequest;
import br.com.nucleo.api.finance.dto.ConfirmFinancialRecurrenceOccurrenceRequest;
import br.com.nucleo.api.finance.dto.FinancialRecurrenceOccurrenceResponse;
import br.com.nucleo.api.finance.dto.FinancialRecurrenceResponse;
import br.com.nucleo.api.finance.dto.GenerateFinancialRecurrencesResponse;
import br.com.nucleo.api.finance.dto.PostponeFinancialRecurrenceOccurrenceRequest;
import br.com.nucleo.api.finance.dto.SkipFinancialRecurrenceOccurrenceRequest;
import br.com.nucleo.api.finance.dto.UpdateFinancialRecurrenceRequest;
import br.com.nucleo.api.finance.service.FinancialRecurrenceService;

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
@RequestMapping("/api/finance/recurrences")
public class FinancialRecurrenceController {

    private final FinancialRecurrenceService recurrenceService;

    public FinancialRecurrenceController(
            FinancialRecurrenceService recurrenceService
    ) {
        this.recurrenceService = recurrenceService;
    }

    @PostMapping
    public ResponseEntity<FinancialRecurrenceResponse> create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody
            CreateFinancialRecurrenceRequest request
    ) {
        FinancialRecurrenceResponse response =
                recurrenceService.create(
                        userId(jwt),
                        request
                );

        return ResponseEntity
                .created(
                        URI.create(
                                "/api/finance/recurrences/"
                                        + response.id()
                        )
                )
                .body(response);
    }

    @GetMapping
    public List<FinancialRecurrenceResponse> list(
            @AuthenticationPrincipal Jwt jwt
    ) {
        return recurrenceService.list(userId(jwt));
    }

    @GetMapping("/occurrences")
    public List<FinancialRecurrenceOccurrenceResponse> listOccurrences(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "false") boolean pendingOnly
    ) {
        return recurrenceService.listOccurrences(
                userId(jwt),
                pendingOnly
        );
    }

    @PostMapping("/occurrences/{occurrenceId}/confirm")
    public FinancialRecurrenceOccurrenceResponse confirmOccurrence(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID occurrenceId,
            @Valid @RequestBody
            ConfirmFinancialRecurrenceOccurrenceRequest request
    ) {
        return recurrenceService.confirmOccurrence(
                userId(jwt),
                occurrenceId,
                request
        );
    }

    @PatchMapping("/occurrences/{occurrenceId}/skip")
    public FinancialRecurrenceOccurrenceResponse skipOccurrence(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID occurrenceId,
            @Valid @RequestBody
            SkipFinancialRecurrenceOccurrenceRequest request
    ) {
        return recurrenceService.skipOccurrence(
                userId(jwt),
                occurrenceId,
                request
        );
    }

    @PatchMapping("/occurrences/{occurrenceId}/postpone")
    public FinancialRecurrenceOccurrenceResponse postponeOccurrence(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID occurrenceId,
            @Valid @RequestBody
            PostponeFinancialRecurrenceOccurrenceRequest request
    ) {
        return recurrenceService.postponeOccurrence(
                userId(jwt),
                occurrenceId,
                request
        );
    }

    @PutMapping("/{recurrenceId}")
    public FinancialRecurrenceResponse update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID recurrenceId,
            @Valid @RequestBody
            UpdateFinancialRecurrenceRequest request
    ) {
        return recurrenceService.update(
                userId(jwt),
                recurrenceId,
                request
        );
    }

    @PatchMapping("/{recurrenceId}/pause")
    public FinancialRecurrenceResponse pause(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID recurrenceId
    ) {
        return recurrenceService.pause(
                userId(jwt),
                recurrenceId
        );
    }

    @PatchMapping("/{recurrenceId}/resume")
    public FinancialRecurrenceResponse resume(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID recurrenceId
    ) {
        return recurrenceService.resume(
                userId(jwt),
                recurrenceId
        );
    }

    @PostMapping("/generate")
    public GenerateFinancialRecurrencesResponse generate(
            @AuthenticationPrincipal Jwt jwt,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate until
    ) {
        return recurrenceService.generate(
                userId(jwt),
                until
        );
    }

    @DeleteMapping("/{recurrenceId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID recurrenceId
    ) {
        recurrenceService.delete(
                userId(jwt),
                recurrenceId
        );

        return ResponseEntity.noContent().build();
    }

    private UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}

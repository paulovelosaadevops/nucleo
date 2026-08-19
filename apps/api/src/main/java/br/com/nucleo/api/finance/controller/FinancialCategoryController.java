package br.com.nucleo.api.finance.controller;

import br.com.nucleo.api.finance.domain.FinancialCategoryType;
import br.com.nucleo.api.finance.dto.CreateFinancialCategoryRequest;
import br.com.nucleo.api.finance.dto.FinancialCategoryResponse;
import br.com.nucleo.api.finance.dto.UpdateFinancialCategoryRequest;
import br.com.nucleo.api.finance.service.FinancialCategoryService;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/finance/categories")
public class FinancialCategoryController {

    private final FinancialCategoryService categoryService;

    public FinancialCategoryController(
            FinancialCategoryService categoryService
    ) {
        this.categoryService = categoryService;
    }

    @PostMapping
    public ResponseEntity<FinancialCategoryResponse> create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody
            CreateFinancialCategoryRequest request
    ) {
        FinancialCategoryResponse response =
                categoryService.create(
                        userId(jwt),
                        request
                );

        return ResponseEntity
                .created(
                        URI.create(
                                "/api/finance/categories/"
                                        + response.id()
                        )
                )
                .body(response);
    }

    @GetMapping
    public List<FinancialCategoryResponse> list(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false)
            FinancialCategoryType type
    ) {
        return categoryService.list(
                userId(jwt),
                type
        );
    }

    @PutMapping("/{categoryId}")
    public FinancialCategoryResponse update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID categoryId,
            @Valid @RequestBody
            UpdateFinancialCategoryRequest request
    ) {
        return categoryService.update(
                userId(jwt),
                categoryId,
                request
        );
    }

    @PatchMapping("/{categoryId}/activate")
    public FinancialCategoryResponse activate(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID categoryId
    ) {
        return categoryService.activate(
                userId(jwt),
                categoryId
        );
    }

    @PatchMapping("/{categoryId}/deactivate")
    public FinancialCategoryResponse deactivate(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID categoryId
    ) {
        return categoryService.deactivate(
                userId(jwt),
                categoryId
        );
    }

    @DeleteMapping("/{categoryId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID categoryId
    ) {
        categoryService.delete(
                userId(jwt),
                categoryId
        );

        return ResponseEntity.noContent().build();
    }

    private UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}
package br.com.nucleo.api.settings.controller;

import br.com.nucleo.api.settings.dto.FamilySettingsResponse;
import br.com.nucleo.api.settings.dto.UpdateFamilySettingsRequest;
import br.com.nucleo.api.settings.service.FamilySettingsService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/settings/family")
public class FamilySettingsController {

    private final FamilySettingsService settingsService;

    public FamilySettingsController(
            FamilySettingsService settingsService
    ) {
        this.settingsService = settingsService;
    }

    @GetMapping
    public FamilySettingsResponse get(
            @AuthenticationPrincipal Jwt jwt
    ) {
        return settingsService.get(userId(jwt));
    }

    @PutMapping
    public FamilySettingsResponse update(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody
            UpdateFamilySettingsRequest request
    ) {
        return settingsService.update(
                userId(jwt),
                request
        );
    }

    private UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}
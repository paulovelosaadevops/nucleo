package br.com.nucleo.api.notification.controller;

import br.com.nucleo.api.notification.dto.NotificationPreferenceResponse;
import br.com.nucleo.api.notification.dto.UpdateNotificationPreferenceRequest;
import br.com.nucleo.api.notification.service.NotificationPreferenceService;
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
@RequestMapping("/api/notification-preferences")
public class NotificationPreferenceController {

    private final NotificationPreferenceService preferenceService;

    public NotificationPreferenceController(
            NotificationPreferenceService preferenceService
    ) {
        this.preferenceService = preferenceService;
    }

    @GetMapping
    public NotificationPreferenceResponse get(
            @AuthenticationPrincipal Jwt jwt
    ) {
        return preferenceService.get(
                userId(jwt)
        );
    }

    @PutMapping
    public NotificationPreferenceResponse update(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody
            UpdateNotificationPreferenceRequest request
    ) {
        return preferenceService.update(
                userId(jwt),
                request
        );
    }

    private UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}
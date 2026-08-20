package br.com.nucleo.api.notification.controller;

import br.com.nucleo.api.notification.dto.NotificationResponse;
import br.com.nucleo.api.notification.dto.NotificationSummaryResponse;
import br.com.nucleo.api.notification.service.NotificationService;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(
            NotificationService notificationService
    ) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public Page<NotificationResponse> list(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "false")
            boolean unreadOnly,
            @PageableDefault(
                    size = 20,
                    sort = "createdAt"
            )
            Pageable pageable
    ) {
        return notificationService.list(
                userId(jwt),
                unreadOnly,
                pageable
        );
    }

    @GetMapping("/summary")
    public NotificationSummaryResponse summary(
            @AuthenticationPrincipal Jwt jwt
    ) {
        return notificationService.summary(
                userId(jwt)
        );
    }

    @PatchMapping("/{notificationId}/read")
    public NotificationResponse markAsRead(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID notificationId
    ) {
        return notificationService.markAsRead(
                userId(jwt),
                notificationId
        );
    }

    @PatchMapping("/{notificationId}/unread")
    public NotificationResponse markAsUnread(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID notificationId
    ) {
        return notificationService.markAsUnread(
                userId(jwt),
                notificationId
        );
    }

    @PatchMapping("/read-all")
    public NotificationSummaryResponse markAllAsRead(
            @AuthenticationPrincipal Jwt jwt
    ) {
        notificationService.markAllAsRead(
                userId(jwt)
        );

        return notificationService.summary(
                userId(jwt)
        );
    }

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID notificationId
    ) {
        notificationService.delete(
                userId(jwt),
                notificationId
        );

        return ResponseEntity.noContent().build();
    }

    private UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}
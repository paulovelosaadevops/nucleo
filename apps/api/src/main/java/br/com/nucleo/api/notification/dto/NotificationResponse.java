package br.com.nucleo.api.notification.dto;

import br.com.nucleo.api.notification.domain.Notification;
import br.com.nucleo.api.notification.domain.NotificationType;
import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        NotificationType type,
        String title,
        String message,
        String actionPath,
        UUID referenceId,
        boolean read,
        Instant readAt,
        Instant createdAt
) {

    public static NotificationResponse from(
            Notification notification
    ) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getActionPath(),
                notification.getReferenceId(),
                notification.isRead(),
                notification.getReadAt(),
                notification.getCreatedAt()
        );
    }
}
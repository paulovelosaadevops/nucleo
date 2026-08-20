package br.com.nucleo.api.notification.service;

import br.com.nucleo.api.common.error.ResourceNotFoundException;
import br.com.nucleo.api.family.domain.Family;
import br.com.nucleo.api.family.domain.FamilyMembership;
import br.com.nucleo.api.family.repository.FamilyMembershipRepository;
import br.com.nucleo.api.family.service.FamilyAccessService;
import br.com.nucleo.api.identity.user.domain.User;
import br.com.nucleo.api.notification.domain.Notification;
import br.com.nucleo.api.notification.domain.NotificationType;
import br.com.nucleo.api.notification.dto.NotificationResponse;
import br.com.nucleo.api.notification.dto.NotificationSummaryResponse;
import br.com.nucleo.api.notification.repository.NotificationRepository;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    private static final int MAXIMUM_PAGE_SIZE = 100;

    private final FamilyAccessService familyAccessService;
    private final FamilyMembershipRepository membershipRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceService preferenceService;

    public NotificationService(
            FamilyAccessService familyAccessService,
            FamilyMembershipRepository membershipRepository,
            NotificationRepository notificationRepository,
            NotificationPreferenceService preferenceService
    ) {
        this.familyAccessService = familyAccessService;
        this.membershipRepository = membershipRepository;
        this.notificationRepository = notificationRepository;
        this.preferenceService = preferenceService;
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> list(
            UUID currentUserId,
            boolean unreadOnly,
            Pageable pageable
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        validatePageable(pageable);

        return notificationRepository.search(
                membership.getFamily().getId(),
                membership.getUser().getId(),
                unreadOnly,
                pageable
        ).map(NotificationResponse::from);
    }

    @Transactional(readOnly = true)
    public NotificationSummaryResponse summary(
            UUID currentUserId
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        long unreadCount =
                notificationRepository
                        .countByFamily_IdAndRecipient_IdAndReadAtIsNull(
                                membership.getFamily().getId(),
                                membership.getUser().getId()
                        );

        return new NotificationSummaryResponse(unreadCount);
    }

    @Transactional
    public NotificationResponse markAsRead(
            UUID currentUserId,
            UUID notificationId
    ) {
        Notification notification =
                requireAccessibleNotification(
                        currentUserId,
                        notificationId
                );

        notification.markAsRead();

        return NotificationResponse.from(notification);
    }

    @Transactional
    public NotificationResponse markAsUnread(
            UUID currentUserId,
            UUID notificationId
    ) {
        Notification notification =
                requireAccessibleNotification(
                        currentUserId,
                        notificationId
                );

        notification.markAsUnread();

        return NotificationResponse.from(notification);
    }

    @Transactional
    public int markAllAsRead(
            UUID currentUserId
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        return notificationRepository.markAllAsRead(
                membership.getFamily().getId(),
                membership.getUser().getId(),
                Instant.now()
        );
    }

    @Transactional
    public void delete(
            UUID currentUserId,
            UUID notificationId
    ) {
        Notification notification =
                requireAccessibleNotification(
                        currentUserId,
                        notificationId
                );

        notificationRepository.delete(notification);
    }

    @Transactional
    public Optional<Notification> notifyUser(
            Family family,
            User recipient,
            NotificationType type,
            String title,
            String message,
            String actionPath,
            UUID referenceId,
            String deduplicationKey
    ) {
        if (
                deduplicationKey != null
                        && notificationRepository
                        .existsByRecipient_IdAndDeduplicationKey(
                                recipient.getId(),
                                deduplicationKey
                        )
        ) {
            return Optional.empty();
        }

        if (!preferenceService.allows(
                family,
                recipient,
                type
        )) {
            return Optional.empty();
        }

        Notification notification = Notification.create(
                family,
                recipient,
                type,
                title,
                message,
                actionPath,
                referenceId,
                deduplicationKey
        );

        return Optional.of(
                notificationRepository.save(notification)
        );
    }

    @Transactional
    public int notifyActiveFamilyMembers(
            Family family,
            UUID excludedUserId,
            NotificationType type,
            String title,
            String message,
            String actionPath,
            UUID referenceId,
            String deduplicationKey
    ) {
        int createdNotifications = 0;

        for (
                FamilyMembership membership
                : membershipRepository
                .findAllByFamily_IdOrderByJoinedAtAsc(
                        family.getId()
                )
        ) {
            if (!membership.isActive()) {
                continue;
            }

            if (
                    excludedUserId != null
                            && membership
                            .getUser()
                            .getId()
                            .equals(excludedUserId)
            ) {
                continue;
            }

            Optional<Notification> created = notifyUser(
                    family,
                    membership.getUser(),
                    type,
                    title,
                    message,
                    actionPath,
                    referenceId,
                    deduplicationKey
            );

            if (created.isPresent()) {
                createdNotifications++;
            }
        }

        return createdNotifications;
    }

    private Notification requireAccessibleNotification(
            UUID currentUserId,
            UUID notificationId
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        return notificationRepository
                .findByIdAndFamily_IdAndRecipient_Id(
                        notificationId,
                        membership.getFamily().getId(),
                        membership.getUser().getId()
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Notificação não encontrada"
                        )
                );
    }

    private void validatePageable(Pageable pageable) {
        if (pageable.getPageNumber() < 0) {
            throw new IllegalArgumentException(
                    "A página não pode ser negativa"
            );
        }

        if (
                pageable.getPageSize() < 1
                        || pageable.getPageSize()
                        > MAXIMUM_PAGE_SIZE
        ) {
            throw new IllegalArgumentException(
                    "A quantidade por página deve ficar entre 1 e 100"
            );
        }
    }
}
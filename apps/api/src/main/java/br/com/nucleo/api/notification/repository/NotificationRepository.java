package br.com.nucleo.api.notification.repository;

import br.com.nucleo.api.notification.domain.Notification;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository
        extends JpaRepository<Notification, UUID> {

    @EntityGraph(attributePaths = {
            "family",
            "recipient"
    })
    @Query(
            value = """
                    select notification
                    from Notification notification
                    where notification.family.id = :familyId
                      and notification.recipient.id = :recipientId
                      and (
                          :unreadOnly = false
                          or notification.readAt is null
                      )
                    order by notification.createdAt desc
                    """,
            countQuery = """
                    select count(notification)
                    from Notification notification
                    where notification.family.id = :familyId
                      and notification.recipient.id = :recipientId
                      and (
                          :unreadOnly = false
                          or notification.readAt is null
                      )
                    """
    )
    Page<Notification> search(
            @Param("familyId") UUID familyId,
            @Param("recipientId") UUID recipientId,
            @Param("unreadOnly") boolean unreadOnly,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {
            "family",
            "recipient"
    })
    Optional<Notification>
            findByIdAndFamily_IdAndRecipient_Id(
                    UUID notificationId,
                    UUID familyId,
                    UUID recipientId
            );

    long countByFamily_IdAndRecipient_IdAndReadAtIsNull(
            UUID familyId,
            UUID recipientId
    );

    boolean existsByRecipient_IdAndDeduplicationKey(
            UUID recipientId,
            String deduplicationKey
    );

    @Modifying(clearAutomatically = true)
    @Query("""
            update Notification notification
               set notification.readAt = :readAt
             where notification.family.id = :familyId
               and notification.recipient.id = :recipientId
               and notification.readAt is null
            """)
    int markAllAsRead(
            @Param("familyId") UUID familyId,
            @Param("recipientId") UUID recipientId,
            @Param("readAt") Instant readAt
    );
}
package br.com.nucleo.api.notification.repository;

import br.com.nucleo.api.notification.domain.NotificationPreference;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationPreferenceRepository
        extends JpaRepository<NotificationPreference, UUID> {

    @EntityGraph(attributePaths = {
            "family",
            "user"
    })
    Optional<NotificationPreference>
            findByFamily_IdAndUser_Id(
                    UUID familyId,
                    UUID userId
            );
}
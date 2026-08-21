package br.com.nucleo.api.settings.repository;

import br.com.nucleo.api.settings.domain.FamilySettings;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FamilySettingsRepository
        extends JpaRepository<FamilySettings, UUID> {

    @EntityGraph(attributePaths = "family")
    Optional<FamilySettings> findByFamily_Id(UUID familyId);
}
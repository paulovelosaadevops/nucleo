package br.com.nucleo.api.families;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FamilyInvitationRepository extends JpaRepository<FamilyInvitation, UUID> {

    List<FamilyInvitation> findByFamilyIdOrderByCreatedAtDesc(UUID familyId);

    Optional<FamilyInvitation> findByIdAndFamilyId(UUID id, UUID familyId);

    @EntityGraph(attributePaths = "family")
    Optional<FamilyInvitation> findByToken(String token);
}
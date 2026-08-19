package br.com.nucleo.api.family;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FamilyInvitationRepository
        extends JpaRepository<FamilyInvitation, UUID> {

    @EntityGraph(attributePaths = {"family", "invitedBy"})
    Optional<FamilyInvitation> findByTokenHash(
            String tokenHash
    );

    @EntityGraph(attributePaths = {"family", "invitedBy"})
    Optional<FamilyInvitation> findByIdAndFamily_Id(
            UUID invitationId,
            UUID familyId
    );

    @EntityGraph(attributePaths = {"family", "invitedBy"})
    List<FamilyInvitation> findAllByFamily_IdOrderByCreatedAtDesc(
            UUID familyId
    );

    boolean existsByFamily_IdAndEmailIgnoreCaseAndStatus(
            UUID familyId,
            String email,
            InvitationStatus status
    );
}
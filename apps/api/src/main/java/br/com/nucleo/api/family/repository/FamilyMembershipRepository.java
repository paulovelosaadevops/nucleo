package br.com.nucleo.api.family.repository;

import br.com.nucleo.api.family.domain.FamilyMembership;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FamilyMembershipRepository
        extends JpaRepository<FamilyMembership, UUID> {

    @EntityGraph(attributePaths = {"family", "user"})
    Optional<FamilyMembership> findByUser_Id(UUID userId);

    @EntityGraph(attributePaths = {"family", "user"})
    Optional<FamilyMembership> findByIdAndFamily_Id(
            UUID membershipId,
            UUID familyId
    );

    @EntityGraph(attributePaths = "user")
    List<FamilyMembership> findAllByFamily_IdOrderByJoinedAtAsc(
            UUID familyId
    );

    boolean existsByUser_Id(UUID userId);
}
package br.com.nucleo.api.families;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FamilyMembershipRepository extends JpaRepository<FamilyMembership, UUID> {

    @EntityGraph(attributePaths = "family")
    Optional<FamilyMembership> findFirstByUserId(UUID userId);
}
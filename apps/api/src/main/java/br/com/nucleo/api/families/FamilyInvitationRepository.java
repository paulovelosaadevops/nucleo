package br.com.nucleo.api.families;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface FamilyInvitationRepository extends JpaRepository<FamilyInvitation, UUID> {

    List<FamilyInvitation> findByFamilyIdOrderByCreatedAtDesc(UUID familyId);
}
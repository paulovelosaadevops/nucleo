package br.com.nucleo.api.families;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface FamilyMembershipRepository extends JpaRepository<FamilyMembership, UUID> {
}
package br.com.nucleo.api.family.repository;

import br.com.nucleo.api.family.domain.Family;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface FamilyRepository extends JpaRepository<Family, UUID> {
}
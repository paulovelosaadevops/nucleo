package br.com.nucleo.api.shopping.repository;

import br.com.nucleo.api.shopping.domain.ShoppingList;
import br.com.nucleo.api.shopping.domain.ShoppingListStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShoppingListRepository
        extends JpaRepository<ShoppingList, UUID> {

    @EntityGraph(attributePaths = {
            "family",
            "createdBy"
    })
    Optional<ShoppingList> findByIdAndFamily_Id(
            UUID id,
            UUID familyId
    );

    @EntityGraph(attributePaths = {
            "family",
            "createdBy"
    })
    List<ShoppingList> findAllByFamily_IdOrderByCreatedAtDesc(
            UUID familyId
    );

    @EntityGraph(attributePaths = {
            "family",
            "createdBy"
    })
    List<ShoppingList> findAllByFamily_IdAndStatusOrderByCreatedAtDesc(
            UUID familyId,
            ShoppingListStatus status
    );
}
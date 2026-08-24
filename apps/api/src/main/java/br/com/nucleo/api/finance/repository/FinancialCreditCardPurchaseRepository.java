package br.com.nucleo.api.finance.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import br.com.nucleo.api.finance.domain.FinancialCreditCardPurchase;

public interface FinancialCreditCardPurchaseRepository
        extends JpaRepository<FinancialCreditCardPurchase, UUID> {

    @EntityGraph(attributePaths = {
            "family",
            "creditCard",
            "category",
            "recurrence",
            "createdBy"
    })
    Optional<FinancialCreditCardPurchase>
            findByIdAndFamily_Id(
                    UUID purchaseId,
                    UUID familyId
            );

    @EntityGraph(attributePaths = {
            "creditCard",
            "category",
            "recurrence",
            "createdBy"
    })
    List<FinancialCreditCardPurchase>
            findAllByFamily_IdAndPurchaseDateBetweenOrderByPurchaseDateDescCreatedAtDesc(
                    UUID familyId,
                    LocalDate from,
                    LocalDate to
            );

    @EntityGraph(attributePaths = {
            "creditCard",
            "category",
            "recurrence",
            "createdBy"
    })
    List<FinancialCreditCardPurchase>
            findAllByCreditCard_IdOrderByPurchaseDateDescCreatedAtDesc(
                    UUID cardId
            );

    @Query("""
            select coalesce(
                max(purchase.recurrenceSequence),
                0
            )
            from FinancialCreditCardPurchase purchase
            where purchase.recurrence.id = :recurrenceId
            """)
    int findMaximumRecurrenceSequence(
            @Param("recurrenceId") UUID recurrenceId
    );

    boolean existsByCreditCard_Id(UUID cardId);

    boolean existsByRecurrence_Id(UUID recurrenceId);
}
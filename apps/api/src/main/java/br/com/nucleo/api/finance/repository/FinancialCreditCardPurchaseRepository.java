package br.com.nucleo.api.finance.repository;

import br.com.nucleo.api.finance.domain.FinancialCreditCardPurchase;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinancialCreditCardPurchaseRepository
        extends JpaRepository<FinancialCreditCardPurchase, UUID> {

    @EntityGraph(attributePaths = {
            "family",
            "creditCard",
            "category",
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
            "createdBy"
    })
    List<FinancialCreditCardPurchase>
            findAllByCreditCard_IdOrderByPurchaseDateDescCreatedAtDesc(
                    UUID cardId
            );

    boolean existsByCreditCard_Id(UUID cardId);
}
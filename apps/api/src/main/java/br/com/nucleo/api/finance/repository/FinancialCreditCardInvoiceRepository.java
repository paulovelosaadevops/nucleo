package br.com.nucleo.api.finance.repository;

import br.com.nucleo.api.finance.domain.FinancialCreditCardInvoice;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinancialCreditCardInvoiceRepository
        extends JpaRepository<FinancialCreditCardInvoice, UUID> {

    @EntityGraph(attributePaths = {
            "creditCard",
            "creditCard.family",
            "creditCard.paymentAccount"
    })
    Optional<FinancialCreditCardInvoice>
            findByIdAndCreditCard_Family_Id(
                    UUID invoiceId,
                    UUID familyId
            );

    @EntityGraph(attributePaths = {
            "creditCard",
            "creditCard.paymentAccount"
    })
    Optional<FinancialCreditCardInvoice>
            findByCreditCard_IdAndReferenceMonth(
                    UUID cardId,
                    LocalDate referenceMonth
            );

    @EntityGraph(attributePaths = {
            "creditCard",
            "creditCard.paymentAccount"
    })
    List<FinancialCreditCardInvoice>
            findAllByCreditCard_IdOrderByReferenceMonthDesc(
                    UUID cardId
            );

    boolean existsByCreditCard_Id(UUID cardId);
}
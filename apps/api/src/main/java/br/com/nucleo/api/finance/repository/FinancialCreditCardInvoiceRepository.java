package br.com.nucleo.api.finance.repository;

import br.com.nucleo.api.finance.domain.FinancialCreditCardInvoice;
import br.com.nucleo.api.finance.domain.FinancialCreditCardInvoiceStatus;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
            "creditCard.family",
            "creditCard.paymentAccount"
    })
    Optional<FinancialCreditCardInvoice>
            findByCreditCard_IdAndReferenceMonth(
                    UUID cardId,
                    LocalDate referenceMonth
            );

    @EntityGraph(attributePaths = {
            "creditCard",
            "creditCard.family",
            "creditCard.paymentAccount"
    })
    List<FinancialCreditCardInvoice>
            findAllByCreditCard_IdOrderByReferenceMonthDesc(
                    UUID cardId
            );

    @EntityGraph(attributePaths = {
            "creditCard",
            "creditCard.family",
            "creditCard.paymentAccount"
    })
    @Query("""
            select invoice
              from FinancialCreditCardInvoice invoice
             where invoice.status in :statuses
               and invoice.dueDate
                   between :periodStart and :periodEnd
             order by invoice.dueDate asc
            """)
    List<FinancialCreditCardInvoice>
            findAllDueForNotifications(
                    @Param("statuses")
                    List<FinancialCreditCardInvoiceStatus> statuses,
                    @Param("periodStart") LocalDate periodStart,
                    @Param("periodEnd") LocalDate periodEnd
            );

    boolean existsByCreditCard_Id(UUID cardId);
}
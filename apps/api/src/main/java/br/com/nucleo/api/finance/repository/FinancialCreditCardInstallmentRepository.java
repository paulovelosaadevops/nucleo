package br.com.nucleo.api.finance.repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import br.com.nucleo.api.finance.domain.FinancialCreditCardInstallment;

public interface FinancialCreditCardInstallmentRepository
        extends JpaRepository<FinancialCreditCardInstallment, UUID> {

    @EntityGraph(attributePaths = {
            "purchase", "purchase.category", "purchase.creditCard", "invoice"
    })
    List<FinancialCreditCardInstallment>
            findAllByInvoice_IdOrderByInstallmentNumberAsc(UUID invoiceId);

    @EntityGraph(attributePaths = {
            "purchase", "purchase.category", "invoice", "invoice.creditCard"
    })
    List<FinancialCreditCardInstallment>
            findAllByPurchase_IdOrderByInstallmentNumberAsc(UUID purchaseId);

    @EntityGraph(attributePaths = {
            "purchase", "purchase.category", "purchase.creditCard", "invoice"
    })
    @Query("""
            select installment
            from FinancialCreditCardInstallment installment
            where installment.purchase.family.id = :familyId
              and installment.invoice.dueDate between :from and :to
              and installment.status =
                  br.com.nucleo.api.finance.domain.FinancialCreditCardInstallmentStatus.OPEN
              and installment.purchase.status =
                  br.com.nucleo.api.finance.domain.FinancialCreditCardPurchaseStatus.ACTIVE
              and installment.invoice.status <>
                  br.com.nucleo.api.finance.domain.FinancialCreditCardInvoiceStatus.CANCELLED
            order by installment.invoice.dueDate asc,
                     installment.purchase.purchaseDate asc,
                     installment.installmentNumber asc
            """)
    List<FinancialCreditCardInstallment> findAllForDashboardPeriod(
            @Param("familyId") UUID familyId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );

    @EntityGraph(attributePaths = {
            "purchase", "purchase.category", "purchase.creditCard", "invoice"
    })
    @Query("""
            select installment
            from FinancialCreditCardInstallment installment
            where installment.purchase.family.id = :familyId
              and installment.invoice.dueDate >= :from
              and installment.status =
                  br.com.nucleo.api.finance.domain.FinancialCreditCardInstallmentStatus.OPEN
              and installment.purchase.status =
                  br.com.nucleo.api.finance.domain.FinancialCreditCardPurchaseStatus.ACTIVE
              and installment.invoice.status in (
                  br.com.nucleo.api.finance.domain.FinancialCreditCardInvoiceStatus.OPEN,
                  br.com.nucleo.api.finance.domain.FinancialCreditCardInvoiceStatus.CLOSED
              )
            order by installment.invoice.dueDate asc,
                     installment.purchase.purchaseDate asc,
                     installment.installmentNumber asc
            """)
    List<FinancialCreditCardInstallment> findAllOpenCommitments(
            @Param("familyId") UUID familyId,
            @Param("from") LocalDate from
    );

    @EntityGraph(attributePaths = {
            "purchase", "purchase.category", "purchase.creditCard", "invoice"
    })
    @Query("""
            select installment
            from FinancialCreditCardInstallment installment
            where installment.purchase.family.id = :familyId
              and installment.invoice.referenceMonth = :referenceMonth
              and installment.status =
                  br.com.nucleo.api.finance.domain.FinancialCreditCardInstallmentStatus.OPEN
              and installment.purchase.status =
                  br.com.nucleo.api.finance.domain.FinancialCreditCardPurchaseStatus.ACTIVE
              and installment.invoice.status <>
                  br.com.nucleo.api.finance.domain.FinancialCreditCardInvoiceStatus.CANCELLED
            order by installment.invoice.dueDate asc,
                     installment.purchase.purchaseDate asc,
                     installment.installmentNumber asc
            """)
    List<FinancialCreditCardInstallment> findAllForReferenceMonth(
            @Param("familyId") UUID familyId,
            @Param("referenceMonth") LocalDate referenceMonth
    );

    @Query("""
            select coalesce(sum(installment.amount), 0)
            from FinancialCreditCardInstallment installment
            where installment.invoice.id = :invoiceId
              and installment.status =
                  br.com.nucleo.api.finance.domain.FinancialCreditCardInstallmentStatus.OPEN
              and installment.purchase.status =
                  br.com.nucleo.api.finance.domain.FinancialCreditCardPurchaseStatus.ACTIVE
            """)
    BigDecimal calculateInvoiceTotal(@Param("invoiceId") UUID invoiceId);

    @Query("""
            select coalesce(sum(installment.amount), 0)
            from FinancialCreditCardInstallment installment
            where installment.invoice.creditCard.id = :cardId
              and installment.status =
                  br.com.nucleo.api.finance.domain.FinancialCreditCardInstallmentStatus.OPEN
              and installment.purchase.status =
                  br.com.nucleo.api.finance.domain.FinancialCreditCardPurchaseStatus.ACTIVE
              and installment.invoice.status in (
                  br.com.nucleo.api.finance.domain.FinancialCreditCardInvoiceStatus.OPEN,
                  br.com.nucleo.api.finance.domain.FinancialCreditCardInvoiceStatus.CLOSED
              )
            """)
    BigDecimal calculateOutstandingAmount(@Param("cardId") UUID cardId);

    boolean existsByInvoice_Id(UUID invoiceId);
}
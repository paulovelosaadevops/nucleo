package br.com.nucleo.api.finance.repository;

import br.com.nucleo.api.finance.domain.FinancialTransaction;
import br.com.nucleo.api.finance.domain.FinancialTransactionStatus;
import br.com.nucleo.api.finance.domain.FinancialTransactionType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FinancialTransactionRepository
        extends JpaRepository<FinancialTransaction, UUID> {

    @EntityGraph(attributePaths = {
            "family",
            "account",
            "category",
            "createdBy",
            "recurrence",
            "creditCardInvoice"
    })
    Optional<FinancialTransaction> findByIdAndFamily_Id(
            UUID transactionId,
            UUID familyId
    );

    @EntityGraph(attributePaths = {
            "family",
            "account",
            "category",
            "createdBy",
            "recurrence",
            "creditCardInvoice"
    })
    List<FinancialTransaction>
            findAllByFamily_IdAndTransactionDateBetweenOrderByTransactionDateDescCreatedAtDesc(
                    UUID familyId,
                    LocalDate from,
                    LocalDate to
            );

    @EntityGraph(attributePaths = {
            "family",
            "account",
            "category",
            "createdBy",
            "recurrence",
            "creditCardInvoice"
    })
    @Query("""
            select transaction
            from FinancialTransaction transaction
            where transaction.family.id = :familyId
              and transaction.transactionDate between :from and :to
              and (
                    :type is null
                    or transaction.type = :type
              )
              and (
                    :status is null
                    or transaction.status = :status
              )
              and (
                    :accountId is null
                    or transaction.account.id = :accountId
              )
              and (
                    :categoryId is null
                    or transaction.category.id = :categoryId
              )
            order by
                transaction.transactionDate desc,
                transaction.createdAt desc
            """)
    List<FinancialTransaction> search(
            @Param("familyId") UUID familyId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("type") FinancialTransactionType type,
            @Param("status") FinancialTransactionStatus status,
            @Param("accountId") UUID accountId,
            @Param("categoryId") UUID categoryId
    );

    @EntityGraph(attributePaths = {
            "family",
            "account",
            "category",
            "createdBy",
            "recurrence",
            "creditCardInvoice"
    })
    List<FinancialTransaction>
            findAllByFamily_IdAndStatusAndDueDateBeforeOrderByDueDateAsc(
                    UUID familyId,
                    FinancialTransactionStatus status,
                    LocalDate date
            );

    @EntityGraph(attributePaths = {
            "family",
            "account",
            "category",
            "createdBy"
    })
    @Query("""
            select transaction
              from FinancialTransaction transaction
             where transaction.status = :status
               and transaction.type = :type
               and transaction.dueDate
                   between :periodStart and :periodEnd
               and transaction.excludedFromReports = false
             order by transaction.dueDate asc
            """)
    List<FinancialTransaction> findAllDueForNotifications(
            @Param("status")
            FinancialTransactionStatus status,
            @Param("type")
            FinancialTransactionType type,
            @Param("periodStart") LocalDate periodStart,
            @Param("periodEnd") LocalDate periodEnd
    );

    @Query("""
            select coalesce(
                max(transaction.recurrenceSequence),
                0
            )
            from FinancialTransaction transaction
            where transaction.recurrence.id = :recurrenceId
            """)
    int findMaximumRecurrenceSequence(
            @Param("recurrenceId") UUID recurrenceId
    );

    @Query("""
            select coalesce(sum(transaction.amount), 0)
            from FinancialTransaction transaction
            where transaction.family.id = :familyId
              and transaction.category.id = :categoryId
              and transaction.type =
                  br.com.nucleo.api.finance.domain.FinancialTransactionType.EXPENSE
              and transaction.status = :status
              and transaction.transactionDate between :from and :to
              and transaction.excludedFromReports = false
            """)
    BigDecimal calculateCategoryExpense(
            @Param("familyId") UUID familyId,
            @Param("categoryId") UUID categoryId,
            @Param("status")
            FinancialTransactionStatus status,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );

    boolean existsByAccount_Id(UUID accountId);

    boolean existsByCategory_Id(UUID categoryId);

    boolean existsByRecurrence_Id(UUID recurrenceId);
}
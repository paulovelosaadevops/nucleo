package br.com.nucleo.api.finance;

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
            "createdBy"
    })
    Optional<FinancialTransaction> findByIdAndFamily_Id(
            UUID transactionId,
            UUID familyId
    );

    @EntityGraph(attributePaths = {
            "account",
            "category",
            "createdBy"
    })
    List<FinancialTransaction>
            findAllByFamily_IdAndTransactionDateBetweenOrderByTransactionDateDescCreatedAtDesc(
                    UUID familyId,
                    LocalDate from,
                    LocalDate to
            );

    @EntityGraph(attributePaths = {
            "account",
            "category",
            "createdBy"
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
            "account",
            "category",
            "createdBy"
    })
    List<FinancialTransaction>
            findAllByFamily_IdAndStatusAndDueDateBeforeOrderByDueDateAsc(
                    UUID familyId,
                    FinancialTransactionStatus status,
                    LocalDate date
            );

    boolean existsByAccount_Id(UUID accountId);

    boolean existsByCategory_Id(UUID categoryId);
}
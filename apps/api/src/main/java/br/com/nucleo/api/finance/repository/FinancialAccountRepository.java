package br.com.nucleo.api.finance.repository;

import br.com.nucleo.api.finance.domain.FinancialAccount;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FinancialAccountRepository
        extends JpaRepository<FinancialAccount, UUID> {

    @EntityGraph(attributePaths = {
            "family",
            "createdBy"
    })
    Optional<FinancialAccount> findByIdAndFamily_Id(
            UUID accountId,
            UUID familyId
    );

    @EntityGraph(attributePaths = {
            "family",
            "createdBy"
    })
    List<FinancialAccount>
            findAllByFamily_IdOrderByActiveDescNameAsc(
                    UUID familyId
            );

    boolean existsByFamily_IdAndNameIgnoreCase(
            UUID familyId,
            String name
    );

    boolean existsByFamily_IdAndNameIgnoreCaseAndIdNot(
            UUID familyId,
            String name,
            UUID accountId
    );

    @Query("""
            select coalesce(
                sum(
                    case
                        when transaction.type in (
                            br.com.nucleo.api.finance.domain.FinancialTransactionType.INCOME,
                            br.com.nucleo.api.finance.domain.FinancialTransactionType.TRANSFER_IN
                        ) then transaction.amount
                        else -transaction.amount
                    end
                ),
                0
            )
            from FinancialTransaction transaction
            where transaction.account.id = :accountId
              and transaction.status =
                  br.com.nucleo.api.finance.domain.FinancialTransactionStatus.PAID
              and transaction.account.type <>
                  br.com.nucleo.api.finance.domain.FinancialAccountType.INVESTMENT
            """)
    BigDecimal calculatePaidMovementBalance(
            @Param("accountId") UUID accountId
    );

    @Query("""
            select coalesce(
                sum(
                    case
                        when transaction.type in (
                            br.com.nucleo.api.finance.domain.FinancialTransactionType.INCOME,
                            br.com.nucleo.api.finance.domain.FinancialTransactionType.TRANSFER_IN
                        ) then transaction.amount
                        else -transaction.amount
                    end
                ),
                0
            )
            from FinancialTransaction transaction
            where transaction.account.id = :accountId
              and transaction.status =
                  br.com.nucleo.api.finance.domain.FinancialTransactionStatus.PAID
            """)
    BigDecimal calculatePaidMovementBalanceIncludingInvestments(
            @Param("accountId") UUID accountId
    );
}

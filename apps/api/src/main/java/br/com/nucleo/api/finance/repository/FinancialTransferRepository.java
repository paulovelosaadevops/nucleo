package br.com.nucleo.api.finance.repository;

import br.com.nucleo.api.finance.domain.FinancialTransfer;
import java.math.BigDecimal;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FinancialTransferRepository extends JpaRepository<FinancialTransfer, UUID> {
    @Query("""
            select coalesce(sum(
                case
                    when transfer.destinationAccount.id = :accountId then transfer.amount
                    when transfer.sourceAccount.id = :accountId then -transfer.amount
                    else 0
                end
            ), 0)
            from FinancialTransfer transfer
            where transfer.status =
                br.com.nucleo.api.finance.domain.FinancialTransferStatus.COMPLETED
              and (
                  transfer.sourceAccount.id = :accountId
                  or transfer.destinationAccount.id = :accountId
              )
            """)
    BigDecimal calculateCompletedTransferBalance(@Param("accountId") UUID accountId);

    boolean existsBySourceAccount_IdOrDestinationAccount_Id(UUID sourceAccountId, UUID destinationAccountId);
}

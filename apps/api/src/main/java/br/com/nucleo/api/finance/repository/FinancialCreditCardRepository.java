package br.com.nucleo.api.finance.repository;

import br.com.nucleo.api.finance.domain.FinancialCreditCard;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinancialCreditCardRepository
        extends JpaRepository<FinancialCreditCard, UUID> {

    @EntityGraph(attributePaths = {
            "family",
            "paymentAccount",
            "createdBy"
    })
    Optional<FinancialCreditCard> findByIdAndFamily_Id(
            UUID cardId,
            UUID familyId
    );

    @EntityGraph(attributePaths = {
            "paymentAccount",
            "createdBy"
    })
    List<FinancialCreditCard>
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
            UUID cardId
    );
}
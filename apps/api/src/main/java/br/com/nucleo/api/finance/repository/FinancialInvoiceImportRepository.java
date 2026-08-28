package br.com.nucleo.api.finance.repository;

import br.com.nucleo.api.finance.domain.FinancialInvoiceImport;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinancialInvoiceImportRepository
        extends JpaRepository<FinancialInvoiceImport, UUID> {

    @EntityGraph(attributePaths = {
            "card", "invoice", "createdBy"
    })
    List<FinancialInvoiceImport>
            findAllByFamily_IdOrderByCreatedAtDesc(UUID familyId);

    @EntityGraph(attributePaths = {
            "family", "card", "invoice", "createdBy"
    })
    Optional<FinancialInvoiceImport>
            findByIdAndFamily_Id(UUID importId, UUID familyId);

    boolean existsByFamily_IdAndCard_IdAndFileHash(
            UUID familyId,
            UUID cardId,
            String fileHash
    );
}

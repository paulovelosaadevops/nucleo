package br.com.nucleo.api.finance.repository;

import br.com.nucleo.api.finance.domain.FinancialTransaction;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinancialCreditCardInvoicePaymentRepository
        extends JpaRepository<FinancialTransaction, UUID> {

    @EntityGraph(attributePaths = {
            "account",
            "creditCardInvoice",
            "creditCardInvoice.creditCard",
            "createdBy"
    })
    Optional<FinancialTransaction>
            findByCreditCardInvoice_Id(UUID invoiceId);

    boolean existsByCreditCardInvoice_Id(UUID invoiceId);
}
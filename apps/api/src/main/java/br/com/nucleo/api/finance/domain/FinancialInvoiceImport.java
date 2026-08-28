package br.com.nucleo.api.finance.domain;

import br.com.nucleo.api.family.domain.Family;
import br.com.nucleo.api.identity.user.domain.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "financial_invoice_imports")
public class FinancialInvoiceImport {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "family_id", nullable = false)
    private Family family;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "card_id", nullable = false)
    private FinancialCreditCard card;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id")
    private FinancialCreditCardInvoice invoice;

    @Column(name = "original_file_name", nullable = false, length = 180)
    private String originalFileName;

    @Column(name = "file_hash", nullable = false, length = 64)
    private String fileHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "file_type", nullable = false, length = 20)
    private FinancialInvoiceImportFileType fileType;

    @Column(name = "parser_name", nullable = false, length = 80)
    private String parserName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FinancialInvoiceImportStatus status;

    @Column(name = "found_count", nullable = false)
    private int foundCount;

    @Column(name = "imported_count", nullable = false)
    private int importedCount;

    @Column(name = "ignored_count", nullable = false)
    private int ignoredCount;

    @Column(name = "duplicated_count", nullable = false)
    private int duplicatedCount;

    @Column(name = "statement_total", precision = 18, scale = 2)
    private BigDecimal statementTotal;

    @Column(name = "imported_total", precision = 18, scale = 2)
    private BigDecimal importedTotal;

    @Column(precision = 18, scale = 2)
    private BigDecimal difference;

    @Column(name = "warning_accepted", nullable = false)
    private boolean warningAccepted;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @Version
    @Column(nullable = false)
    private long version;

    protected FinancialInvoiceImport() {
    }

    public static FinancialInvoiceImport confirmed(
            Family family,
            FinancialCreditCard card,
            FinancialCreditCardInvoice invoice,
            String originalFileName,
            String fileHash,
            FinancialInvoiceImportFileType fileType,
            String parserName,
            int foundCount,
            int importedCount,
            int ignoredCount,
            int duplicatedCount,
            BigDecimal statementTotal,
            BigDecimal importedTotal,
            BigDecimal difference,
            boolean warningAccepted,
            User createdBy
    ) {
        FinancialInvoiceImport item = new FinancialInvoiceImport();
        item.family = Objects.requireNonNull(family);
        item.card = Objects.requireNonNull(card);
        item.invoice = invoice;
        item.originalFileName = normalize(originalFileName, 180);
        item.fileHash = Objects.requireNonNull(fileHash);
        item.fileType = Objects.requireNonNull(fileType);
        item.parserName = normalize(parserName, 80);
        item.status = FinancialInvoiceImportStatus.CONFIRMED;
        item.foundCount = foundCount;
        item.importedCount = importedCount;
        item.ignoredCount = ignoredCount;
        item.duplicatedCount = duplicatedCount;
        item.statementTotal = statementTotal;
        item.importedTotal = importedTotal;
        item.difference = difference;
        item.warningAccepted = warningAccepted;
        item.createdBy = Objects.requireNonNull(createdBy);
        return item;
    }

    public void rolledBack() {
        status = FinancialInvoiceImportStatus.ROLLED_BACK;
    }

    public void updateResult(
            int importedCount,
            int ignoredCount,
            int duplicatedCount,
            BigDecimal importedTotal,
            BigDecimal difference
    ) {
        this.importedCount = importedCount;
        this.ignoredCount = ignoredCount;
        this.duplicatedCount = duplicatedCount;
        this.importedTotal = importedTotal;
        this.difference = difference;
    }

    @PrePersist
    private void onCreate() {
        createdAt = Instant.now();
    }

    private static String normalize(String value, int max) {
        String normalized = Objects.requireNonNull(value)
                .trim()
                .replaceAll("\\s+", " ");
        if (normalized.isEmpty() || normalized.length() > max) {
            throw new IllegalArgumentException("Invalid import text");
        }
        return normalized;
    }

    public UUID getId() { return id; }
    public Family getFamily() { return family; }
    public FinancialCreditCard getCard() { return card; }
    public FinancialCreditCardInvoice getInvoice() { return invoice; }
    public String getOriginalFileName() { return originalFileName; }
    public String getFileHash() { return fileHash; }
    public FinancialInvoiceImportFileType getFileType() { return fileType; }
    public String getParserName() { return parserName; }
    public FinancialInvoiceImportStatus getStatus() { return status; }
    public int getFoundCount() { return foundCount; }
    public int getImportedCount() { return importedCount; }
    public int getIgnoredCount() { return ignoredCount; }
    public int getDuplicatedCount() { return duplicatedCount; }
    public BigDecimal getStatementTotal() { return statementTotal; }
    public BigDecimal getImportedTotal() { return importedTotal; }
    public BigDecimal getDifference() { return difference; }
    public boolean isWarningAccepted() { return warningAccepted; }
    public User getCreatedBy() { return createdBy; }
    public Instant getCreatedAt() { return createdAt; }
    public String getErrorMessage() { return errorMessage; }
}

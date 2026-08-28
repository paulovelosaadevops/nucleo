package br.com.nucleo.api.finance.service;

import br.com.nucleo.api.common.error.ResourceNotFoundException;
import br.com.nucleo.api.family.domain.FamilyMembership;
import br.com.nucleo.api.family.service.FamilyAccessService;
import br.com.nucleo.api.finance.domain.FinancialCategory;
import br.com.nucleo.api.finance.domain.FinancialCategoryType;
import br.com.nucleo.api.finance.domain.FinancialCreditCard;
import br.com.nucleo.api.finance.domain.FinancialCreditCardInstallment;
import br.com.nucleo.api.finance.domain.FinancialCreditCardInvoice;
import br.com.nucleo.api.finance.domain.FinancialCreditCardPurchase;
import br.com.nucleo.api.finance.domain.FinancialCreditCardPurchaseType;
import br.com.nucleo.api.finance.domain.FinancialInvoiceImport;
import br.com.nucleo.api.finance.domain.FinancialInvoiceImportFileType;
import br.com.nucleo.api.finance.domain.FinancialInvoiceImportStatus;
import br.com.nucleo.api.finance.dto.FinancialInvoiceImportConfirmItemRequest;
import br.com.nucleo.api.finance.dto.FinancialInvoiceImportConfirmRequest;
import br.com.nucleo.api.finance.dto.FinancialInvoiceImportItemStatus;
import br.com.nucleo.api.finance.dto.FinancialInvoiceImportItemType;
import br.com.nucleo.api.finance.dto.FinancialInvoiceImportPreviewItemResponse;
import br.com.nucleo.api.finance.dto.FinancialInvoiceImportPreviewResponse;
import br.com.nucleo.api.finance.dto.FinancialInvoiceImportResponse;
import br.com.nucleo.api.finance.dto.FinancialInvoiceImportResultResponse;
import br.com.nucleo.api.finance.dto.FinancialInvoiceImportRollbackResponse;
import br.com.nucleo.api.finance.repository.FinancialCategoryRepository;
import br.com.nucleo.api.finance.repository.FinancialCreditCardInstallmentRepository;
import br.com.nucleo.api.finance.repository.FinancialCreditCardInvoiceRepository;
import br.com.nucleo.api.finance.repository.FinancialCreditCardPurchaseRepository;
import br.com.nucleo.api.finance.repository.FinancialCreditCardRepository;
import br.com.nucleo.api.finance.repository.FinancialInvoiceImportRepository;
import br.com.nucleo.api.finance.service.invoiceimport.InvoiceFileParser;
import br.com.nucleo.api.finance.service.invoiceimport.InvoiceFileSource;
import br.com.nucleo.api.finance.service.invoiceimport.InvoiceFileType;
import br.com.nucleo.api.finance.service.invoiceimport.InvoiceParseException;
import br.com.nucleo.api.finance.service.invoiceimport.ParsedInvoice;
import br.com.nucleo.api.finance.service.invoiceimport.ParsedInvoiceItem;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FinancialInvoiceImportService {
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;
    private static final Map<String, PreviewState> PREVIEWS =
            new ConcurrentHashMap<>();

    private final FamilyAccessService familyAccessService;
    private final FinancialCreditCardRepository cardRepository;
    private final FinancialCreditCardInvoiceRepository invoiceRepository;
    private final FinancialCreditCardPurchaseRepository purchaseRepository;
    private final FinancialCreditCardInstallmentRepository installmentRepository;
    private final FinancialCategoryRepository categoryRepository;
    private final FinancialInvoiceImportRepository importRepository;
    private final List<InvoiceFileParser> parsers;

    public FinancialInvoiceImportService(
            FamilyAccessService familyAccessService,
            FinancialCreditCardRepository cardRepository,
            FinancialCreditCardInvoiceRepository invoiceRepository,
            FinancialCreditCardPurchaseRepository purchaseRepository,
            FinancialCreditCardInstallmentRepository installmentRepository,
            FinancialCategoryRepository categoryRepository,
            FinancialInvoiceImportRepository importRepository,
            List<InvoiceFileParser> parsers
    ) {
        this.familyAccessService = familyAccessService;
        this.cardRepository = cardRepository;
        this.invoiceRepository = invoiceRepository;
        this.purchaseRepository = purchaseRepository;
        this.installmentRepository = installmentRepository;
        this.categoryRepository = categoryRepository;
        this.importRepository = importRepository;
        this.parsers = parsers;
    }

    @Transactional(readOnly = true)
    public FinancialInvoiceImportPreviewResponse preview(
            UUID currentUserId,
            UUID cardId,
            MultipartFile file
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(currentUserId);
        FinancialCreditCard card = requireCard(cardId, membership.getFamily().getId());
        byte[] content = readFile(file);
        InvoiceFileType fileType = detectType(content);
        String fileHash = sha256(content);
        boolean sameFile = importRepository.existsByFamily_IdAndCard_IdAndFileHash(
                membership.getFamily().getId(), cardId, fileHash);
        InvoiceFileSource source = new InvoiceFileSource(
                sanitizeFileName(file.getOriginalFilename()),
                content,
                fileType
        );
        InvoiceFileParser parser = parsers.stream()
                .filter(candidate -> candidate.supports(source))
                .findFirst()
                .orElseThrow(() -> new InvoiceParseException("Formato de arquivo não suportado."));
        ParsedInvoice parsed = parser.parse(source);
        LocalDate referenceMonth = referenceMonth(card, parsed);
        FinancialCreditCardInvoice invoice = invoiceRepository
                .findByCreditCard_IdAndReferenceMonth(cardId, referenceMonth)
                .orElse(null);
        LocalDate dueDate = parsed.dueDate() == null
                ? dueDate(card, YearMonth.from(referenceMonth))
                : parsed.dueDate();
        LocalDate closingDate = parsed.closingDate() == null
                ? closingDate(card, YearMonth.from(dueDate))
                : parsed.closingDate();
        List<FinancialCategory> categories = categoryRepository
                .findAllByFamily_IdOrderByTypeAscNameAsc(membership.getFamily().getId());
        List<FinancialInvoiceImportPreviewItemResponse> items = parsed.items()
                .stream()
                .map(item -> previewItem(
                        membership.getFamily().getId(),
                        cardId,
                        referenceMonth,
                        item,
                        categories
                ))
                .toList();
        BigDecimal processedTotal = items.stream()
                .filter(item -> item.type() != FinancialInvoiceImportItemType.PAYMENT)
                .map(item -> signed(item.type(), item.amount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal statementTotal = parsed.statementTotal() == null
                ? processedTotal
                : parsed.statementTotal();
        BigDecimal difference = statementTotal.subtract(processedTotal);
        String token = UUID.randomUUID().toString();
        FinancialInvoiceImportPreviewResponse response =
                new FinancialInvoiceImportPreviewResponse(
                        token,
                        card.getId(),
                        card.getName(),
                        invoice == null ? null : invoice.getId(),
                        referenceMonth,
                        closingDate,
                        dueDate,
                        statementTotal,
                        processedTotal,
                        difference,
                        source.originalFileName(),
                        fileHash,
                        fileType.name(),
                        parsed.parserName(),
                        sameFile,
                        parsed.warnings(),
                        items
                );
        PREVIEWS.put(token, new PreviewState(currentUserId, response));
        return response;
    }

    @Transactional
    public FinancialInvoiceImportResultResponse confirm(
            UUID currentUserId,
            String token,
            FinancialInvoiceImportConfirmRequest request
    ) {
        PreviewState state = PREVIEWS.get(token);
        if (state == null || !Objects.equals(state.userId(), currentUserId)) {
            throw new ResourceNotFoundException("Pré-visualização expirada.");
        }
        FinancialInvoiceImportPreviewResponse preview = state.preview();
        if (preview.difference().compareTo(BigDecimal.ZERO) != 0
                && !request.acceptDifference()) {
            throw new IllegalArgumentException(
                    "Confirme explicitamente a diferença financeira antes de importar."
            );
        }
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(currentUserId);
        FinancialCreditCard card = requireCard(preview.cardId(), membership.getFamily().getId());
        FinancialCreditCardInvoice invoice = invoiceRepository
                .findByCreditCard_IdAndReferenceMonth(card.getId(), preview.referenceMonth())
                .orElseGet(() -> invoiceRepository.save(FinancialCreditCardInvoice.create(
                        card,
                        preview.referenceMonth(),
                        preview.closingDate(),
                        preview.dueDate()
                )));
        FinancialInvoiceImport batch = FinancialInvoiceImport.confirmed(
                membership.getFamily(),
                card,
                invoice,
                preview.fileName(),
                preview.fileHash(),
                FinancialInvoiceImportFileType.valueOf(preview.fileType()),
                preview.parserName(),
                preview.items().size(),
                0,
                0,
                0,
                preview.statementTotal(),
                BigDecimal.ZERO,
                preview.difference(),
                request.acceptDifference(),
                membership.getUser()
        );
        importRepository.save(batch);

        int imported = 0;
        int ignored = 0;
        int duplicated = 0;
        BigDecimal importedTotal = BigDecimal.ZERO;
        for (FinancialInvoiceImportConfirmItemRequest item : request.items()) {
            FinancialInvoiceImportPreviewItemResponse original = preview.items().stream()
                    .filter(candidate -> candidate.id().equals(item.id()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Item de importação inválido."));
            if (!item.included() || item.type() == FinancialInvoiceImportItemType.PAYMENT) {
                ignored++;
                continue;
            }
            String fingerprint = fingerprint(
                    membership.getFamily().getId(), card.getId(), preview.referenceMonth(),
                    item.date(), item.description(), item.amount(),
                    item.installmentNumber(), item.totalInstallments()
            );
            if (original.status() == FinancialInvoiceImportItemStatus.EXACT_DUPLICATE
                    || purchaseRepository.existsByFamily_IdAndCreditCard_IdAndInvoiceImportFingerprint(
                    membership.getFamily().getId(), card.getId(), fingerprint)) {
                duplicated++;
                continue;
            }
            FinancialCategory category = findCategory(item.categoryId(), membership.getFamily().getId());
            FinancialCreditCardPurchase purchase = FinancialCreditCardPurchase.create(
                    membership.getFamily(),
                    card,
                    category,
                    item.description(),
                    item.amount().abs(),
                    creditCardType(item.type()),
                    item.date(),
                    item.totalInstallments() == null ? 1 : item.totalInstallments(),
                    "Importado de fatura: " + item.type().name(),
                    membership.getUser()
            );
            purchase.markImported(batch, fingerprint);
            purchaseRepository.save(purchase);
            FinancialCreditCardInstallment installment = FinancialCreditCardInstallment.create(
                    purchase,
                    invoice,
                    item.installmentNumber() == null ? 1 : item.installmentNumber(),
                    item.amount().abs()
            );
            installmentRepository.save(installment);
            imported++;
            importedTotal = importedTotal.add(signed(item.type(), item.amount().abs()));
        }
        batch.updateResult(
                imported,
                ignored,
                duplicated,
                importedTotal,
                preview.statementTotal().subtract(importedTotal)
        );
        PREVIEWS.remove(token);
        return new FinancialInvoiceImportResultResponse(
                batch.getId(),
                invoice.getId(),
                imported,
                ignored,
                duplicated,
                importedTotal,
                preview.statementTotal().subtract(importedTotal)
        );
    }

    @Transactional(readOnly = true)
    public List<FinancialInvoiceImportResponse> list(UUID currentUserId) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(currentUserId);
        return importRepository.findAllByFamily_IdOrderByCreatedAtDesc(
                        membership.getFamily().getId())
                .stream()
                .map(FinancialInvoiceImportResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public FinancialInvoiceImportResponse findById(
            UUID currentUserId,
            UUID importId
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(currentUserId);
        return importRepository
                .findByIdAndFamily_Id(importId, membership.getFamily().getId())
                .map(FinancialInvoiceImportResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Importação não encontrada."));
    }

    @Transactional
    public FinancialInvoiceImportRollbackResponse rollback(
            UUID currentUserId,
            UUID importId
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(currentUserId);
        FinancialInvoiceImport batch = importRepository
                .findByIdAndFamily_Id(importId, membership.getFamily().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Importação não encontrada."));
        if (batch.getStatus() == FinancialInvoiceImportStatus.ROLLED_BACK) {
            return new FinancialInvoiceImportRollbackResponse(importId, 0);
        }
        List<FinancialCreditCardPurchase> purchases =
                purchaseRepository.findAllByInvoiceImport_Id(importId);
        for (FinancialCreditCardPurchase purchase : purchases) {
            List<FinancialCreditCardInstallment> installments =
                    installmentRepository.findAllByPurchase_IdOrderByInstallmentNumberAsc(purchase.getId());
            boolean blocked = installments.stream()
                    .anyMatch(installment -> installment.getInvoice().isPaid());
            if (blocked) {
                throw new IllegalArgumentException(
                        "A importação possui lançamento em fatura paga e não pode ser desfeita automaticamente."
                );
            }
            installmentRepository.deleteAll(installments);
        }
        purchaseRepository.deleteAll(purchases);
        batch.rolledBack();
        return new FinancialInvoiceImportRollbackResponse(importId, purchases.size());
    }

    private FinancialInvoiceImportPreviewItemResponse previewItem(
            UUID familyId,
            UUID cardId,
            LocalDate referenceMonth,
            ParsedInvoiceItem item,
            List<FinancialCategory> categories
    ) {
        List<String> problems = new ArrayList<>();
        if (item.description() == null || item.description().isBlank()) {
            problems.add("Descrição ausente.");
        }
        if (item.amount() == null || item.amount().compareTo(BigDecimal.ZERO) <= 0) {
            problems.add("Valor inválido.");
        }
        String fingerprint = fingerprint(
                familyId, cardId, referenceMonth, item.date(), item.description(),
                item.amount(), item.installmentNumber(), item.totalInstallments()
        );
        boolean exactDuplicate =
                purchaseRepository.existsByFamily_IdAndCreditCard_IdAndInvoiceImportFingerprint(
                        familyId, cardId, fingerprint);
        FinancialCategory category = suggestCategory(item.description(), categories);
        FinancialInvoiceImportItemStatus status = problems.isEmpty()
                ? exactDuplicate ? FinancialInvoiceImportItemStatus.EXACT_DUPLICATE : FinancialInvoiceImportItemStatus.NEW
                : FinancialInvoiceImportItemStatus.INVALID;
        return new FinancialInvoiceImportPreviewItemResponse(
                UUID.randomUUID().toString(),
                status == FinancialInvoiceImportItemStatus.NEW,
                item.date(),
                item.description(),
                item.amount().abs(),
                item.installmentNumber(),
                item.totalInstallments(),
                item.type(),
                category == null ? null : category.getId(),
                category == null ? null : category.getName(),
                status,
                fingerprint,
                problems
        );
    }

    private FinancialCreditCard requireCard(UUID cardId, UUID familyId) {
        return cardRepository.findByIdAndFamily_Id(cardId, familyId)
                .orElseThrow(() -> new ResourceNotFoundException("Cartão de crédito não encontrado."));
    }

    private FinancialCategory findCategory(UUID categoryId, UUID familyId) {
        if (categoryId == null) {
            return null;
        }
        FinancialCategory category = categoryRepository.findByIdAndFamily_Id(categoryId, familyId)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria financeira não encontrada."));
        if (category.getType() != FinancialCategoryType.EXPENSE) {
            throw new IllegalArgumentException("A categoria deve ser de despesa.");
        }
        return category;
    }

    private FinancialCategory suggestCategory(String description, List<FinancialCategory> categories) {
        String normalized = normalize(description);
        return categories.stream()
                .filter(FinancialCategory::isActive)
                .filter(category -> category.getType() == FinancialCategoryType.EXPENSE)
                .filter(category -> normalized.contains(normalize(category.getName())))
                .findFirst()
                .orElse(null);
    }

    private static byte[] readFile(MultipartFile file) {
        try {
            if (file == null || file.isEmpty()) {
                throw new InvoiceParseException("Envie um arquivo PDF ou CSV.");
            }
            if (file.getSize() > MAX_FILE_SIZE) {
                throw new InvoiceParseException("Arquivo maior que o limite seguro de 5 MB.");
            }
            return file.getBytes();
        } catch (InvoiceParseException error) {
            throw error;
        } catch (Exception error) {
            throw new InvoiceParseException("Não foi possível ler o arquivo enviado.");
        }
    }

    private static InvoiceFileType detectType(byte[] content) {
        if (content.length >= 4
                && content[0] == '%'
                && content[1] == 'P'
                && content[2] == 'D'
                && content[3] == 'F') {
            return InvoiceFileType.PDF;
        }
        String head = new String(content, 0, Math.min(content.length, 512), StandardCharsets.ISO_8859_1);
        if (head.contains(",") || head.contains(";")) {
            return InvoiceFileType.CSV;
        }
        throw new InvoiceParseException("Tipo real do arquivo não reconhecido.");
    }

    private static LocalDate referenceMonth(FinancialCreditCard card, ParsedInvoice parsed) {
        LocalDate dueDate = parsed.dueDate();
        if (dueDate != null) {
            return dueDate.withDayOfMonth(1);
        }
        LocalDate latest = parsed.items().stream()
                .map(ParsedInvoiceItem::date)
                .max(Comparator.naturalOrder())
                .orElse(LocalDate.now());
        YearMonth closingMonth = YearMonth.from(latest);
        if (latest.getDayOfMonth() >= card.getClosingDay()) {
            closingMonth = closingMonth.plusMonths(1);
        }
        YearMonth dueMonth = card.getDueDay() > card.getClosingDay()
                ? closingMonth
                : closingMonth.plusMonths(1);
        return dueMonth.atDay(1);
    }

    private static LocalDate dueDate(FinancialCreditCard card, YearMonth dueMonth) {
        return dueMonth.atDay(card.getDueDay());
    }

    private static LocalDate closingDate(FinancialCreditCard card, YearMonth dueMonth) {
        YearMonth closingMonth = card.getDueDay() > card.getClosingDay()
                ? dueMonth
                : dueMonth.minusMonths(1);
        return closingMonth.atDay(card.getClosingDay());
    }

    private static FinancialCreditCardPurchaseType creditCardType(
            FinancialInvoiceImportItemType type
    ) {
        return type == FinancialInvoiceImportItemType.CREDIT
                || type == FinancialInvoiceImportItemType.REFUND
                || (type == FinancialInvoiceImportItemType.ADJUSTMENT)
                ? FinancialCreditCardPurchaseType.CREDIT
                : FinancialCreditCardPurchaseType.DEBIT;
    }

    private static BigDecimal signed(FinancialInvoiceImportItemType type, BigDecimal amount) {
        return creditCardType(type) == FinancialCreditCardPurchaseType.CREDIT
                ? amount.abs().negate()
                : amount.abs();
    }

    private static String fingerprint(
            UUID familyId,
            UUID cardId,
            LocalDate referenceMonth,
            LocalDate date,
            String description,
            BigDecimal amount,
            Integer installment,
            Integer totalInstallments
    ) {
        return sha256((
                familyId + "|" + cardId + "|" + referenceMonth + "|" + date + "|"
                        + normalize(description) + "|" + amount.abs() + "|"
                        + installment + "|" + totalInstallments
        ).getBytes(StandardCharsets.UTF_8));
    }

    private static String sha256(byte[] content) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(content);
            StringBuilder result = new StringBuilder();
            for (byte item : digest) {
                result.append(String.format("%02x", item));
            }
            return result.toString();
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException(error);
        }
    }

    private static String normalize(String value) {
        return java.text.Normalizer.normalize(value == null ? "" : value, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(java.util.Locale.ROOT)
                .replaceAll("[^a-z0-9]+", " ")
                .trim()
                .replaceAll("\\s+", " ");
    }

    private static String sanitizeFileName(String value) {
        String fallback = value == null || value.isBlank() ? "fatura" : value;
        String sanitized = fallback.replaceAll("[\\\\/:*?\"<>|\\r\\n]+", "-")
                .trim();
        return sanitized.length() > 180 ? sanitized.substring(0, 180) : sanitized;
    }

    private record PreviewState(
            UUID userId,
            FinancialInvoiceImportPreviewResponse preview
    ) {
    }
}

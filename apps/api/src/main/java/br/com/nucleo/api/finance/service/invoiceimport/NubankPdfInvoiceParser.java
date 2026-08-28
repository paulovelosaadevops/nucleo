package br.com.nucleo.api.finance.service.invoiceimport;

import br.com.nucleo.api.finance.dto.FinancialInvoiceImportItemType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class NubankPdfInvoiceParser extends PdfInvoiceParser {
    private static final Pattern LINE_PATTERN = Pattern.compile(
            "(?m)^(\\d{2}/\\d{2}(?:/\\d{4})?)\\s+(.+?)\\s+(-?R?\\$?\\s*[0-9][0-9.,]*)$"
    );
    private static final Pattern DUE_PATTERN = Pattern.compile(
            "(?i)vencimento\\D+(\\d{2}/\\d{2}/\\d{4})"
    );
    private static final Pattern TOTAL_PATTERN = Pattern.compile(
            "(?i)(?:total(?:\\s+da\\s+fatura)?|valor\\s+total)\\D+R?\\$?\\s*([0-9][0-9.,]*)"
    );

    @Override
    public ParsedInvoice parse(InvoiceFileSource source) {
        String raw = InvoiceImportText.decode(source.content());
        if (!raw.startsWith("%PDF") && !raw.toLowerCase().contains("nubank")) {
            throw new InvoiceParseException("O arquivo não parece ser um PDF válido.");
        }
        String normalized = InvoiceImportText.normalize(raw);
        if (normalized.contains("encrypt") || normalized.contains("senha")) {
            throw new InvoiceParseException("PDF protegido por senha ainda não é suportado.");
        }
        if (!normalized.contains("nubank")) {
            throw new InvoiceParseException("PDF de fatura não reconhecido nesta versão.");
        }

        String text = raw.replace("\\r", "\n").replace("\\n", "\n");
        Matcher matcher = LINE_PATTERN.matcher(text);
        List<ParsedInvoiceItem> items = new ArrayList<>();
        int payments = 0;
        BigDecimal calculated = BigDecimal.ZERO;

        while (matcher.find()) {
            LocalDate date = InvoiceImportText.parseDate(matcher.group(1));
            String description = matcher.group(2).trim();
            BigDecimal signedAmount = InvoiceImportText.parseMoney(matcher.group(3));
            FinancialInvoiceImportItemType type =
                    InvoiceImportText.classify(description, signedAmount);
            if (type == FinancialInvoiceImportItemType.PAYMENT) {
                payments++;
                continue;
            }
            InvoiceImportText.InstallmentInfo installment =
                    InvoiceImportText.installmentInfo(description);
            BigDecimal amount = signedAmount.abs();
            calculated = type == FinancialInvoiceImportItemType.CREDIT
                    || type == FinancialInvoiceImportItemType.REFUND
                    ? calculated.subtract(amount)
                    : calculated.add(amount);
            items.add(new ParsedInvoiceItem(
                    date,
                    installment.baseDescription().isBlank()
                            ? description
                            : installment.baseDescription(),
                    amount,
                    installment.currentInstallment(),
                    installment.totalInstallments(),
                    type
            ));
        }

        if (items.isEmpty()) {
            throw new InvoiceParseException(
                    "PDF sem texto pesquisável ou sem lançamentos reconhecíveis. OCR ainda não está disponível."
            );
        }

        LocalDate dueDate = findDate(DUE_PATTERN, text);
        BigDecimal statementTotal = findMoney(TOTAL_PATTERN, text, calculated);

        return new ParsedInvoice(
                "NubankPdfInvoiceParser",
                "Nubank",
                null,
                null,
                dueDate,
                null,
                null,
                statementTotal,
                payments,
                items,
                payments > 0
                        ? List.of("Pagamento da fatura encontrado e ignorado.")
                        : List.of()
        );
    }

    private static LocalDate findDate(Pattern pattern, String text) {
        Matcher matcher = pattern.matcher(text);
        if (!matcher.find()) {
            return null;
        }
        return InvoiceImportText.parseDate(matcher.group(1));
    }

    private static BigDecimal findMoney(Pattern pattern, String text, BigDecimal fallback) {
        Matcher matcher = pattern.matcher(text);
        if (!matcher.find()) {
            return fallback;
        }
        return InvoiceImportText.parseMoney(matcher.group(1)).abs();
    }
}

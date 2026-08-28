package br.com.nucleo.api.finance.service.invoiceimport;

import br.com.nucleo.api.finance.dto.FinancialInvoiceImportItemType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Component;

@Component
public class GenericCsvInvoiceParser extends CsvInvoiceParser {

    @Override
    public ParsedInvoice parse(InvoiceFileSource source) {
        String text = InvoiceImportText.decode(source.content());
        String[] lines = text.replace("\r\n", "\n").replace('\r', '\n').split("\n");
        if (lines.length == 0) {
            throw new InvoiceParseException("CSV vazio.");
        }

        char delimiter = chooseDelimiter(lines[0]);
        String[] first = split(lines[0], delimiter);
        boolean hasHeader = looksLikeHeader(first);
        int dateIndex = hasHeader ? findColumn(first, "data", "date") : 0;
        int descriptionIndex = hasHeader
                ? findColumn(first, "descricao", "descrição", "estabelecimento", "merchant")
                : 1;
        int amountIndex = hasHeader ? findColumn(first, "valor", "amount") : 2;
        int categoryIndex = hasHeader ? findColumn(first, "categoria", "category") : -1;

        if (dateIndex < 0 || descriptionIndex < 0 || amountIndex < 0) {
            throw new InvoiceParseException(
                    "Não foi possível reconhecer as colunas do CSV. Informe data, descrição e valor."
            );
        }

        List<ParsedInvoiceItem> items = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        for (int index = hasHeader ? 1 : 0; index < lines.length; index++) {
            if (lines[index].isBlank()) {
                continue;
            }
            String[] columns = split(lines[index], delimiter);
            if (columns.length <= Math.max(amountIndex, Math.max(dateIndex, descriptionIndex))) {
                continue;
            }
            LocalDate date = InvoiceImportText.parseDate(columns[dateIndex]);
            String description = columns[descriptionIndex].trim();
            if (categoryIndex >= 0 && categoryIndex < columns.length && !columns[categoryIndex].isBlank()) {
                description = description + " (" + columns[categoryIndex].trim() + ")";
            }
            BigDecimal signedAmount = InvoiceImportText.parseMoney(columns[amountIndex]);
            FinancialInvoiceImportItemType type =
                    InvoiceImportText.classify(description, signedAmount);
            if (type == FinancialInvoiceImportItemType.PAYMENT) {
                continue;
            }
            InvoiceImportText.InstallmentInfo installment =
                    InvoiceImportText.installmentInfo(description);
            BigDecimal amount = signedAmount.abs();
            total = type == FinancialInvoiceImportItemType.CREDIT
                    || type == FinancialInvoiceImportItemType.REFUND
                    ? total.subtract(amount)
                    : total.add(amount);
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
            throw new InvoiceParseException("Nenhum lançamento válido foi encontrado no CSV.");
        }

        return new ParsedInvoice(
                "GenericCsvInvoiceParser",
                null,
                null,
                null,
                null,
                null,
                null,
                total,
                0,
                items,
                List.of()
        );
    }

    private static char chooseDelimiter(String line) {
        return line.chars().filter(ch -> ch == ';').count()
                > line.chars().filter(ch -> ch == ',').count()
                ? ';'
                : ',';
    }

    private static boolean looksLikeHeader(String[] columns) {
        String normalized = String.join(" ", columns).toLowerCase(Locale.ROOT);
        return normalized.contains("data")
                || normalized.contains("date")
                || normalized.contains("valor")
                || normalized.contains("amount");
    }

    private static int findColumn(String[] columns, String... names) {
        for (int index = 0; index < columns.length; index++) {
            String normalized = InvoiceImportText.normalize(columns[index]);
            for (String name : names) {
                if (normalized.equals(InvoiceImportText.normalize(name))
                        || normalized.contains(InvoiceImportText.normalize(name))) {
                    return index;
                }
            }
        }
        return -1;
    }

    private static String[] split(String line, char delimiter) {
        List<String> values = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean quoted = false;
        for (int index = 0; index < line.length(); index++) {
            char ch = line.charAt(index);
            if (ch == '"') {
                quoted = !quoted;
            } else if (ch == delimiter && !quoted) {
                values.add(current.toString());
                current.setLength(0);
            } else {
                current.append(ch);
            }
        }
        values.add(current.toString());
        return values.toArray(String[]::new);
    }
}

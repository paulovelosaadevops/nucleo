package br.com.nucleo.api.finance.service.invoiceimport;

import br.com.nucleo.api.finance.dto.FinancialInvoiceImportItemType;
import java.math.BigDecimal;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoField;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

final class InvoiceImportText {
    private static final Pattern INSTALLMENT_PATTERN = Pattern.compile(
            "(?i)(?:PARC\\s*)?(\\d{1,3})\\s*(?:/|DE)\\s*(\\d{1,3})"
    );

    private InvoiceImportText() {
    }

    static String decode(byte[] content) {
        String utf8 = new String(content, StandardCharsets.UTF_8);
        if (utf8.indexOf('\uFFFD') < 0) {
            return utf8;
        }
        return new String(content, Charset.forName("windows-1252"));
    }

    static String normalize(String value) {
        if (value == null) {
            return "";
        }
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", " ")
                .trim()
                .replaceAll("\\s+", " ");
    }

    static BigDecimal parseMoney(String raw) {
        String value = raw.trim()
                .replaceAll("[^0-9,.-]", "");
        if (value.isBlank()) {
            throw new InvoiceParseException("Valor financeiro inválido.");
        }
        boolean negative = value.startsWith("-") || value.endsWith("-");
        value = value.replace("-", "");
        int comma = value.lastIndexOf(',');
        int dot = value.lastIndexOf('.');
        String normalized;
        if (comma > dot) {
            normalized = value.replace(".", "").replace(',', '.');
        } else if (dot > comma) {
            normalized = value.replace(",", "");
        } else {
            normalized = value;
        }
        BigDecimal amount = new BigDecimal(normalized);
        return negative ? amount.negate() : amount;
    }

    static LocalDate parseDate(String raw) {
        String value = raw.trim();
        DateTimeFormatter[] formatters = {
                DateTimeFormatter.ISO_LOCAL_DATE,
                DateTimeFormatter.ofPattern("dd/MM/uuuu"),
                DateTimeFormatter.ofPattern("d/M/uuuu"),
                new DateTimeFormatterBuilder()
                        .appendPattern("dd/MM")
                        .parseDefaulting(ChronoField.YEAR, LocalDate.now().getYear())
                        .toFormatter()
        };
        for (DateTimeFormatter formatter : formatters) {
            try {
                return LocalDate.parse(value, formatter);
            } catch (DateTimeParseException ignored) {
            }
        }
        throw new InvoiceParseException("Data inválida na fatura.");
    }

    static InstallmentInfo installmentInfo(String description) {
        Matcher matcher = INSTALLMENT_PATTERN.matcher(description);
        if (!matcher.find()) {
            return new InstallmentInfo(null, null, description.trim());
        }
        int current = Integer.parseInt(matcher.group(1));
        int total = Integer.parseInt(matcher.group(2));
        String baseDescription = matcher.replaceAll("")
                .trim()
                .replaceAll("\\s+", " ");
        return new InstallmentInfo(current, total, baseDescription);
    }

    static FinancialInvoiceImportItemType classify(String description, BigDecimal signedAmount) {
        String normalized = normalize(description);
        if (normalized.contains("pagamento")) {
            return FinancialInvoiceImportItemType.PAYMENT;
        }
        if (normalized.contains("iof")) {
            return FinancialInvoiceImportItemType.IOF;
        }
        if (normalized.contains("juros")) {
            return FinancialInvoiceImportItemType.INTEREST;
        }
        if (normalized.contains("tarifa") || normalized.contains("multa")) {
            return FinancialInvoiceImportItemType.FEE;
        }
        if (signedAmount.signum() < 0) {
            if (normalized.contains("estorno")) {
                return FinancialInvoiceImportItemType.REFUND;
            }
            return FinancialInvoiceImportItemType.CREDIT;
        }
        return installmentInfo(description).totalInstallments() == null
                ? FinancialInvoiceImportItemType.PURCHASE
                : FinancialInvoiceImportItemType.INSTALLMENT;
    }

    record InstallmentInfo(
            Integer currentInstallment,
            Integer totalInstallments,
            String baseDescription
    ) {
    }
}

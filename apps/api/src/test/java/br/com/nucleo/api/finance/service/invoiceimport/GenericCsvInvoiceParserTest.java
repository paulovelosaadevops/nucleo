package br.com.nucleo.api.finance.service.invoiceimport;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import br.com.nucleo.api.finance.dto.FinancialInvoiceImportItemType;
import java.math.BigDecimal;
import java.nio.charset.Charset;
import org.junit.jupiter.api.Test;

class GenericCsvInvoiceParserTest {
    private final GenericCsvInvoiceParser parser =
            new GenericCsvInvoiceParser();

    @Test
    void parsesCommaSeparatedCsvWithAmericanDecimal() {
        ParsedInvoice invoice = parser.parse(source("""
                date,description,amount
                2026-09-02,Cafe,12.45
                2026-09-03,Refund,-2.45
                """.getBytes()));

        assertThat(invoice.items()).hasSize(2);
        assertThat(invoice.statementTotal())
                .isEqualByComparingTo(new BigDecimal("10.00"));
        assertThat(invoice.items().get(1).type())
                .isEqualTo(FinancialInvoiceImportItemType.CREDIT);
    }

    @Test
    void parsesSemicolonCsvWithBrazilianDecimalAndInstallment() {
        ParsedInvoice invoice = parser.parse(source("""
                data;descrição;valor
                02/09/2026;Compra PARC 02/10;34,90
                """.getBytes(Charset.forName("windows-1252"))));

        assertThat(invoice.items()).hasSize(1);
        assertThat(invoice.items().get(0).installmentNumber()).isEqualTo(2);
        assertThat(invoice.items().get(0).totalInstallments()).isEqualTo(10);
        assertThat(invoice.items().get(0).amount())
                .isEqualByComparingTo(new BigDecimal("34.90"));
    }

    @Test
    void ignoresInvoicePayments() {
        ParsedInvoice invoice = parser.parse(source("""
                data;descrição;valor
                02/09/2026;Pagamento recebido;-100,00
                03/09/2026;Mercado;50,00
                """.getBytes()));

        assertThat(invoice.items()).hasSize(1);
        assertThat(invoice.items().get(0).description()).isEqualTo("Mercado");
    }

    @Test
    void rejectsUnmappedCsv() {
        assertThatThrownBy(() -> parser.parse(source("abc\nxyz".getBytes())))
                .isInstanceOf(InvoiceParseException.class);
    }

    private static InvoiceFileSource source(byte[] content) {
        return new InvoiceFileSource(
                "fatura.csv",
                content,
                InvoiceFileType.CSV
        );
    }
}

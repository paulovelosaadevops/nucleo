package br.com.nucleo.api.finance.service.invoiceimport;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import br.com.nucleo.api.finance.dto.FinancialInvoiceImportItemType;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;

class NubankPdfInvoiceParserTest {
    private final NubankPdfInvoiceParser parser =
            new NubankPdfInvoiceParser();

    @Test
    void parsesSearchableNubankPdfText() {
        ParsedInvoice invoice = parser.parse(source("""
                %PDF-1.7
                Nubank
                Vencimento 10/09/2026
                Total da fatura R$ 112,50
                02/09/2026 Mercado R$ 100,00
                03/09/2026 IOF R$ 12,50
                04/09/2026 Pagamento recebido -R$ 112,50
                """));

        assertThat(invoice.parserName()).isEqualTo("NubankPdfInvoiceParser");
        assertThat(invoice.dueDate()).hasToString("2026-09-10");
        assertThat(invoice.statementTotal())
                .isEqualByComparingTo(new BigDecimal("112.50"));
        assertThat(invoice.ignoredPaymentCount()).isEqualTo(1);
        assertThat(invoice.items()).hasSize(2);
        assertThat(invoice.items().get(1).type())
                .isEqualTo(FinancialInvoiceImportItemType.IOF);
    }

    @Test
    void rejectsImageOnlyPdf() {
        assertThatThrownBy(() -> parser.parse(source("%PDF-1.7\nNubank\n")))
                .isInstanceOf(InvoiceParseException.class)
                .hasMessageContaining("OCR");
    }

    @Test
    void rejectsProtectedPdf() {
        assertThatThrownBy(() -> parser.parse(source("%PDF-1.7\nNubank\nEncrypt")))
                .isInstanceOf(InvoiceParseException.class)
                .hasMessageContaining("senha");
    }

    private static InvoiceFileSource source(String text) {
        return new InvoiceFileSource(
                "nubank.pdf",
                text.getBytes(StandardCharsets.UTF_8),
                InvoiceFileType.PDF
        );
    }
}

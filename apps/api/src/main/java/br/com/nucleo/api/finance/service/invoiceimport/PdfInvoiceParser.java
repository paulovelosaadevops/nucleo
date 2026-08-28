package br.com.nucleo.api.finance.service.invoiceimport;

public abstract class PdfInvoiceParser implements InvoiceFileParser {
    @Override
    public boolean supports(InvoiceFileSource source) {
        return source.fileType() == InvoiceFileType.PDF;
    }
}

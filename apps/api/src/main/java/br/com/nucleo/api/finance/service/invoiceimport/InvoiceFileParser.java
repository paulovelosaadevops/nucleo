package br.com.nucleo.api.finance.service.invoiceimport;

public interface InvoiceFileParser {
    boolean supports(InvoiceFileSource source);

    ParsedInvoice parse(InvoiceFileSource source);
}

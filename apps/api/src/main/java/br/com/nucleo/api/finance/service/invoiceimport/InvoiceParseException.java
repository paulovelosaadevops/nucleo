package br.com.nucleo.api.finance.service.invoiceimport;

public class InvoiceParseException extends RuntimeException {
    public InvoiceParseException(String message) {
        super(message);
    }
}

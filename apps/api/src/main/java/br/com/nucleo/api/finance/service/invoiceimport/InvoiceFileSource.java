package br.com.nucleo.api.finance.service.invoiceimport;

public record InvoiceFileSource(
        String originalFileName,
        byte[] content,
        InvoiceFileType fileType
) {
}

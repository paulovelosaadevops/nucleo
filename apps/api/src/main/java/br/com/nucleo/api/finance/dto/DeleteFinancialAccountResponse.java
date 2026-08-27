package br.com.nucleo.api.finance.dto;

public record DeleteFinancialAccountResponse(
        boolean archived,
        String message
) {}

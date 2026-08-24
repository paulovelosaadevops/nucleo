package br.com.nucleo.api.finance.dto;

import java.time.LocalDate;

public record GenerateFinancialRecurrencesResponse(
        LocalDate generatedUntil,
        int processedRecurrences,
        int createdTransactions,
        int createdCreditCardPurchases
) {
}
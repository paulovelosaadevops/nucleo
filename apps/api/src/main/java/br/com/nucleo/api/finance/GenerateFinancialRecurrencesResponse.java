package br.com.nucleo.api.finance;

import java.time.LocalDate;

public record GenerateFinancialRecurrencesResponse(
        LocalDate generatedUntil,
        int processedRecurrences,
        int createdTransactions
) {
}
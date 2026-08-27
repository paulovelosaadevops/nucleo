package br.com.nucleo.api.finance.dto;

import jakarta.validation.constraints.Size;

public record SkipFinancialRecurrenceOccurrenceRequest(
        @Size(max = 1000) String notes
) {
}

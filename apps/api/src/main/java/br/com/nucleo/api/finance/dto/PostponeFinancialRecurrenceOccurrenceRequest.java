package br.com.nucleo.api.finance.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record PostponeFinancialRecurrenceOccurrenceRequest(
        @NotNull LocalDate reminderDate
) {
}

package br.com.nucleo.api.finance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record ReconcileInvestmentRequest(
        @NotNull @DecimalMin("0.00") @Digits(integer = 16, fraction = 2) BigDecimal realBalance,
        @NotNull LocalDate referenceDate,
        @Size(max = 1000) String notes
) {}

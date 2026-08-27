package br.com.nucleo.api.finance.dto;

import br.com.nucleo.api.finance.domain.FinancialInvestmentAccrualStartRule;
import br.com.nucleo.api.finance.domain.FinancialInvestmentModality;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateFinancialInvestmentRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Size(max = 120) String institution,
        @NotNull FinancialInvestmentModality modality,
        @NotNull LocalDate startDate,
        @DecimalMin("0.00") @Digits(integer = 16, fraction = 2) BigDecimal initialAmount,
        LocalDate maturityDate,
        @Size(max = 80) String liquidity,
        BigDecimal benchmarkPercentage,
        BigDecimal annualFixedRate,
        BigDecimal annualSpreadRate,
        boolean taxExempt,
        boolean autoCalculate,
        FinancialInvestmentAccrualStartRule accrualStartRule,
        @Size(max = 1000) String notes
) {}

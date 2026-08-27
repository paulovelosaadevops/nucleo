package br.com.nucleo.api.finance.dto;

import br.com.nucleo.api.finance.domain.FinancialInvestmentValuationStatus;
import java.math.BigDecimal;
import java.time.LocalDate;

public record FinancialInvestmentDashboardResponse(
        BigDecimal investedBalance,
        BigDecimal contributedThisMonth,
        BigDecimal gainOrLossThisMonth,
        BigDecimal monthlyReturnPercentage,
        FinancialInvestmentValuationStatus valuationStatus,
        LocalDate lastUpdatedAt
) {}

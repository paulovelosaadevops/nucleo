package br.com.nucleo.api.finance.dto;

import br.com.nucleo.api.finance.domain.FinancialInvestment;
import br.com.nucleo.api.finance.domain.FinancialInvestmentModality;
import br.com.nucleo.api.finance.domain.FinancialInvestmentValuationStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record FinancialInvestmentResponse(
        UUID id,
        UUID accountId,
        String name,
        String institution,
        FinancialInvestmentModality modality,
        BigDecimal benchmarkPercentage,
        BigDecimal annualFixedRate,
        BigDecimal annualSpreadRate,
        BigDecimal currentBalance,
        BigDecimal totalContributed,
        BigDecimal totalRedeemed,
        BigDecimal accumulatedYield,
        BigDecimal accumulatedReturnPercentage,
        FinancialInvestmentValuationStatus valuationStatus,
        LocalDate lastUpdatedAt,
        boolean taxExempt,
        boolean autoCalculate,
        List<FinancialInvestmentMovementResponse> movements
) {
    public static FinancialInvestmentResponse from(
            FinancialInvestment investment,
            BigDecimal returnPercentage,
            List<FinancialInvestmentMovementResponse> movements
    ) {
        return new FinancialInvestmentResponse(
                investment.getId(),
                investment.getAccount().getId(),
                investment.getName(),
                investment.getInstitution(),
                investment.getModality(),
                investment.getBenchmarkPercentage(),
                investment.getAnnualFixedRate(),
                investment.getAnnualSpreadRate(),
                investment.getCalculatedBalance(),
                investment.getTotalContributed(),
                investment.getTotalRedeemed(),
                investment.getAccumulatedYield(),
                returnPercentage,
                investment.getRealBalance() == null
                        ? FinancialInvestmentValuationStatus.ESTIMATED
                        : FinancialInvestmentValuationStatus.RECONCILED,
                investment.getLastReconciledAt() == null
                        ? investment.getLastCalculatedAt()
                        : investment.getLastReconciledAt(),
                investment.isTaxExempt(),
                investment.isAutoCalculate(),
                movements
        );
    }
}

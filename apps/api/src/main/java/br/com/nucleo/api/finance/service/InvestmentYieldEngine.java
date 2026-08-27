package br.com.nucleo.api.finance.service;

import br.com.nucleo.api.finance.domain.FinancialInvestmentModality;
import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import org.springframework.stereotype.Component;

@Component
public class InvestmentYieldEngine {
    private static final MathContext MC = new MathContext(20, RoundingMode.HALF_UP);
    private static final BigDecimal ONE_HUNDRED = new BigDecimal("100");
    private static final BigDecimal BUSINESS_DAYS = new BigDecimal("252");

    public BigDecimal dailyFactor(
            FinancialInvestmentModality modality,
            BigDecimal indexAnnualRate,
            BigDecimal benchmarkPercentage,
            BigDecimal annualFixedRate,
            BigDecimal annualSpreadRate
    ) {
        return switch (modality) {
            case PERCENT_CDI, PERCENT_SELIC -> BigDecimal.ONE.add(
                    dailyBenchmarkRate(indexAnnualRate)
                            .multiply(defaultValue(benchmarkPercentage, ONE_HUNDRED), MC)
                            .divide(ONE_HUNDRED, MC),
                    MC
            );
            case CDI_PLUS -> BigDecimal.ONE.add(dailyBenchmarkRate(indexAnnualRate), MC)
                    .multiply(fixedDailyFactor(defaultValue(annualSpreadRate, BigDecimal.ZERO)), MC);
            case FIXED_RATE -> fixedDailyFactor(defaultValue(annualFixedRate, BigDecimal.ZERO));
            case IPCA_PLUS -> fixedDailyFactor(defaultValue(annualFixedRate, BigDecimal.ZERO));
            case SAVINGS -> fixedDailyFactor(defaultValue(annualFixedRate, BigDecimal.ZERO));
            case MANUAL, NO_YIELD -> BigDecimal.ONE;
        };
    }

    public BigDecimal grossYield(BigDecimal balance, BigDecimal factor) {
        return balance.multiply(factor.subtract(BigDecimal.ONE, MC), MC)
                .setScale(8, RoundingMode.HALF_UP);
    }

    public BigDecimal modifiedDietz(
            BigDecimal startBalance,
            BigDecimal endBalance,
            BigDecimal netFlows,
            BigDecimal weightedFlows
    ) {
        BigDecimal denominator = startBalance.add(weightedFlows, MC);
        if (denominator.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return endBalance.subtract(startBalance, MC)
                .subtract(netFlows, MC)
                .divide(denominator, 8, RoundingMode.HALF_UP)
                .multiply(ONE_HUNDRED, MC);
    }

    private BigDecimal dailyBenchmarkRate(BigDecimal annualRate) {
        double rate = defaultValue(annualRate, BigDecimal.ZERO)
                .divide(ONE_HUNDRED, MC)
                .add(BigDecimal.ONE, MC)
                .doubleValue();
        return BigDecimal.valueOf(Math.pow(rate, 1.0 / BUSINESS_DAYS.doubleValue()) - 1.0);
    }

    private BigDecimal fixedDailyFactor(BigDecimal annualRate) {
        double rate = annualRate.divide(ONE_HUNDRED, MC)
                .add(BigDecimal.ONE, MC)
                .doubleValue();
        return BigDecimal.valueOf(Math.pow(rate, 1.0 / BUSINESS_DAYS.doubleValue()));
    }

    private BigDecimal defaultValue(BigDecimal value, BigDecimal fallback) {
        return value == null ? fallback : value;
    }
}

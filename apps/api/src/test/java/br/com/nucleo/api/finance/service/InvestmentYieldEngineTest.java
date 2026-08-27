package br.com.nucleo.api.finance.service;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.nucleo.api.finance.domain.FinancialInvestmentModality;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class InvestmentYieldEngineTest {
    private final InvestmentYieldEngine engine = new InvestmentYieldEngine();

    @Test
    void cdiPercentageProducesDailyYield() {
        BigDecimal factor = engine.dailyFactor(
                FinancialInvestmentModality.PERCENT_CDI,
                new BigDecimal("13.15"),
                new BigDecimal("120"),
                null,
                null
        );

        BigDecimal yield = engine.grossYield(new BigDecimal("1000.00"), factor);

        assertThat(factor).isGreaterThan(BigDecimal.ONE);
        assertThat(yield).isGreaterThan(BigDecimal.ZERO);
    }

    @Test
    void noYieldDoesNotChangeBalance() {
        BigDecimal factor = engine.dailyFactor(
                FinancialInvestmentModality.NO_YIELD,
                new BigDecimal("13.15"),
                new BigDecimal("120"),
                null,
                null
        );

        assertThat(engine.grossYield(new BigDecimal("1000.00"), factor))
                .isEqualByComparingTo("0.00000000");
    }

    @Test
    void modifiedDietzExcludesWeightedFlowsFromPerformance() {
        BigDecimal result = engine.modifiedDietz(
                new BigDecimal("1000.00"),
                new BigDecimal("1120.00"),
                new BigDecimal("100.00"),
                new BigDecimal("50.00")
        );

        assertThat(result).isEqualByComparingTo("1.90476200");
    }
}

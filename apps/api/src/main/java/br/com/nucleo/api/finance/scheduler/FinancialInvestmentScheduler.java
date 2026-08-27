package br.com.nucleo.api.finance.scheduler;

import br.com.nucleo.api.finance.service.FinancialInvestmentService;
import br.com.nucleo.api.finance.service.FinancialMarketIndexService;
import java.time.LocalDate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class FinancialInvestmentScheduler {
    private final FinancialMarketIndexService marketIndexService;
    private final FinancialInvestmentService investmentService;

    public FinancialInvestmentScheduler(
            FinancialMarketIndexService marketIndexService,
            FinancialInvestmentService investmentService
    ) {
        this.marketIndexService = marketIndexService;
        this.investmentService = investmentService;
    }

    @Scheduled(cron = "0 20 7 * * MON-FRI", zone = "America/Sao_Paulo")
    public void refreshIndexesAndYields() {
        LocalDate today = LocalDate.now();
        marketIndexService.refreshOfficialIndexes(today.minusDays(10), today);
        investmentService.processAutomaticYields(today.minusDays(1));
    }
}

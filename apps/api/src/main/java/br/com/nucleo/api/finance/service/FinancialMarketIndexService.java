package br.com.nucleo.api.finance.service;

import br.com.nucleo.api.finance.domain.FinancialMarketIndex;
import br.com.nucleo.api.finance.domain.FinancialMarketIndexValue;
import br.com.nucleo.api.finance.integration.MarketIndexProvider;
import br.com.nucleo.api.finance.integration.MarketIndexQuote;
import br.com.nucleo.api.finance.repository.FinancialMarketIndexRepository;
import br.com.nucleo.api.finance.repository.FinancialMarketIndexValueRepository;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FinancialMarketIndexService {
    private final FinancialMarketIndexRepository indexRepository;
    private final FinancialMarketIndexValueRepository valueRepository;
    private final List<MarketIndexProvider> providers;

    public FinancialMarketIndexService(
            FinancialMarketIndexRepository indexRepository,
            FinancialMarketIndexValueRepository valueRepository,
            List<MarketIndexProvider> providers
    ) {
        this.indexRepository = indexRepository;
        this.valueRepository = valueRepository;
        this.providers = providers;
    }

    @Transactional
    public void refreshOfficialIndexes(LocalDate from, LocalDate to) {
        for (String code : List.of("CDI", "SELIC", "IPCA", "TR")) {
            for (MarketIndexProvider provider : providers) {
                FinancialMarketIndex index = indexRepository
                        .findByCodeAndSource(code, provider.source())
                        .orElseGet(() -> indexRepository.save(
                                FinancialMarketIndex.create(
                                        code,
                                        code,
                                        "% a.a.",
                                        "DAILY",
                                        provider.source()
                                )
                        ));
                for (MarketIndexQuote quote : provider.fetch(code, from, to)) {
                    boolean exists = valueRepository
                            .existsByMarketIndex_IdAndReferenceDateAndSource(
                                    index.getId(),
                                    quote.referenceDate(),
                                    provider.source()
                            );
                    if (!exists) {
                        valueRepository.save(FinancialMarketIndexValue.official(
                                index,
                                quote.referenceDate(),
                                quote.annualRate(),
                                "% a.a.",
                                "DAILY",
                                provider.source(),
                                quote.rawContent()
                        ));
                    }
                }
            }
        }
    }
}

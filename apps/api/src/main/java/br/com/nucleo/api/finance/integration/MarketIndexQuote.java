package br.com.nucleo.api.finance.integration;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MarketIndexQuote(
        String code,
        LocalDate referenceDate,
        BigDecimal annualRate,
        String rawContent
) {
}

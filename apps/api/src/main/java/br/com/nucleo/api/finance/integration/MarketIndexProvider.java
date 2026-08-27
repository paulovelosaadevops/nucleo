package br.com.nucleo.api.finance.integration;

import java.time.LocalDate;
import java.util.List;

public interface MarketIndexProvider {
    String source();

    List<MarketIndexQuote> fetch(String code, LocalDate from, LocalDate to);
}

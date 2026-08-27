package br.com.nucleo.api.finance.integration;

import java.math.BigDecimal;
import java.net.URI;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class BancoCentralSgsMarketIndexProvider implements MarketIndexProvider {
    private static final DateTimeFormatter BR_DATE =
            DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final Map<String, String> SGS_CODES = Map.of(
            "CDI", "12",
            "SELIC", "11",
            "IPCA", "433",
            "TR", "226"
    );

    private final RestClient restClient = RestClient.create();

    @Override
    public String source() {
        return "BANCO_CENTRAL_SGS";
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<MarketIndexQuote> fetch(String code, LocalDate from, LocalDate to) {
        String sgs = SGS_CODES.get(code);
        if (sgs == null) {
            return List.of();
        }

        try {
            URI uri = URI.create(
                    "https://api.bcb.gov.br/dados/serie/bcdata.sgs."
                            + sgs
                            + "/dados?formato=json&dataInicial="
                            + BR_DATE.format(from)
                            + "&dataFinal="
                            + BR_DATE.format(to)
            );
            List<Map<String, String>> payload = restClient.get()
                    .uri(uri)
                    .retrieve()
                    .body(List.class);
            if (payload == null) {
                return List.of();
            }

            List<MarketIndexQuote> quotes = new ArrayList<>();
            for (Map<String, String> item : payload) {
                quotes.add(new MarketIndexQuote(
                        code,
                        LocalDate.parse(item.get("data"), BR_DATE),
                        new BigDecimal(item.get("valor").replace(",", ".")),
                        item.toString()
                ));
            }
            return quotes;
        } catch (RuntimeException exception) {
            return List.of();
        }
    }
}

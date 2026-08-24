package br.com.nucleo.api.finance.scheduler;

import br.com.nucleo.api.finance.dto.GenerateFinancialRecurrencesResponse;
import br.com.nucleo.api.finance.service.FinancialRecurrenceService;
import java.time.LocalDate;
import java.time.ZoneId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class FinancialRecurrenceScheduler {

    private static final Logger LOGGER =
            LoggerFactory.getLogger(
                    FinancialRecurrenceScheduler.class
            );

    private static final String APPLICATION_TIME_ZONE =
            "America/Sao_Paulo";

    private final FinancialRecurrenceService recurrenceService;

    public FinancialRecurrenceScheduler(
            FinancialRecurrenceService recurrenceService
    ) {
        this.recurrenceService = recurrenceService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void generateWhenApplicationStarts() {
        generateDueRecurrences("inicialização");
    }

    @Scheduled(
            cron = "0 5 0 * * *",
            zone = APPLICATION_TIME_ZONE
    )
    public void generateEveryDay() {
        generateDueRecurrences("agendamento diário");
    }

    private void generateDueRecurrences(String trigger) {
        LocalDate today = LocalDate.now(
                ZoneId.of(APPLICATION_TIME_ZONE)
        );

        try {
            GenerateFinancialRecurrencesResponse result =
                    recurrenceService
                            .generateDueAutomatically(today);

            int createdItems =
                    result.createdTransactions()
                            + result.createdCreditCardPurchases();

            if (createdItems > 0) {
                LOGGER.info(
                        "Geração automática de recorrências concluída por {}: data={}, recorrências={}, lançamentos={}, comprasCartão={}",
                        trigger,
                        result.generatedUntil(),
                        result.processedRecurrences(),
                        result.createdTransactions(),
                        result.createdCreditCardPurchases()
                );
            } else {
                LOGGER.debug(
                        "Nenhuma recorrência pendente na geração por {} para {}",
                        trigger,
                        today
                );
            }
        } catch (RuntimeException exception) {
            LOGGER.error(
                    "Falha na geração automática de recorrências por {} para {}",
                    trigger,
                    today,
                    exception
            );
        }
    }
}
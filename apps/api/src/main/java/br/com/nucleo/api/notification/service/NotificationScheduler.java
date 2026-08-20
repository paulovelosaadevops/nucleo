package br.com.nucleo.api.notification.service;

import br.com.nucleo.api.agenda.domain.AgendaOccurrence;
import br.com.nucleo.api.agenda.domain.AgendaReminder;
import br.com.nucleo.api.agenda.domain.OccurrenceStatus;
import br.com.nucleo.api.agenda.repository.AgendaOccurrenceRepository;
import br.com.nucleo.api.agenda.repository.AgendaReminderRepository;
import br.com.nucleo.api.finance.domain.FinancialCreditCardInvoice;
import br.com.nucleo.api.finance.domain.FinancialCreditCardInvoiceStatus;
import br.com.nucleo.api.finance.domain.FinancialTransaction;
import br.com.nucleo.api.finance.domain.FinancialTransactionStatus;
import br.com.nucleo.api.finance.domain.FinancialTransactionType;
import br.com.nucleo.api.finance.repository.FinancialCreditCardInvoiceRepository;
import br.com.nucleo.api.finance.repository.FinancialTransactionRepository;
import br.com.nucleo.api.notification.domain.NotificationType;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@ConditionalOnProperty(
        name = "app.notifications.scheduler-enabled",
        havingValue = "true",
        matchIfMissing = true
)
public class NotificationScheduler {

    private static final Duration MAXIMUM_AGENDA_LOOKAHEAD =
            Duration.ofDays(7).plusMinutes(5);

    private static final int FINANCE_LOOKAHEAD_DAYS = 3;

    private final AgendaOccurrenceRepository occurrenceRepository;
    private final AgendaReminderRepository reminderRepository;
    private final FinancialTransactionRepository transactionRepository;
    private final FinancialCreditCardInvoiceRepository invoiceRepository;
    private final NotificationService notificationService;

    public NotificationScheduler(
            AgendaOccurrenceRepository occurrenceRepository,
            AgendaReminderRepository reminderRepository,
            FinancialTransactionRepository transactionRepository,
            FinancialCreditCardInvoiceRepository invoiceRepository,
            NotificationService notificationService
    ) {
        this.occurrenceRepository = occurrenceRepository;
        this.reminderRepository = reminderRepository;
        this.transactionRepository = transactionRepository;
        this.invoiceRepository = invoiceRepository;
        this.notificationService = notificationService;
    }

    @Scheduled(
            cron = "${app.notifications.scheduler-cron:0 * * * * *}",
            zone = "UTC"
    )
    @Transactional
    public void generateNotifications() {
        generateAgendaReminders();
        generateTransactionDueNotifications();
        generateInvoiceDueNotifications();
    }

    private void generateAgendaReminders() {
        Instant now = Instant.now();

        List<AgendaOccurrence> occurrences =
                occurrenceRepository
                        .findAllScheduledForNotifications(
                                OccurrenceStatus.SCHEDULED,
                                now.minusSeconds(120),
                                now.plus(
                                        MAXIMUM_AGENDA_LOOKAHEAD
                                )
                        );

        for (AgendaOccurrence occurrence : occurrences) {
            List<AgendaReminder> reminders =
                    reminderRepository
                            .findAllByEvent_IdOrderByMinutesBeforeAsc(
                                    occurrence.getEvent().getId()
                            );

            for (AgendaReminder reminder : reminders) {
                Instant notificationTime =
                        occurrence
                                .getOccurrenceStartsAt()
                                .minus(
                                        Duration.ofMinutes(
                                                reminder.getMinutesBefore()
                                        )
                                );

                if (notificationTime.isAfter(now)) {
                    continue;
                }

                if (
                        occurrence.getOccurrenceStartsAt()
                                .isBefore(now.minusSeconds(120))
                ) {
                    continue;
                }

                notificationService.notifyActiveFamilyMembers(
                        occurrence.getEvent().getFamily(),
                        null,
                        NotificationType.AGENDA_REMINDER,
                        "Lembrete da agenda",
                        "O compromisso “"
                                + occurrence.getEvent().getTitle()
                                + "” está próximo.",
                        "/agenda?occurrenceId="
                                + occurrence.getId(),
                        occurrence.getId(),
                        "agenda-reminder:"
                                + occurrence.getId()
                                + ":"
                                + reminder.getMinutesBefore()
                );
            }
        }
    }

    private void generateTransactionDueNotifications() {
        LocalDate today = LocalDate.now();
        LocalDate periodEnd =
                today.plusDays(FINANCE_LOOKAHEAD_DAYS);

        List<FinancialTransaction> transactions =
                transactionRepository
                        .findAllDueForNotifications(
                                FinancialTransactionStatus.PENDING,
                                FinancialTransactionType.EXPENSE,
                                today,
                                periodEnd
                        );

        for (FinancialTransaction transaction : transactions) {
            notificationService.notifyActiveFamilyMembers(
                    transaction.getFamily(),
                    null,
                    NotificationType.FINANCIAL_TRANSACTION_DUE,
                    "Despesa próxima do vencimento",
                    "A despesa “"
                            + transaction.getDescription()
                            + "” vence em "
                            + transaction.getDueDate()
                            + ".",
                    "/financas?transactionId="
                            + transaction.getId(),
                    transaction.getId(),
                    "financial-transaction-due:"
                            + transaction.getId()
                            + ":"
                            + transaction.getDueDate()
            );
        }
    }

    private void generateInvoiceDueNotifications() {
        LocalDate today = LocalDate.now();
        LocalDate periodEnd =
                today.plusDays(FINANCE_LOOKAHEAD_DAYS);

        List<FinancialCreditCardInvoice> invoices =
                invoiceRepository.findAllDueForNotifications(
                        List.of(
                                FinancialCreditCardInvoiceStatus.OPEN,
                                FinancialCreditCardInvoiceStatus.CLOSED
                        ),
                        today,
                        periodEnd
                );

        for (FinancialCreditCardInvoice invoice : invoices) {
            notificationService.notifyActiveFamilyMembers(
                    invoice.getCreditCard().getFamily(),
                    null,
                    NotificationType.CREDIT_CARD_INVOICE_DUE,
                    "Fatura próxima do vencimento",
                    "A fatura do cartão “"
                            + invoice.getCreditCard().getName()
                            + "” vence em "
                            + invoice.getDueDate()
                            + ".",
                    "/financas/cartoes?invoiceId="
                            + invoice.getId(),
                    invoice.getId(),
                    "credit-card-invoice-due:"
                            + invoice.getId()
                            + ":"
                            + invoice.getDueDate()
            );
        }
    }
}
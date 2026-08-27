package br.com.nucleo.api.finance.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class FinancialBusinessCalendar {
    private static final Set<String> NATIONAL_HOLIDAYS = Set.of(
            "01-01", "04-21", "05-01", "09-07", "10-12",
            "11-02", "11-15", "12-25"
    );

    public boolean isBusinessDay(LocalDate date) {
        DayOfWeek day = date.getDayOfWeek();
        return day != DayOfWeek.SATURDAY
                && day != DayOfWeek.SUNDAY
                && !NATIONAL_HOLIDAYS.contains(
                        "%02d-%02d".formatted(
                                date.getMonthValue(),
                                date.getDayOfMonth()
                        )
                );
    }

    public LocalDate nextBusinessDay(LocalDate date) {
        LocalDate current = date;
        do {
            current = current.plusDays(1);
        } while (!isBusinessDay(current));
        return current;
    }
}

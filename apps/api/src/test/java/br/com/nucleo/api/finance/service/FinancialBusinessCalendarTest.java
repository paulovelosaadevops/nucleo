package br.com.nucleo.api.finance.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class FinancialBusinessCalendarTest {
    private final FinancialBusinessCalendar calendar = new FinancialBusinessCalendar();

    @Test
    void weekendsAreNotBusinessDays() {
        assertThat(calendar.isBusinessDay(LocalDate.of(2026, 8, 22))).isFalse();
        assertThat(calendar.isBusinessDay(LocalDate.of(2026, 8, 24))).isTrue();
    }

    @Test
    void fixedNationalHolidayIsNotBusinessDay() {
        assertThat(calendar.isBusinessDay(LocalDate.of(2026, 9, 7))).isFalse();
    }

    @Test
    void nextBusinessDaySkipsWeekend() {
        assertThat(calendar.nextBusinessDay(LocalDate.of(2026, 8, 21)))
                .isEqualTo(LocalDate.of(2026, 8, 24));
    }
}

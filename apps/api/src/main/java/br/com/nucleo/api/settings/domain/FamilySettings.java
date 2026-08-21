package br.com.nucleo.api.settings.domain;

import br.com.nucleo.api.family.domain.Family;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "family_settings")
public class FamilySettings {

    private static final String DEFAULT_CURRENCY = "BRL";
    private static final String DEFAULT_LOCALE = "pt-BR";
    private static final WeekStartDay DEFAULT_WEEK_START_DAY =
            WeekStartDay.MONDAY;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "family_id",
            nullable = false,
            unique = true
    )
    private Family family;

    @Column(
            name = "default_currency",
            nullable = false,
            length = 3
    )
    private String defaultCurrency;

    @Column(nullable = false, length = 20)
    private String locale;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "week_start_day",
            nullable = false,
            length = 10
    )
    private WeekStartDay weekStartDay;

    @Column(
            name = "created_at",
            nullable = false,
            updatable = false
    )
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private long version;

    protected FamilySettings() {
    }

    private FamilySettings(Family family) {
        this.family = Objects.requireNonNull(
                family,
                "Family cannot be null"
        );
        this.defaultCurrency = DEFAULT_CURRENCY;
        this.locale = DEFAULT_LOCALE;
        this.weekStartDay = DEFAULT_WEEK_START_DAY;
    }

    public static FamilySettings createDefault(Family family) {
        return new FamilySettings(family);
    }

    public void update(
            String defaultCurrency,
            String locale,
            WeekStartDay weekStartDay
    ) {
        this.defaultCurrency =
                normalizeCurrency(defaultCurrency);
        this.locale = normalizeLocale(locale);
        this.weekStartDay = Objects.requireNonNull(
                weekStartDay,
                "Week start day cannot be null"
        );
    }

    @PrePersist
    private void onCreate() {
        Instant now = Instant.now();

        if (
                defaultCurrency == null
                        || defaultCurrency.isBlank()
        ) {
            defaultCurrency = DEFAULT_CURRENCY;
        }

        if (locale == null || locale.isBlank()) {
            locale = DEFAULT_LOCALE;
        }

        if (weekStartDay == null) {
            weekStartDay = DEFAULT_WEEK_START_DAY;
        }

        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    private void onUpdate() {
        updatedAt = Instant.now();
    }

    private static String normalizeCurrency(String value) {
        String normalized = Objects.requireNonNull(
                value,
                "Currency cannot be null"
        ).trim().toUpperCase(Locale.ROOT);

        if (!normalized.matches("^[A-Z]{3}$")) {
            throw new IllegalArgumentException(
                    "Currency must use a three-letter ISO code"
            );
        }

        return normalized;
    }

    private static String normalizeLocale(String value) {
        String normalized = Objects.requireNonNull(
                value,
                "Locale cannot be null"
        ).trim().replace('_', '-');

        if (
                normalized.length() < 2
                        || normalized.length() > 20
                        || !normalized.matches(
                                "^[a-zA-Z]{2,8}"
                                        + "(-[a-zA-Z0-9]{1,8})*$"
                        )
        ) {
            throw new IllegalArgumentException(
                    "Invalid locale"
            );
        }

        Locale parsedLocale =
                Locale.forLanguageTag(normalized);

        if (parsedLocale.getLanguage().isBlank()) {
            throw new IllegalArgumentException(
                    "Invalid locale"
            );
        }

        return parsedLocale.toLanguageTag();
    }

    public UUID getId() {
        return id;
    }

    public Family getFamily() {
        return family;
    }

    public String getDefaultCurrency() {
        return defaultCurrency;
    }

    public String getLocale() {
        return locale;
    }

    public WeekStartDay getWeekStartDay() {
        return weekStartDay;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public long getVersion() {
        return version;
    }
}
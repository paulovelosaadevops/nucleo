package br.com.nucleo.api.identity.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 254)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserStatus status;

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private long version;

    protected User() {
    }

    private User(String name, String email, String passwordHash) {
        this.name = normalizeName(name);
        this.email = normalizeEmail(email);
        this.passwordHash = requirePasswordHash(passwordHash);
        this.status = UserStatus.ACTIVE;
        this.emailVerified = false;
    }

    public static User create(
            String name,
            String email,
            String passwordHash
    ) {
        return new User(name, email, passwordHash);
    }

    @PrePersist
    private void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    private void onUpdate() {
        updatedAt = Instant.now();
    }

    public void recordLogin() {
        lastLoginAt = Instant.now();
    }

    public void changePassword(String newPasswordHash) {
        passwordHash = requirePasswordHash(newPasswordHash);
    }

    public void verifyEmail() {
        emailVerified = true;
    }

    public void block() {
        status = UserStatus.BLOCKED;
    }

    public void disable() {
        status = UserStatus.DISABLED;
    }

    public void activate() {
        status = UserStatus.ACTIVE;
    }

    public boolean isActive() {
        return status == UserStatus.ACTIVE;
    }

    private static String normalizeName(String value) {
        String normalized = Objects.requireNonNull(
                value,
                "Name cannot be null"
        ).trim().replaceAll("\\s+", " ");

        if (normalized.length() < 2 || normalized.length() > 120) {
            throw new IllegalArgumentException(
                    "Name must contain between 2 and 120 characters"
            );
        }

        return normalized;
    }

    private static String normalizeEmail(String value) {
        String normalized = Objects.requireNonNull(
                value,
                "Email cannot be null"
        ).trim().toLowerCase(Locale.ROOT);

        if (normalized.length() < 3 || normalized.length() > 254) {
            throw new IllegalArgumentException(
                    "Email must contain between 3 and 254 characters"
            );
        }

        return normalized;
    }

    private static String requirePasswordHash(String value) {
        String passwordHash = Objects.requireNonNull(
                value,
                "Password hash cannot be null"
        ).trim();

        if (passwordHash.isEmpty() || passwordHash.length() > 255) {
            throw new IllegalArgumentException("Invalid password hash");
        }

        return passwordHash;
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public UserStatus getStatus() {
        return status;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public Instant getLastLoginAt() {
        return lastLoginAt;
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
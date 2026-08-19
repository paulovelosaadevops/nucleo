package br.com.nucleo.api.security;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

import br.com.nucleo.api.identity.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "token_hash", nullable = false, length = 64)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "replaced_by_token_id")
    private RefreshToken replacedByToken;

    @Column(name = "device_info", length = 255)
    private String deviceInfo;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected RefreshToken() {
    }

    private RefreshToken(
            User user,
            String tokenHash,
            Instant expiresAt,
            String deviceInfo,
            String ipAddress
    ) {
        this.user = Objects.requireNonNull(user);
        this.tokenHash = requireTokenHash(tokenHash);
        this.expiresAt = Objects.requireNonNull(expiresAt);
        this.deviceInfo = truncate(deviceInfo, 255);
        this.ipAddress = truncate(ipAddress, 45);
    }

    public static RefreshToken create(
            User user,
            String tokenHash,
            Instant expiresAt,
            String deviceInfo,
            String ipAddress
    ) {
        return new RefreshToken(
                user,
                tokenHash,
                expiresAt,
                deviceInfo,
                ipAddress
        );
    }

    @PrePersist
    private void onCreate() {
        createdAt = Instant.now();

        if (!expiresAt.isAfter(createdAt)) {
            throw new IllegalStateException(
                    "Refresh token expiration must be in the future"
            );
        }
    }

    public void revoke() {
        if (revokedAt == null) {
            revokedAt = Instant.now();
        }
    }

    public void replaceWith(RefreshToken replacement) {
        if (revokedAt != null) {
            throw new IllegalStateException(
                    "Refresh token has already been revoked"
            );
        }

        replacedByToken = Objects.requireNonNull(replacement);
        revokedAt = Instant.now();
    }

    public boolean isRevoked() {
        return revokedAt != null;
    }

    public boolean isExpired() {
        return !expiresAt.isAfter(Instant.now());
    }

    public boolean isUsable() {
        return !isRevoked() && !isExpired();
    }

    private static String requireTokenHash(String value) {
        String normalized = Objects.requireNonNull(value).trim();

        if (normalized.length() != 64) {
            throw new IllegalArgumentException(
                    "Refresh token hash must have 64 characters"
            );
        }

        return normalized;
    }

    private static String truncate(String value, int maximumLength) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String normalized = value.trim();

        return normalized.length() <= maximumLength
                ? normalized
                : normalized.substring(0, maximumLength);
    }

    public UUID getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public Instant getRevokedAt() {
        return revokedAt;
    }

    public RefreshToken getReplacedByToken() {
        return replacedByToken;
    }
}
package br.com.nucleo.api.family.domain;

import java.time.Instant;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

import br.com.nucleo.api.identity.user.domain.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

@Entity
@Table(name = "family_invitations")
public class FamilyInvitation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "family_id", nullable = false)
    private Family family;

    @Column(nullable = false, length = 254)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FamilyRole role;

    @Column(name = "token_hash", nullable = false, length = 64)
    private String tokenHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InvitationStatus status;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invited_by_user_id", nullable = false)
    private User invitedBy;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "responded_at")
    private Instant respondedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private long version;

    protected FamilyInvitation() {
    }

    private FamilyInvitation(
            Family family,
            String email,
            FamilyRole role,
            String tokenHash,
            User invitedBy,
            Instant expiresAt
    ) {
        this.family = Objects.requireNonNull(family);
        this.email = normalizeEmail(email);
        this.role = requireInvitableRole(role);
        this.tokenHash = requireTokenHash(tokenHash);
        this.invitedBy = Objects.requireNonNull(invitedBy);
        this.expiresAt = Objects.requireNonNull(expiresAt);
        this.status = InvitationStatus.PENDING;
    }

    public static FamilyInvitation create(
            Family family,
            String email,
            FamilyRole role,
            String tokenHash,
            User invitedBy,
            Instant expiresAt
    ) {
        return new FamilyInvitation(
                family,
                email,
                role,
                tokenHash,
                invitedBy,
                expiresAt
        );
    }

    @PrePersist
    private void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;

        if (!expiresAt.isAfter(now)) {
            throw new IllegalStateException(
                    "Invitation expiration must be in the future"
            );
        }
    }

    @PreUpdate
    private void onUpdate() {
        updatedAt = Instant.now();
    }

    public void revoke() {
        requirePending();
        status = InvitationStatus.REVOKED;
        respondedAt = Instant.now();
    }

    public void accept() {
        requirePending();
        ensureNotExpired();
        status = InvitationStatus.ACCEPTED;
        respondedAt = Instant.now();
    }

    public void decline() {
        requirePending();
        ensureNotExpired();
        status = InvitationStatus.DECLINED;
        respondedAt = Instant.now();
    }

    public boolean expireIfNecessary(Instant now) {
        if (
                status == InvitationStatus.PENDING
                        && !expiresAt.isAfter(now)
        ) {
            status = InvitationStatus.EXPIRED;
            respondedAt = now;
            return true;
        }

        return false;
    }

    public boolean isPending() {
        return status == InvitationStatus.PENDING;
    }

    public boolean isExpired() {
        return !expiresAt.isAfter(Instant.now());
    }

    private void requirePending() {
        if (status != InvitationStatus.PENDING) {
            throw new IllegalStateException(
                    "Invitation is no longer pending"
            );
        }
    }

    private void ensureNotExpired() {
        if (isExpired()) {
            status = InvitationStatus.EXPIRED;
            respondedAt = Instant.now();

            throw new IllegalStateException(
                    "Invitation has expired"
            );
        }
    }

    private static FamilyRole requireInvitableRole(FamilyRole role) {
        Objects.requireNonNull(role);

        if (role == FamilyRole.OWNER) {
            throw new IllegalArgumentException(
                    "The owner role cannot be assigned by invitation"
            );
        }

        return role;
    }

    private static String normalizeEmail(String value) {
        String normalized = Objects.requireNonNull(value)
                .trim()
                .toLowerCase(Locale.ROOT);

        if (normalized.length() < 3 || normalized.length() > 254) {
            throw new IllegalArgumentException(
                    "Invalid invitation email"
            );
        }

        return normalized;
    }

    private static String requireTokenHash(String value) {
        String normalized = Objects.requireNonNull(value).trim();

        if (normalized.length() != 64) {
            throw new IllegalArgumentException(
                    "Invitation token hash must have 64 characters"
            );
        }

        return normalized;
    }

    public UUID getId() {
        return id;
    }

    public Family getFamily() {
        return family;
    }

    public String getEmail() {
        return email;
    }

    public FamilyRole getRole() {
        return role;
    }

    public InvitationStatus getStatus() {
        return status;
    }

    public User getInvitedBy() {
        return invitedBy;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public Instant getRespondedAt() {
        return respondedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public long getVersion() {
        return version;
    }
}
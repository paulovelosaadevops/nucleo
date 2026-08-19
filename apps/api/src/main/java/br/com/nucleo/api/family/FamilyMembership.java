package br.com.nucleo.api.family;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

import br.com.nucleo.api.identity.user.User;
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
@Table(name = "family_memberships")
public class FamilyMembership {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "family_id", nullable = false)
    private Family family;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FamilyRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MembershipStatus status;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private Instant joinedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private long version;

    protected FamilyMembership() {
    }

    private FamilyMembership(
            Family family,
            User user,
            FamilyRole role
    ) {
        this.family = Objects.requireNonNull(family);
        this.user = Objects.requireNonNull(user);
        this.role = Objects.requireNonNull(role);
        this.status = MembershipStatus.ACTIVE;
    }

    public static FamilyMembership createOwner(
            Family family,
            User user
    ) {
        return new FamilyMembership(family, user, FamilyRole.OWNER);
    }

    public static FamilyMembership createMember(
            Family family,
            User user,
            FamilyRole role
    ) {
        if (role == FamilyRole.OWNER) {
            throw new IllegalArgumentException(
                    "An owner membership cannot be created as a regular member"
            );
        }

        return new FamilyMembership(family, user, role);
    }

    @PrePersist
    private void onCreate() {
        Instant now = Instant.now();
        joinedAt = now;
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    private void onUpdate() {
        updatedAt = Instant.now();
    }

    public void changeRole(FamilyRole newRole) {
        if (role == FamilyRole.OWNER) {
            throw new IllegalStateException(
                    "The owner role cannot be changed directly"
            );
        }

        if (newRole == FamilyRole.OWNER) {
            throw new IllegalArgumentException(
                    "Use ownership transfer to define a new owner"
            );
        }

        role = Objects.requireNonNull(newRole);
    }

    public void deactivate() {
        if (role == FamilyRole.OWNER) {
            throw new IllegalStateException(
                    "The family owner cannot be deactivated"
            );
        }

        status = MembershipStatus.INACTIVE;
    }

    public void activate() {
        status = MembershipStatus.ACTIVE;
    }

    public UUID getId() {
        return id;
    }

    public Family getFamily() {
        return family;
    }

    public User getUser() {
        return user;
    }

    public FamilyRole getRole() {
        return role;
    }

    public MembershipStatus getStatus() {
        return status;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }

    public boolean isActive() {
        return status == MembershipStatus.ACTIVE;
    }

    public long getVersion() {
        return version;
    }
}
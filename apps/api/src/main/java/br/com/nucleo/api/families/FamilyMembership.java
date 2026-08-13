package br.com.nucleo.api.families;

import java.time.Instant;
import java.util.UUID;

import br.com.nucleo.api.users.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "family_memberships")
public class FamilyMembership {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "family_id", nullable = false)
    private Family family;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private FamilyRole role;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected FamilyMembership() {
    }

    public FamilyMembership(User user, Family family, FamilyRole role) {
        this.user = user;
        this.family = family;
        this.role = role;
    }

    @PrePersist
    void prePersist() {
        if (id == null) {
            id = UUID.randomUUID();
        }

        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public UUID getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public Family getFamily() {
        return family;
    }

    public FamilyRole getRole() {
        return role;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

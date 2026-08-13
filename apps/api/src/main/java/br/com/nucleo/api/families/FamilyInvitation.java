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
@Table(name = "family_invitations")
public class FamilyInvitation {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "family_id", nullable = false)
    private Family family;

    @Column(name = "invited_email", nullable = false, length = 180)
    private String invitedEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private FamilyRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private FamilyInvitationStatus status;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected FamilyInvitation() {
    }

    public FamilyInvitation(
            Family family,
            String invitedEmail,
            FamilyRole role,
            User createdBy
    ) {
        this.family = family;
        this.invitedEmail = invitedEmail;
        this.role = role;
        this.createdBy = createdBy;
        this.status = FamilyInvitationStatus.PENDING;
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

    public Family getFamily() {
        return family;
    }

    public String getInvitedEmail() {
        return invitedEmail;
    }

    public FamilyRole getRole() {
        return role;
    }

    public FamilyInvitationStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
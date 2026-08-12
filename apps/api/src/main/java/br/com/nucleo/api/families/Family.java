package br.com.nucleo.api.families;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "families")
public class Family {

    @Id
    private UUID id;

    @Column(nullable = false, length = 140)
    private String name;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected Family() {
    }

    public Family(String name) {
        this.name = name;
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

    public String getName() {
        return name;
    }
}
package br.com.nucleo.api.family.controller;

import br.com.nucleo.api.family.dto.CreateInvitationRequest;
import br.com.nucleo.api.family.dto.FamilyMemberResponse;
import br.com.nucleo.api.family.dto.InvitationCreatedResponse;
import br.com.nucleo.api.family.dto.InvitationResponse;
import br.com.nucleo.api.family.service.FamilyManagementService;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/family")
public class FamilyController {

    private final FamilyManagementService familyManagementService;

    public FamilyController(
            FamilyManagementService familyManagementService
    ) {
        this.familyManagementService = familyManagementService;
    }

    @GetMapping("/members")
    public List<FamilyMemberResponse> listMembers(
            @AuthenticationPrincipal Jwt jwt
    ) {
        return familyManagementService.listMembers(
                UUID.fromString(jwt.getSubject())
        );
    }

    @GetMapping("/invitations")
    public List<InvitationResponse> listInvitations(
            @AuthenticationPrincipal Jwt jwt
    ) {
        return familyManagementService.listInvitations(
                UUID.fromString(jwt.getSubject())
        );
    }

    @PostMapping("/invitations")
    public ResponseEntity<InvitationCreatedResponse> createInvitation(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateInvitationRequest request
    ) {
        InvitationCreatedResponse response =
                familyManagementService.createInvitation(
                        UUID.fromString(jwt.getSubject()),
                        request
                );

        return ResponseEntity
                .created(
                        URI.create(
                                "/api/family/invitations/"
                                        + response.invitation().id()
                        )
                )
                .body(response);
    }

    @DeleteMapping("/invitations/{invitationId}")
    public ResponseEntity<Void> revokeInvitation(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID invitationId
    ) {
        familyManagementService.revokeInvitation(
                UUID.fromString(jwt.getSubject()),
                invitationId
        );

        return ResponseEntity.noContent().build();
    }
}
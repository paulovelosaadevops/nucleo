package br.com.nucleo.api.family;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/invitations")
public class InvitationController {

    private final FamilyManagementService familyManagementService;
    private final InvitationDecisionService invitationDecisionService;

    public InvitationController(
            FamilyManagementService familyManagementService,
            InvitationDecisionService invitationDecisionService
    ) {
        this.familyManagementService = familyManagementService;
        this.invitationDecisionService = invitationDecisionService;
    }

    @GetMapping("/{token}")
    public InvitationPreviewResponse preview(
            @PathVariable String token
    ) {
        return familyManagementService.previewInvitation(token);
    }

    @PostMapping("/{token}/decline")
    public ResponseEntity<Void> decline(
            @PathVariable String token
    ) {
        invitationDecisionService.decline(token);

        return ResponseEntity.noContent().build();
    }
}
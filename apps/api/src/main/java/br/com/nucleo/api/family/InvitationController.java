package br.com.nucleo.api.family;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/invitations")
public class InvitationController {

    private final FamilyManagementService familyManagementService;

    public InvitationController(
            FamilyManagementService familyManagementService
    ) {
        this.familyManagementService = familyManagementService;
    }

    @GetMapping("/{token}")
    public InvitationPreviewResponse preview(
            @PathVariable String token
    ) {
        return familyManagementService.previewInvitation(token);
    }
}
package br.com.nucleo.api.families;

import java.util.List;
import java.util.UUID;

import br.com.nucleo.api.auth.dto.MessageResponse;
import br.com.nucleo.api.families.dto.CreateFamilyInvitationRequest;
import br.com.nucleo.api.families.dto.FamilyInvitationResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class FamilyInvitationController {

    private final FamilyInvitationService familyInvitationService;

    public FamilyInvitationController(FamilyInvitationService familyInvitationService) {
        this.familyInvitationService = familyInvitationService;
    }

    @GetMapping("/api/family-invitations")
    public List<FamilyInvitationResponse> list(Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());

        return familyInvitationService.list(userId);
    }

    @PostMapping("/api/family-invitations")
    @ResponseStatus(HttpStatus.CREATED)
    public FamilyInvitationResponse create(
            Authentication authentication,
            @Valid @RequestBody CreateFamilyInvitationRequest request
    ) {
        UUID userId = UUID.fromString(authentication.getName());

        return familyInvitationService.create(userId, request);
    }

    @PatchMapping("/api/family-invitations/{invitationId}/revoke")
    public FamilyInvitationResponse revoke(
            Authentication authentication,
            @PathVariable UUID invitationId
    ) {
        UUID userId = UUID.fromString(authentication.getName());

        return familyInvitationService.revoke(userId, invitationId);
    }

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public MessageResponse handleBadRequest(RuntimeException exception) {
        return new MessageResponse(exception.getMessage());
    }
}
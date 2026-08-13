package br.com.nucleo.api.families;

import br.com.nucleo.api.auth.dto.AuthResponse;
import br.com.nucleo.api.auth.dto.MessageResponse;
import br.com.nucleo.api.families.dto.AcceptFamilyInvitationRequest;
import br.com.nucleo.api.families.dto.PublicFamilyInvitationResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PublicFamilyInvitationController {

    private final PublicFamilyInvitationService publicFamilyInvitationService;

    public PublicFamilyInvitationController(PublicFamilyInvitationService publicFamilyInvitationService) {
        this.publicFamilyInvitationService = publicFamilyInvitationService;
    }

    @GetMapping("/api/public/family-invitations/{token}")
    public PublicFamilyInvitationResponse findByToken(@PathVariable String token) {
        return publicFamilyInvitationService.findByToken(token);
    }

    @PostMapping("/api/public/family-invitations/{token}/accept")
    public AuthResponse accept(
            @PathVariable String token,
            @Valid @RequestBody AcceptFamilyInvitationRequest request
    ) {
        return publicFamilyInvitationService.accept(token, request);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public MessageResponse handleIllegalArgument(IllegalArgumentException exception) {
        return new MessageResponse(exception.getMessage());
    }
}
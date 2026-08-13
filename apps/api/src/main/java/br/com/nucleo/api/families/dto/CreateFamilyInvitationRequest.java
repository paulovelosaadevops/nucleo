package br.com.nucleo.api.families.dto;

import br.com.nucleo.api.families.FamilyRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateFamilyInvitationRequest(
        @NotBlank @Email String invitedEmail,
        @NotNull FamilyRole role
) {
}
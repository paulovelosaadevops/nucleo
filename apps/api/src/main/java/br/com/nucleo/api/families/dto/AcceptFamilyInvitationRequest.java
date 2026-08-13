package br.com.nucleo.api.families.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AcceptFamilyInvitationRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Size(min = 8, max = 120) String password
) {
}
package br.com.nucleo.api.family.dto;

public record InvitationCreatedResponse(
        InvitationResponse invitation,
        String invitationToken,
        String invitationUrl
) {
}
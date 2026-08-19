package br.com.nucleo.api.family;

public record InvitationCreatedResponse(
        InvitationResponse invitation,
        String invitationToken,
        String invitationUrl
) {
}
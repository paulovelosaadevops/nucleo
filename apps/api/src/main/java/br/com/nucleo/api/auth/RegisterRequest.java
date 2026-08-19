package br.com.nucleo.api.auth;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(

        @NotBlank(message = "Informe seu nome")
        @Size(
                min = 2,
                max = 120,
                message = "O nome deve ter entre 2 e 120 caracteres"
        )
        String name,

        @NotBlank(message = "Informe seu e-mail")
        @Email(message = "Informe um e-mail válido")
        @Size(
                max = 254,
                message = "O e-mail deve ter no máximo 254 caracteres"
        )
        String email,

        @NotBlank(message = "Informe uma senha")
        @Size(
                min = 8,
                max = 72,
                message = "A senha deve ter entre 8 e 72 caracteres"
        )
        @Pattern(
                regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$",
                message = "A senha deve conter letra maiúscula, minúscula e número"
        )
        String password,

        @Size(
                max = 120,
                message = "O nome do núcleo deve ter no máximo 120 caracteres"
        )
        String familyName,

        @Size(
                max = 200,
                message = "Token de convite inválido"
        )
        String invitationToken
) {

    @AssertTrue(
            message = "Informe o nome do núcleo ou um convite, mas não ambos"
    )
    public boolean isFamilySelectionValid() {
        boolean hasFamilyName = familyName != null
                && !familyName.isBlank();

        boolean hasInvitation = invitationToken != null
                && !invitationToken.isBlank();

        return hasFamilyName != hasInvitation;
    }
}
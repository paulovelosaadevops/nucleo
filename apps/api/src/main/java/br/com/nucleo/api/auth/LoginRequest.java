package br.com.nucleo.api.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(

        @NotBlank(message = "Informe seu e-mail")
        @Email(message = "Informe um e-mail válido")
        @Size(max = 254)
        String email,

        @NotBlank(message = "Informe sua senha")
        @Size(max = 72)
        String password
) {
}
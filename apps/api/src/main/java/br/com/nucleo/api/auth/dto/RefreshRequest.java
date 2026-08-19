package br.com.nucleo.api.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RefreshRequest(

        @NotBlank(message = "Informe o refresh token")
        @Size(max = 200, message = "Refresh token inválido")
        String refreshToken
) {
}
package br.com.nucleo.api.auth.dto;

import java.util.UUID;

import br.com.nucleo.api.users.User;

public record UserResponse(
        UUID id,
        String name,
        String email
) {

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail());
    }
}
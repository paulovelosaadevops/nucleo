package br.com.nucleo.api.users;

import java.util.UUID;

public record UserMeResponse(
        UUID id,
        String name,
        String email
) {

    public static UserMeResponse from(User user) {
        return new UserMeResponse(
                user.getId(),
                user.getName(),
                user.getEmail()
        );
    }
}
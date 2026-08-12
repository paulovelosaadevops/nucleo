package br.com.nucleo.api.users;

import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/api/users/me")
    public UserMeResponse me(Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());

        User user = userRepository.findById(userId)
                .orElseThrow();

        return UserMeResponse.from(user);
    }
}
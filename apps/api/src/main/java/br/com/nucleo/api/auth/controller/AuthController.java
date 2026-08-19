package br.com.nucleo.api.auth.controller;

import br.com.nucleo.api.auth.dto.AuthResponse;
import br.com.nucleo.api.auth.dto.LoginRequest;
import br.com.nucleo.api.auth.dto.LogoutRequest;
import br.com.nucleo.api.auth.dto.RefreshRequest;
import br.com.nucleo.api.auth.dto.RegisterRequest;
import br.com.nucleo.api.auth.dto.RegisterResponse;
import br.com.nucleo.api.auth.service.AuthenticationService;
import br.com.nucleo.api.auth.service.RegistrationService;
import br.com.nucleo.api.identity.user.domain.User;

import java.net.URI;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final RegistrationService registrationService;
    private final AuthenticationService authenticationService;

    public AuthController(
            RegistrationService registrationService,
            AuthenticationService authenticationService
    ) {
        this.registrationService = registrationService;
        this.authenticationService = authenticationService;
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(
            @Valid @RequestBody RegisterRequest request
    ) {
        RegisterResponse response =
                registrationService.register(request);

        return ResponseEntity
                .created(URI.create("/api/users/" + response.userId()))
                .body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest servletRequest
    ) {
        AuthResponse response = authenticationService.login(
                request,
                deviceInfo(servletRequest),
                clientIp(servletRequest)
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @Valid @RequestBody RefreshRequest request,
            HttpServletRequest servletRequest
    ) {
        AuthResponse response = authenticationService.refresh(
                request,
                deviceInfo(servletRequest),
                clientIp(servletRequest)
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @Valid @RequestBody LogoutRequest request
    ) {
        authenticationService.logout(request);
        return ResponseEntity.noContent().build();
    }

    private String deviceInfo(HttpServletRequest request) {
        return request.getHeader("User-Agent");
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");

        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }

        return request.getRemoteAddr();
    }
}
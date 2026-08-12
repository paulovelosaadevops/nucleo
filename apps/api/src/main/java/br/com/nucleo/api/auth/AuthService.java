package br.com.nucleo.api.auth;

import br.com.nucleo.api.auth.dto.AuthResponse;
import br.com.nucleo.api.auth.dto.ForgotPasswordRequest;
import br.com.nucleo.api.auth.dto.LoginRequest;
import br.com.nucleo.api.auth.dto.MessageResponse;
import br.com.nucleo.api.auth.dto.RegisterRequest;
import br.com.nucleo.api.auth.dto.UserResponse;
import br.com.nucleo.api.families.Family;
import br.com.nucleo.api.families.FamilyMembership;
import br.com.nucleo.api.families.FamilyMembershipRepository;
import br.com.nucleo.api.families.FamilyRepository;
import br.com.nucleo.api.families.FamilyRole;
import br.com.nucleo.api.users.User;
import br.com.nucleo.api.users.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final FamilyRepository familyRepository;
    private final FamilyMembershipRepository familyMembershipRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            FamilyRepository familyRepository,
            FamilyMembershipRepository familyMembershipRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.familyRepository = familyRepository;
        this.familyMembershipRepository = familyMembershipRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new IllegalArgumentException("Este e-mail já está cadastrado.");
        }

        User user = userRepository.save(new User(
                request.name().trim(),
                normalizedEmail,
                passwordEncoder.encode(request.password())
        ));

        Family family = familyRepository.save(new Family(request.familyName().trim()));

        familyMembershipRepository.save(new FamilyMembership(
                user,
                family,
                FamilyRole.OWNER
        ));

        String token = jwtService.generateAccessToken(user);

        return new AuthResponse(token, token, UserResponse.from(user));
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(() -> new BadCredentialsException("E-mail ou senha inválidos."));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("E-mail ou senha inválidos.");
        }

        String token = jwtService.generateAccessToken(user);

        return new AuthResponse(token, token, UserResponse.from(user));
    }

    public MessageResponse forgotPassword(ForgotPasswordRequest request) {
        return new MessageResponse(
                "Se o e-mail estiver cadastrado, enviaremos as instruções de redefinição."
        );
    }
}
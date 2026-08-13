package br.com.nucleo.api.families;

import br.com.nucleo.api.auth.JwtService;
import br.com.nucleo.api.auth.dto.AuthResponse;
import br.com.nucleo.api.auth.dto.UserResponse;
import br.com.nucleo.api.families.dto.AcceptFamilyInvitationRequest;
import br.com.nucleo.api.families.dto.PublicFamilyInvitationResponse;
import br.com.nucleo.api.users.User;
import br.com.nucleo.api.users.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class PublicFamilyInvitationService {

    private final FamilyInvitationRepository familyInvitationRepository;
    private final FamilyMembershipRepository familyMembershipRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public PublicFamilyInvitationService(
            FamilyInvitationRepository familyInvitationRepository,
            FamilyMembershipRepository familyMembershipRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.familyInvitationRepository = familyInvitationRepository;
        this.familyMembershipRepository = familyMembershipRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public PublicFamilyInvitationResponse findByToken(String token) {
        FamilyInvitation invitation = familyInvitationRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Convite não encontrado."));

        return PublicFamilyInvitationResponse.from(invitation);
    }

    @Transactional
    public AuthResponse accept(String token, AcceptFamilyInvitationRequest request) {
        FamilyInvitation invitation = familyInvitationRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Convite não encontrado."));

        if (invitation.getStatus() != FamilyInvitationStatus.PENDING) {
            throw new IllegalArgumentException("Este convite não está mais disponível.");
        }

        if (userRepository.existsByEmailIgnoreCase(invitation.getInvitedEmail())) {
            throw new IllegalArgumentException("Este e-mail já possui acesso.");
        }

        User user = userRepository.save(new User(
                request.name().trim(),
                invitation.getInvitedEmail(),
                passwordEncoder.encode(request.password())
        ));

        familyMembershipRepository.save(new FamilyMembership(
                user,
                invitation.getFamily(),
                invitation.getRole()
        ));

        invitation.accept();

        String tokenJwt = jwtService.generateAccessToken(user);

        return new AuthResponse(tokenJwt, tokenJwt, UserResponse.from(user));
    }
}
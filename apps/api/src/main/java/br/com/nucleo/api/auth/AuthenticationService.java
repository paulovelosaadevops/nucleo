package br.com.nucleo.api.auth;

import java.time.Instant;
import java.util.Locale;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.nucleo.api.common.error.AccountUnavailableException;
import br.com.nucleo.api.common.error.InvalidCredentialsException;
import br.com.nucleo.api.common.error.InvalidRefreshTokenException;
import br.com.nucleo.api.family.FamilyMembership;
import br.com.nucleo.api.family.FamilyMembershipRepository;
import br.com.nucleo.api.identity.user.User;
import br.com.nucleo.api.identity.user.UserRepository;
import br.com.nucleo.api.security.JwtService;
import br.com.nucleo.api.security.RefreshToken;
import br.com.nucleo.api.security.RefreshTokenRepository;

@Service
public class AuthenticationService {

    private final UserRepository userRepository;
    private final FamilyMembershipRepository membershipRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthenticationService(
            UserRepository userRepository,
            FamilyMembershipRepository membershipRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.membershipRepository = membershipRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse login(
            LoginRequest request,
            String deviceInfo,
            String ipAddress
    ) {
        String email = request.email()
                .trim()
                .toLowerCase(Locale.ROOT);

        User user = userRepository
                .findByEmailIgnoreCase(email)
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(
                request.password(),
                user.getPasswordHash()
        )) {
            throw new InvalidCredentialsException();
        }

        validateUser(user);

        FamilyMembership membership = findActiveMembership(user);

        user.recordLogin();

        return createSession(
                user,
                membership,
                deviceInfo,
                ipAddress
        );
    }

    @Transactional
    public AuthResponse refresh(
            RefreshRequest request,
            String deviceInfo,
            String ipAddress
    ) {
        String tokenHash = jwtService.hashRefreshToken(
                request.refreshToken()
        );

        RefreshToken currentToken = refreshTokenRepository
                .findByTokenHash(tokenHash)
                .orElseThrow(InvalidRefreshTokenException::new);

        if (currentToken.isRevoked()) {
            refreshTokenRepository.revokeAllActiveByUserId(
                    currentToken.getUser().getId(),
                    Instant.now()
            );

            throw new InvalidRefreshTokenException();
        }

        if (currentToken.isExpired()) {
            currentToken.revoke();
            throw new InvalidRefreshTokenException();
        }

        User user = currentToken.getUser();

        validateUser(user);

        FamilyMembership membership = findActiveMembership(user);

        JwtService.AccessToken accessToken =
                jwtService.issueAccessToken(user, membership);

        String rawRefreshToken = jwtService.generateRefreshToken();

        RefreshToken replacement = RefreshToken.create(
                user,
                jwtService.hashRefreshToken(rawRefreshToken),
                jwtService.refreshTokenExpiration(),
                deviceInfo,
                ipAddress
        );

        refreshTokenRepository.save(replacement);
        currentToken.replaceWith(replacement);

        return buildResponse(
                user,
                membership,
                accessToken,
                rawRefreshToken
        );
    }

    @Transactional
    public void logout(LogoutRequest request) {
        String tokenHash = jwtService.hashRefreshToken(
                request.refreshToken()
        );

        refreshTokenRepository
                .findByTokenHash(tokenHash)
                .ifPresent(RefreshToken::revoke);
    }

    private AuthResponse createSession(
            User user,
            FamilyMembership membership,
            String deviceInfo,
            String ipAddress
    ) {
        JwtService.AccessToken accessToken =
                jwtService.issueAccessToken(user, membership);

        String rawRefreshToken = jwtService.generateRefreshToken();

        RefreshToken refreshToken = RefreshToken.create(
                user,
                jwtService.hashRefreshToken(rawRefreshToken),
                jwtService.refreshTokenExpiration(),
                deviceInfo,
                ipAddress
        );

        refreshTokenRepository.save(refreshToken);

        return buildResponse(
                user,
                membership,
                accessToken,
                rawRefreshToken
        );
    }

    private AuthResponse buildResponse(
            User user,
            FamilyMembership membership,
            JwtService.AccessToken accessToken,
            String rawRefreshToken
    ) {
        return new AuthResponse(
                accessToken.value(),
                rawRefreshToken,
                "Bearer",
                jwtService.accessTokenExpiresInSeconds(),
                new AuthResponse.UserSummary(
                        user.getId(),
                        user.getName(),
                        user.getEmail()
                ),
                new AuthResponse.FamilySummary(
                        membership.getFamily().getId(),
                        membership.getFamily().getName(),
                        membership.getRole()
                )
        );
    }

    private FamilyMembership findActiveMembership(User user) {
        FamilyMembership membership = membershipRepository
                .findByUser_Id(user.getId())
                .orElseThrow(AccountUnavailableException::new);

        if (!membership.isActive()) {
            throw new AccountUnavailableException();
        }

        return membership;
    }

    private void validateUser(User user) {
        if (!user.isActive()) {
            throw new AccountUnavailableException();
        }
    }
}
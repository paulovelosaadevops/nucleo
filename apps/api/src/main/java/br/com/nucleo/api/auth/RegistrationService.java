package br.com.nucleo.api.auth;

import java.util.Locale;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.nucleo.api.common.error.EmailAlreadyInUseException;
import br.com.nucleo.api.family.Family;
import br.com.nucleo.api.family.FamilyMembership;
import br.com.nucleo.api.family.FamilyMembershipRepository;
import br.com.nucleo.api.family.FamilyRepository;
import br.com.nucleo.api.identity.user.User;
import br.com.nucleo.api.identity.user.UserRepository;

@Service
public class RegistrationService {

    private final UserRepository userRepository;
    private final FamilyRepository familyRepository;
    private final FamilyMembershipRepository membershipRepository;
    private final PasswordEncoder passwordEncoder;

    public RegistrationService(
            UserRepository userRepository,
            FamilyRepository familyRepository,
            FamilyMembershipRepository membershipRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.familyRepository = familyRepository;
        this.membershipRepository = membershipRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        String normalizedEmail = request.email()
                .trim()
                .toLowerCase(Locale.ROOT);

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new EmailAlreadyInUseException();
        }

        try {
            User user = User.create(
                    request.name(),
                    normalizedEmail,
                    passwordEncoder.encode(request.password())
            );

            userRepository.save(user);

            Family family = Family.create(
                    request.familyName(),
                    user
            );

            familyRepository.save(family);

            FamilyMembership membership =
                    FamilyMembership.createOwner(family, user);

            membershipRepository.save(membership);

            return new RegisterResponse(
                    user.getId(),
                    family.getId(),
                    user.getName(),
                    user.getEmail(),
                    family.getName(),
                    membership.getRole()
            );
        } catch (DataIntegrityViolationException exception) {
            if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
                throw new EmailAlreadyInUseException();
            }

            throw exception;
        }
    }
}
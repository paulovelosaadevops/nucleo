package br.com.nucleo.api.identity.profile;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.nucleo.api.common.error.AccountUnavailableException;
import br.com.nucleo.api.family.FamilyMembership;
import br.com.nucleo.api.family.FamilyMembershipRepository;
import br.com.nucleo.api.identity.user.User;

@Service
public class CurrentUserService {

    private final FamilyMembershipRepository membershipRepository;

    public CurrentUserService(
            FamilyMembershipRepository membershipRepository
    ) {
        this.membershipRepository = membershipRepository;
    }

    @Transactional(readOnly = true)
    public CurrentUserResponse findCurrentUser(UUID userId) {
        FamilyMembership membership = membershipRepository
                .findByUser_Id(userId)
                .orElseThrow(AccountUnavailableException::new);

        User user = membership.getUser();

        if (!user.isActive() || !membership.isActive()) {
            throw new AccountUnavailableException();
        }

        return new CurrentUserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getStatus(),
                user.isEmailVerified(),
                new CurrentUserResponse.Family(
                        membership.getFamily().getId(),
                        membership.getFamily().getName(),
                        membership.getRole(),
                        membership.getJoinedAt()
                )
        );
    }
}
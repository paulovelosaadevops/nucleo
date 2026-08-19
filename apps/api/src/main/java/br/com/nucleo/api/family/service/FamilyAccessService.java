package br.com.nucleo.api.family.service;

import br.com.nucleo.api.family.domain.FamilyMembership;
import br.com.nucleo.api.family.domain.FamilyRole;
import br.com.nucleo.api.family.repository.FamilyMembershipRepository;

import br.com.nucleo.api.common.error.AccountUnavailableException;
import br.com.nucleo.api.common.error.ForbiddenOperationException;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FamilyAccessService {

    private final FamilyMembershipRepository membershipRepository;

    public FamilyAccessService(
            FamilyMembershipRepository membershipRepository
    ) {
        this.membershipRepository = membershipRepository;
    }

    @Transactional(readOnly = true)
    public FamilyMembership requireActiveMembership(UUID userId) {
        FamilyMembership membership = membershipRepository
                .findByUser_Id(userId)
                .orElseThrow(AccountUnavailableException::new);

        if (!membership.isActive()) {
            throw new AccountUnavailableException();
        }

        return membership;
    }

    @Transactional(readOnly = true)
    public FamilyMembership requireAdministrator(UUID userId) {
        FamilyMembership membership =
                requireActiveMembership(userId);

        if (
                membership.getRole() != FamilyRole.OWNER
                        && membership.getRole() != FamilyRole.ADMIN
        ) {
            throw new ForbiddenOperationException(
                    "Somente administradores podem realizar esta operação"
            );
        }

        return membership;
    }
}
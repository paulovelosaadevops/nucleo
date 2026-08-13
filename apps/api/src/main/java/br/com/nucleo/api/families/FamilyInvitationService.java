package br.com.nucleo.api.families;

import java.util.List;
import java.util.UUID;

import br.com.nucleo.api.families.dto.CreateFamilyInvitationRequest;
import br.com.nucleo.api.families.dto.FamilyInvitationResponse;
import br.com.nucleo.api.users.User;
import br.com.nucleo.api.users.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

@Service
public class FamilyInvitationService {

    private final FamilyMembershipRepository familyMembershipRepository;
    private final FamilyInvitationRepository familyInvitationRepository;
    private final UserRepository userRepository;

    public FamilyInvitationService(
            FamilyMembershipRepository familyMembershipRepository,
            FamilyInvitationRepository familyInvitationRepository,
            UserRepository userRepository
    ) {
        this.familyMembershipRepository = familyMembershipRepository;
        this.familyInvitationRepository = familyInvitationRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public FamilyInvitationResponse create(UUID userId, CreateFamilyInvitationRequest request) {
        FamilyMembership membership = familyMembershipRepository.findFirstByUserId(userId)
                .orElseThrow();

        if (membership.getRole() != FamilyRole.OWNER) {
            throw new IllegalArgumentException("Somente o administrador pode convidar membros.");
        }

        User user = userRepository.findById(userId).orElseThrow();

        FamilyInvitation invitation = familyInvitationRepository.save(new FamilyInvitation(
                membership.getFamily(),
                request.invitedEmail().trim().toLowerCase(),
                request.role(),
                user
        ));

        return FamilyInvitationResponse.from(invitation);
    }

    public List<FamilyInvitationResponse> list(UUID userId) {
        FamilyMembership membership = familyMembershipRepository.findFirstByUserId(userId)
                .orElseThrow();

        return familyInvitationRepository
                .findByFamilyIdOrderByCreatedAtDesc(membership.getFamily().getId())
                .stream()
                .map(FamilyInvitationResponse::from)
                .toList();
    }
}
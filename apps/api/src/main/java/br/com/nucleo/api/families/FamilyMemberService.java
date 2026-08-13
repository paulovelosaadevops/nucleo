package br.com.nucleo.api.families;

import java.util.List;
import java.util.UUID;

import br.com.nucleo.api.families.dto.FamilyMemberResponse;
import org.springframework.stereotype.Service;

@Service
public class FamilyMemberService {

    private final FamilyMembershipRepository familyMembershipRepository;

    public FamilyMemberService(FamilyMembershipRepository familyMembershipRepository) {
        this.familyMembershipRepository = familyMembershipRepository;
    }

    public List<FamilyMemberResponse> list(UUID userId) {
        FamilyMembership membership = familyMembershipRepository.findFirstByUserId(userId)
                .orElseThrow();

        return familyMembershipRepository
                .findByFamilyIdOrderByCreatedAtAsc(membership.getFamily().getId())
                .stream()
                .map(FamilyMemberResponse::from)
                .toList();
    }
}

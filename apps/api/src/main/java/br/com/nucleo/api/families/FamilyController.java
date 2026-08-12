package br.com.nucleo.api.families;

import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class FamilyController {

    private final FamilyMembershipRepository familyMembershipRepository;

    public FamilyController(FamilyMembershipRepository familyMembershipRepository) {
        this.familyMembershipRepository = familyMembershipRepository;
    }

    @GetMapping("/api/families/current")
    public CurrentFamilyResponse current(Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());

        FamilyMembership membership = familyMembershipRepository.findFirstByUserId(userId)
                .orElseThrow();

        return CurrentFamilyResponse.from(membership);
    }
}
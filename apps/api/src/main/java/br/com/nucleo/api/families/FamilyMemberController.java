package br.com.nucleo.api.families;

import java.util.List;
import java.util.UUID;

import br.com.nucleo.api.families.dto.FamilyMemberResponse;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class FamilyMemberController {

    private final FamilyMemberService familyMemberService;

    public FamilyMemberController(FamilyMemberService familyMemberService) {
        this.familyMemberService = familyMemberService;
    }

    @GetMapping("/api/family-members")
    public List<FamilyMemberResponse> list(Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());

        return familyMemberService.list(userId);
    }
}

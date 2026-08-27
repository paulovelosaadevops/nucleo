package br.com.nucleo.api.finance.controller;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.nucleo.api.audit.service.AuditService;
import br.com.nucleo.api.config.SecurityConfig;
import br.com.nucleo.api.family.domain.Family;
import br.com.nucleo.api.family.domain.FamilyMembership;
import br.com.nucleo.api.family.service.FamilyAccessService;
import br.com.nucleo.api.finance.domain.FinancialInvestment;
import br.com.nucleo.api.finance.domain.FinancialInvestmentLot;
import br.com.nucleo.api.finance.domain.FinancialInvestmentMovement;
import br.com.nucleo.api.finance.repository.FinancialAccountRepository;
import br.com.nucleo.api.finance.repository.FinancialInvestmentLotRepository;
import br.com.nucleo.api.finance.repository.FinancialInvestmentMovementRepository;
import br.com.nucleo.api.finance.repository.FinancialInvestmentRepository;
import br.com.nucleo.api.finance.repository.FinancialInvestmentYieldEntryRepository;
import br.com.nucleo.api.finance.repository.FinancialMarketIndexValueRepository;
import br.com.nucleo.api.finance.repository.FinancialTransferRepository;
import br.com.nucleo.api.finance.service.FinancialBusinessCalendar;
import br.com.nucleo.api.finance.service.FinancialInvestmentService;
import br.com.nucleo.api.finance.service.InvestmentYieldEngine;
import br.com.nucleo.api.identity.user.domain.User;
import br.com.nucleo.api.security.handler.SecurityErrorWriter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.invocation.InvocationOnMock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(FinancialInvestmentController.class)
@Import({
        SecurityConfig.class,
        SecurityErrorWriter.class,
        FinancialInvestmentService.class,
        InvestmentYieldEngine.class,
        FinancialBusinessCalendar.class
})
class FinancialInvestmentCreateIntegrationTest {
    private static final UUID USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID FAMILY_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private FamilyAccessService familyAccessService;

    @MockitoBean
    private FinancialAccountRepository accountRepository;

    @MockitoBean
    private FinancialInvestmentRepository investmentRepository;

    @MockitoBean
    private FinancialInvestmentLotRepository lotRepository;

    @MockitoBean
    private FinancialInvestmentMovementRepository movementRepository;

    @MockitoBean
    private FinancialInvestmentYieldEntryRepository yieldEntryRepository;

    @MockitoBean
    private FinancialMarketIndexValueRepository indexValueRepository;

    @MockitoBean
    private FinancialTransferRepository transferRepository;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @MockitoBean
    private AuditService auditService;

    private final List<FinancialInvestment> investments = new ArrayList<>();
    private final List<FinancialInvestmentMovement> movements = new ArrayList<>();

    @BeforeEach
    void setUp() {
        User user = User.create("Paulo Velosa", "paulo@example.com", "hash");
        ReflectionTestUtils.setField(user, "id", USER_ID);
        Family family = Family.create("Nucleo", user);
        ReflectionTestUtils.setField(family, "id", FAMILY_ID);
        FamilyMembership membership = FamilyMembership.createOwner(family, user);

        when(familyAccessService.requireAdministrator(USER_ID)).thenReturn(membership);
        when(familyAccessService.requireActiveMembership(USER_ID)).thenReturn(membership);

        when(investmentRepository.save(any(FinancialInvestment.class))).thenAnswer(invocation -> {
            FinancialInvestment investment = assignId(invocation);
            investments.add(investment);
            when(investmentRepository.findByIdAndFamily_Id(investment.getId(), FAMILY_ID))
                    .thenReturn(Optional.of(investment));
            return investment;
        });
        when(lotRepository.save(any(FinancialInvestmentLot.class))).thenAnswer(this::assignId);
        when(movementRepository.save(any(FinancialInvestmentMovement.class))).thenAnswer(invocation -> {
            FinancialInvestmentMovement movement = assignId(invocation);
            movements.add(movement);
            return movement;
        });
        when(movementRepository.findAllByInvestment_IdOrderByMovementDateDescCreatedAtDesc(any()))
                .thenReturn(movements);
        when(investmentRepository.findAllByFamily_IdOrderByActiveDescNameAsc(FAMILY_ID))
                .thenReturn(investments);
        when(movementRepository.existsByIdempotencyKey(anyString())).thenReturn(false);
    }

    @Test
    void createsPercentCdiInvestmentWithNullOptionalFieldsAndListsWithoutDuplication()
            throws Exception {
        mockMvc.perform(post("/api/finance/investments")
                        .with(jwt().jwt(token -> token.subject(USER_ID.toString())))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(exactPayload()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Caixinha CDI"))
                .andExpect(jsonPath("$.accountId").doesNotExist())
                .andExpect(jsonPath("$.institution").value("Nubank"))
                .andExpect(jsonPath("$.modality").value("PERCENT_CDI"))
                .andExpect(jsonPath("$.benchmarkPercentage").value(120))
                .andExpect(jsonPath("$.annualFixedRate").doesNotExist())
                .andExpect(jsonPath("$.annualSpreadRate").doesNotExist())
                .andExpect(jsonPath("$.currentBalance").value(10454.79))
                .andExpect(jsonPath("$.totalContributed").value(10454.79))
                .andExpect(jsonPath("$.accumulatedYield").value(0))
                .andExpect(jsonPath("$.accumulatedReturnPercentage").value(0.0))
                .andExpect(jsonPath("$.valuationStatus").value("RECONCILED"))
                .andExpect(jsonPath("$.autoCalculate").value(true))
                .andExpect(jsonPath("$.taxExempt").value(false))
                .andExpect(jsonPath("$.movements", hasSize(1)));

        mockMvc.perform(get("/api/finance/investments")
                        .with(jwt().jwt(token -> token.subject(USER_ID.toString()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Caixinha CDI"))
                .andExpect(jsonPath("$[0].accountId").doesNotExist())
                .andExpect(jsonPath("$[0].movements", hasSize(1)));

        verify(investmentRepository).save(any(FinancialInvestment.class));
    }

    @Test
    void contributionWithoutAccountUpdatesInvestmentWithoutFinancialTransfer()
            throws Exception {
        mockMvc.perform(post("/api/finance/investments")
                        .with(jwt().jwt(token -> token.subject(USER_ID.toString())))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(exactPayload()))
                .andExpect(status().isCreated());

        UUID investmentId = investments.get(0).getId();

        mockMvc.perform(post("/api/finance/investments/{investmentId}/contributions", investmentId)
                        .with(jwt().jwt(token -> token.subject(USER_ID.toString())))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "accountId": null,
                                  "amount": 100.00,
                                  "date": "2026-08-28",
                                  "notes": "Aporte sem conta"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentBalance").value(10554.79))
                .andExpect(jsonPath("$.totalContributed").value(10554.79))
                .andExpect(jsonPath("$.movements", hasSize(2)));

        verify(transferRepository, never()).save(any());
    }

    private String exactPayload() {
        return """
                {
                  "name": "Caixinha CDI",
                  "institution": "Nubank",
                  "modality": "PERCENT_CDI",
                  "startDate": "2026-08-27",
                  "initialAmount": 10454.79,
                  "maturityDate": null,
                  "liquidity": null,
                  "benchmarkPercentage": 120,
                  "annualFixedRate": null,
                  "annualSpreadRate": null,
                  "taxExempt": false,
                  "autoCalculate": true,
                  "accrualStartRule": "NEXT_BUSINESS_DAY",
                  "notes": null
                }
                """;
    }

    private <T> T assignId(InvocationOnMock invocation) {
        T entity = invocation.getArgument(0);
        if (ReflectionTestUtils.getField(entity, "id") == null) {
            ReflectionTestUtils.setField(entity, "id", UUID.randomUUID());
        }
        return entity;
    }
}

package br.com.nucleo.api.finance.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import br.com.nucleo.api.family.domain.Family;
import br.com.nucleo.api.family.service.FamilyAccessService;
import br.com.nucleo.api.finance.domain.FinancialInvestment;
import br.com.nucleo.api.finance.domain.FinancialInvestmentAccrualStartRule;
import br.com.nucleo.api.finance.domain.FinancialInvestmentModality;
import br.com.nucleo.api.finance.dto.FinancialInvestmentDashboardResponse;
import br.com.nucleo.api.finance.repository.FinancialInvestmentLotRepository;
import br.com.nucleo.api.finance.repository.FinancialInvestmentMovementRepository;
import br.com.nucleo.api.finance.repository.FinancialInvestmentRepository;
import br.com.nucleo.api.finance.repository.FinancialInvestmentYieldEntryRepository;
import br.com.nucleo.api.finance.repository.FinancialMarketIndexValueRepository;
import br.com.nucleo.api.finance.repository.FinancialTransferRepository;
import br.com.nucleo.api.identity.user.domain.User;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class FinancialInvestmentServiceDashboardTest {
    private static final UUID FAMILY_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Mock
    private FamilyAccessService familyAccessService;
    @Mock
    private FinancialInvestmentRepository investmentRepository;
    @Mock
    private FinancialInvestmentLotRepository lotRepository;
    @Mock
    private FinancialInvestmentMovementRepository movementRepository;
    @Mock
    private FinancialInvestmentYieldEntryRepository yieldEntryRepository;
    @Mock
    private FinancialMarketIndexValueRepository indexValueRepository;
    @Mock
    private FinancialTransferRepository transferRepository;

    private FinancialInvestmentService service;
    private User user;
    private Family family;

    @BeforeEach
    void setUp() {
        service = new FinancialInvestmentService(
                familyAccessService,
                null,
                investmentRepository,
                lotRepository,
                movementRepository,
                yieldEntryRepository,
                indexValueRepository,
                transferRepository,
                new FinancialBusinessCalendar(),
                new InvestmentYieldEngine()
        );
        user = User.create("Paulo Velosa", "paulo@example.com", "hash");
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
        family = Family.create("Nucleo", user);
        ReflectionTestUtils.setField(family, "id", FAMILY_ID);
    }

    @Test
    void dashboardUsesOnlyActiveInvestmentProductsForCardIndicators() {
        FinancialInvestment active = investment("Caixinha", "10454.79", "123.45", true);
        FinancialInvestment inactive = investment("Produto encerrado", "9000.00", "800.00", false);

        when(investmentRepository.calculateInvestedBalance(FAMILY_ID))
                .thenReturn(new BigDecimal("10454.79"));
        when(investmentRepository.findAllByFamily_IdOrderByActiveDescNameAsc(FAMILY_ID))
                .thenReturn(List.of(active, inactive));
        when(movementRepository.findAllByInvestment_IdOrderByMovementDateDescCreatedAtDesc(active.getId()))
                .thenReturn(List.of());

        FinancialInvestmentDashboardResponse dashboard = service.dashboardForFamily(
                FAMILY_ID,
                YearMonth.of(2026, 8)
        );

        assertThat(dashboard.investedBalance()).isEqualByComparingTo("10454.79");
        assertThat(dashboard.accumulatedYield()).isEqualByComparingTo("123.45");
        assertThat(dashboard.activeProductCount()).isEqualTo(1);
    }

    private FinancialInvestment investment(
            String name,
            String balance,
            String accumulatedYield,
            boolean active
    ) {
        FinancialInvestment investment = FinancialInvestment.create(
                family,
                name,
                "Nubank",
                FinancialInvestmentModality.PERCENT_CDI,
                LocalDate.of(2026, 8, 27),
                null,
                null,
                new BigDecimal("120"),
                null,
                null,
                false,
                true,
                FinancialInvestmentAccrualStartRule.NEXT_BUSINESS_DAY,
                new BigDecimal(balance),
                null,
                user
        );
        ReflectionTestUtils.setField(investment, "id", UUID.randomUUID());
        ReflectionTestUtils.setField(investment, "accumulatedYield", new BigDecimal(accumulatedYield));
        ReflectionTestUtils.setField(investment, "active", active);
        return investment;
    }
}

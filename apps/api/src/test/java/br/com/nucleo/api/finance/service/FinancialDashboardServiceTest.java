package br.com.nucleo.api.finance.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import br.com.nucleo.api.family.domain.Family;
import br.com.nucleo.api.family.domain.FamilyMembership;
import br.com.nucleo.api.family.service.FamilyAccessService;
import br.com.nucleo.api.finance.domain.FinancialAccount;
import br.com.nucleo.api.finance.domain.FinancialAccountType;
import br.com.nucleo.api.finance.domain.FinancialInvestmentValuationStatus;
import br.com.nucleo.api.finance.dto.FinancialDashboardResponse;
import br.com.nucleo.api.finance.dto.FinancialInvestmentDashboardResponse;
import br.com.nucleo.api.finance.repository.FinancialAccountRepository;
import br.com.nucleo.api.finance.repository.FinancialBudgetRepository;
import br.com.nucleo.api.finance.repository.FinancialCreditCardInstallmentRepository;
import br.com.nucleo.api.finance.repository.FinancialInvestmentRepository;
import br.com.nucleo.api.finance.repository.FinancialRecurrenceRepository;
import br.com.nucleo.api.finance.repository.FinancialTransactionRepository;
import br.com.nucleo.api.finance.repository.FinancialTransferRepository;
import br.com.nucleo.api.identity.user.domain.User;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class FinancialDashboardServiceTest {
    private static final UUID USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID FAMILY_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Mock
    private FamilyAccessService familyAccessService;
    @Mock
    private FinancialAccountRepository accountRepository;
    @Mock
    private FinancialTransactionRepository transactionRepository;
    @Mock
    private FinancialCreditCardInstallmentRepository installmentRepository;
    @Mock
    private FinancialRecurrenceRepository recurrenceRepository;
    @Mock
    private FinancialBudgetRepository budgetRepository;
    @Mock
    private FinancialInvestmentRepository investmentRepository;
    @Mock
    private FinancialTransferRepository transferRepository;
    @Mock
    private FinancialInvestmentService investmentService;

    private FinancialDashboardService service;

    @BeforeEach
    void setUp() {
        service = new FinancialDashboardService(
                familyAccessService,
                accountRepository,
                transactionRepository,
                installmentRepository,
                recurrenceRepository,
                budgetRepository,
                investmentRepository,
                transferRepository,
                investmentService,
                new FinancialUpcomingInvoiceCalculator()
        );

        User user = User.create("Paulo Velosa", "paulo@example.com", "hash");
        ReflectionTestUtils.setField(user, "id", USER_ID);
        Family family = Family.create("Nucleo", user);
        ReflectionTestUtils.setField(family, "id", FAMILY_ID);
        when(familyAccessService.requireActiveMembership(USER_ID))
                .thenReturn(FamilyMembership.createOwner(family, user));

        when(transactionRepository.search(eq(FAMILY_ID), any(), any(), any(), any(), any(), any()))
                .thenReturn(List.of());
        when(installmentRepository.findAllForDashboardPeriod(eq(FAMILY_ID), any(), any()))
                .thenReturn(List.of());
        when(installmentRepository.findAllOpenCommitments(eq(FAMILY_ID), any()))
                .thenReturn(List.of());
        when(recurrenceRepository.findAllByFamily_IdOrderByActiveDescCreatedAtDesc(FAMILY_ID))
                .thenReturn(List.of());
        when(budgetRepository.findAllByFamily_IdAndReferenceMonthOrderByCategory_NameAsc(eq(FAMILY_ID), any()))
                .thenReturn(List.of());
    }

    @Test
    void excludesInvestmentsAndNonConsolidatedAccountsFromAvailableBalance() {
        FinancialAccount checking = account(
                "Conta corrente",
                FinancialAccountType.CHECKING,
                "1000.00",
                true
        );
        FinancialAccount cash = account("Dinheiro", FinancialAccountType.CASH, "250.00", true);
        FinancialAccount payment = account(
                "Conta pagamento",
                FinancialAccountType.DIGITAL_WALLET,
                "300.00",
                true
        );
        FinancialAccount legacyInvestment = account(
                "Investimento antigo",
                FinancialAccountType.INVESTMENT,
                "9000.00",
                true
        );
        FinancialAccount fgts = account("FGTS", FinancialAccountType.OTHER, "5000.00", false);

        when(accountRepository.findAllByFamily_IdOrderByActiveDescNameAsc(FAMILY_ID))
                .thenReturn(List.of(checking, cash, payment, legacyInvestment, fgts));
        when(accountRepository.calculatePaidMovementBalance(any())).thenReturn(BigDecimal.ZERO);
        when(transferRepository.calculateCompletedTransferBalance(any())).thenReturn(BigDecimal.ZERO);
        when(investmentRepository.calculateInvestedBalance(FAMILY_ID))
                .thenReturn(new BigDecimal("10454.79"));
        when(investmentService.dashboardForFamily(eq(FAMILY_ID), any()))
                .thenReturn(new FinancialInvestmentDashboardResponse(
                        new BigDecimal("10454.79"),
                        new BigDecimal("123.45"),
                        1,
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        FinancialInvestmentValuationStatus.ESTIMATED,
                        LocalDate.of(2026, 8, 27)
                ));

        FinancialDashboardResponse dashboard = service.getDashboard(
                USER_ID,
                LocalDate.of(2026, 8, 1),
                LocalDate.of(2026, 8, 31)
        );

        assertThat(dashboard.availableAccountBalance()).isEqualByComparingTo("1550.00");
        assertThat(dashboard.investmentBalance()).isEqualByComparingTo("10454.79");
        assertThat(dashboard.totalAccountBalance()).isEqualByComparingTo("12004.79");
        assertThat(dashboard.investmentSummary().investedBalance()).isEqualByComparingTo("10454.79");
        assertThat(dashboard.investmentSummary().accumulatedYield()).isEqualByComparingTo("123.45");
        assertThat(dashboard.investmentSummary().activeProductCount()).isEqualTo(1);
    }

    private FinancialAccount account(
            String name,
            FinancialAccountType type,
            String initialBalance,
            boolean includeInTotal
    ) {
        User user = User.create("Paulo Velosa", UUID.randomUUID() + "@example.com", "hash");
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
        Family family = Family.create("Nucleo", user);
        ReflectionTestUtils.setField(family, "id", FAMILY_ID);
        FinancialAccount account = FinancialAccount.create(
                family,
                name,
                type,
                new BigDecimal(initialBalance),
                null,
                includeInTotal,
                user
        );
        ReflectionTestUtils.setField(account, "id", UUID.randomUUID());
        return account;
    }
}

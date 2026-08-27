package br.com.nucleo.api.finance.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.nucleo.api.family.domain.Family;
import br.com.nucleo.api.family.domain.FamilyMembership;
import br.com.nucleo.api.family.service.FamilyAccessService;
import br.com.nucleo.api.finance.domain.FinancialAccount;
import br.com.nucleo.api.finance.domain.FinancialAccountType;
import br.com.nucleo.api.finance.dto.CreateFinancialAccountRequest;
import br.com.nucleo.api.finance.repository.FinancialAccountRepository;
import br.com.nucleo.api.finance.repository.FinancialTransactionRepository;
import br.com.nucleo.api.finance.repository.FinancialTransferRepository;
import br.com.nucleo.api.identity.user.domain.User;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class FinancialAccountServiceInvestmentArchiveTest {
    private static final UUID USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID FAMILY_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Mock
    private FamilyAccessService familyAccessService;
    @Mock
    private FinancialAccountRepository accountRepository;
    @Mock
    private FinancialTransactionRepository transactionRepository;
    @Mock
    private FinancialTransferRepository transferRepository;

    private FinancialAccountService service;
    private Family family;
    private User user;

    @BeforeEach
    void setUp() {
        service = new FinancialAccountService(
                familyAccessService,
                accountRepository,
                transactionRepository,
                transferRepository
        );
        user = User.create("Paulo Velosa", "paulo@example.com", "hash");
        ReflectionTestUtils.setField(user, "id", USER_ID);
        family = Family.create("Nucleo", user);
        ReflectionTestUtils.setField(family, "id", FAMILY_ID);
        FamilyMembership membership = FamilyMembership.createOwner(family, user);
        when(familyAccessService.requireAdministrator(USER_ID)).thenReturn(membership);
    }

    @Test
    void investmentAccountNeverParticipatesInConsolidatedBalance() {
        when(accountRepository.save(org.mockito.ArgumentMatchers.any(FinancialAccount.class)))
                .thenAnswer(invocation -> {
                    FinancialAccount account = invocation.getArgument(0);
                    ReflectionTestUtils.setField(account, "id", UUID.randomUUID());
                    return account;
                });

        var response = service.create(
                USER_ID,
                new CreateFinancialAccountRequest(
                        "Investimento legado",
                        FinancialAccountType.INVESTMENT,
                        new BigDecimal("9000.00"),
                        null,
                        true
                )
        );

        assertThat(response.includeInTotal()).isFalse();
        assertThat(response.currentBalance()).isEqualByComparingTo("0.00");
    }

    @Test
    void deletesLegacyInvestmentAccountWithoutHistory() {
        FinancialAccount account = account(FinancialAccountType.INVESTMENT);
        when(accountRepository.findByIdAndFamily_Id(account.getId(), FAMILY_ID))
                .thenReturn(Optional.of(account));
        when(transactionRepository.existsByAccount_Id(account.getId())).thenReturn(false);
        when(transferRepository.existsBySourceAccount_IdOrDestinationAccount_Id(account.getId(), account.getId()))
                .thenReturn(false);

        var response = service.delete(USER_ID, account.getId());

        assertThat(response.archived()).isFalse();
        verify(accountRepository).delete(account);
    }

    @Test
    void archivesLegacyInvestmentAccountWithHistoryAndHidesItFromDefaultList() {
        FinancialAccount account = account(FinancialAccountType.INVESTMENT);
        when(accountRepository.findByIdAndFamily_Id(account.getId(), FAMILY_ID))
                .thenReturn(Optional.of(account));
        when(transactionRepository.existsByAccount_Id(account.getId())).thenReturn(true);

        var response = service.delete(USER_ID, account.getId());

        assertThat(response.archived()).isTrue();
        assertThat(response.message()).contains("arquivada");
        assertThat(account.isActive()).isFalse();
        assertThat(account.isIncludeInTotal()).isFalse();
        verify(accountRepository, never()).delete(account);

        when(familyAccessService.requireActiveMembership(USER_ID))
                .thenReturn(FamilyMembership.createOwner(family, user));
        when(accountRepository.findAllByFamily_IdOrderByActiveDescNameAsc(FAMILY_ID))
                .thenReturn(List.of(account));

        assertThat(service.list(USER_ID)).isEmpty();
    }

    private FinancialAccount account(FinancialAccountType type) {
        FinancialAccount account = FinancialAccount.create(
                family,
                "Conta teste",
                type,
                new BigDecimal("9000.00"),
                null,
                true,
                user
        );
        ReflectionTestUtils.setField(account, "id", UUID.randomUUID());
        return account;
    }
}

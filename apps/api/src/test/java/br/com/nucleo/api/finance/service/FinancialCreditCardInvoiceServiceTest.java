package br.com.nucleo.api.finance.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import br.com.nucleo.api.family.domain.Family;
import br.com.nucleo.api.family.domain.FamilyMembership;
import br.com.nucleo.api.family.service.FamilyAccessService;
import br.com.nucleo.api.finance.domain.FinancialCategory;
import br.com.nucleo.api.finance.domain.FinancialCategoryType;
import br.com.nucleo.api.finance.domain.FinancialCreditCard;
import br.com.nucleo.api.finance.domain.FinancialCreditCardBrand;
import br.com.nucleo.api.finance.domain.FinancialCreditCardInstallment;
import br.com.nucleo.api.finance.domain.FinancialCreditCardInvoice;
import br.com.nucleo.api.finance.domain.FinancialCreditCardPurchase;
import br.com.nucleo.api.finance.domain.FinancialCreditCardPurchaseType;
import br.com.nucleo.api.finance.dto.FinancialInvoiceCategorySummaryResponse;
import br.com.nucleo.api.finance.repository.FinancialAccountRepository;
import br.com.nucleo.api.finance.repository.FinancialCreditCardInstallmentRepository;
import br.com.nucleo.api.finance.repository.FinancialCreditCardInvoicePaymentRepository;
import br.com.nucleo.api.finance.repository.FinancialCreditCardInvoiceRepository;
import br.com.nucleo.api.finance.repository.FinancialCreditCardRepository;
import br.com.nucleo.api.identity.user.domain.User;
import java.math.BigDecimal;
import java.time.LocalDate;
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
class FinancialCreditCardInvoiceServiceTest {
    private static final UUID USER_ID =
            UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID FAMILY_ID =
            UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID INVOICE_ID =
            UUID.fromString("33333333-3333-3333-3333-333333333333");

    @Mock
    private FamilyAccessService familyAccessService;
    @Mock
    private FinancialCreditCardRepository cardRepository;
    @Mock
    private FinancialCreditCardInvoiceRepository invoiceRepository;
    @Mock
    private FinancialCreditCardInstallmentRepository installmentRepository;
    @Mock
    private FinancialCreditCardInvoicePaymentRepository paymentRepository;
    @Mock
    private FinancialAccountRepository accountRepository;

    private FinancialCreditCardInvoiceService service;
    private Family family;
    private User user;
    private FinancialCreditCard card;
    private FinancialCreditCardInvoice invoice;

    @BeforeEach
    void setUp() {
        service = new FinancialCreditCardInvoiceService(
                familyAccessService,
                cardRepository,
                invoiceRepository,
                installmentRepository,
                paymentRepository,
                accountRepository
        );

        user = User.create("Paulo Velosa", "paulo@example.com", "hash");
        ReflectionTestUtils.setField(user, "id", USER_ID);
        family = Family.create("Nucleo", user);
        ReflectionTestUtils.setField(family, "id", FAMILY_ID);
        card = FinancialCreditCard.create(
                family,
                "Nubank",
                FinancialCreditCardBrand.MASTERCARD,
                "5899",
                new BigDecimal("10000.00"),
                24,
                8,
                null,
                "#a1a1aa",
                user
        );
        ReflectionTestUtils.setField(card, "id", UUID.randomUUID());
        invoice = FinancialCreditCardInvoice.create(
                card,
                LocalDate.of(2026, 9, 1),
                LocalDate.of(2026, 8, 24),
                LocalDate.of(2026, 9, 8)
        );
        ReflectionTestUtils.setField(invoice, "id", INVOICE_ID);

        when(familyAccessService.requireActiveMembership(USER_ID))
                .thenReturn(FamilyMembership.createOwner(family, user));
        when(invoiceRepository.findByIdAndCreditCard_Family_Id(
                INVOICE_ID,
                FAMILY_ID
        )).thenReturn(Optional.of(invoice));
    }

    @Test
    void summarizesInvoiceByNetCategoryAmountOrderedDescending() {
        FinancialCategory mercado = category("Mercado", "#ffffff");
        FinancialCategory taxas = category("Taxas e encargos", "#a1a1aa");

        when(installmentRepository.findAllByInvoice_IdOrderByInstallmentNumberAsc(
                INVOICE_ID
        )).thenReturn(List.of(
                installment(mercado, "Compra mensal", "300.00", 1, 3,
                        FinancialCreditCardPurchaseType.DEBIT),
                installment(taxas, "IOF", "12.50", 1, 1,
                        FinancialCreditCardPurchaseType.DEBIT),
                installment(mercado, "Estorno parcial", "40.00", 1, 1,
                        FinancialCreditCardPurchaseType.CREDIT)
        ));

        List<FinancialInvoiceCategorySummaryResponse> summary =
                service.categorySummary(USER_ID, INVOICE_ID);

        assertThat(summary).hasSize(2);
        assertThat(summary.get(0).categoryName()).isEqualTo("Mercado");
        assertThat(summary.get(0).amount()).isEqualByComparingTo("260.00");
        assertThat(summary.get(0).percentage()).isEqualByComparingTo("95.41");
        assertThat(summary.get(0).itemCount()).isEqualTo(2);
        assertThat(summary.get(1).categoryName()).isEqualTo("Taxas e encargos");
        assertThat(summary.get(1).amount()).isEqualByComparingTo("12.50");
        assertThat(summary.get(1).percentage()).isEqualByComparingTo("4.59");
    }

    @Test
    void removesFullyRefundedCategoryFromInvoiceSummary() {
        FinancialCategory lazer = category("Lazer", "#d4d4d8");

        when(installmentRepository.findAllByInvoice_IdOrderByInstallmentNumberAsc(
                INVOICE_ID
        )).thenReturn(List.of(
                installment(lazer, "Cinema", "80.00", 1, 1,
                        FinancialCreditCardPurchaseType.DEBIT),
                installment(lazer, "Estorno cinema", "80.00", 1, 1,
                        FinancialCreditCardPurchaseType.CREDIT)
        ));

        assertThat(service.categorySummary(USER_ID, INVOICE_ID)).isEmpty();
    }

    private FinancialCategory category(String name, String color) {
        FinancialCategory category = FinancialCategory.create(
                family,
                name,
                FinancialCategoryType.EXPENSE,
                color,
                null
        );
        ReflectionTestUtils.setField(category, "id", UUID.randomUUID());
        return category;
    }

    private FinancialCreditCardInstallment installment(
            FinancialCategory category,
            String description,
            String amount,
            int installmentNumber,
            int totalInstallments,
            FinancialCreditCardPurchaseType purchaseType
    ) {
        FinancialCreditCardPurchase purchase = FinancialCreditCardPurchase
                .create(
                        family,
                        card,
                        category,
                        description,
                        new BigDecimal(amount).multiply(
                                BigDecimal.valueOf(totalInstallments)
                        ),
                        purchaseType,
                        LocalDate.of(2026, 8, 25),
                        totalInstallments,
                        null,
                        user
                );
        ReflectionTestUtils.setField(purchase, "id", UUID.randomUUID());

        FinancialCreditCardInstallment installment =
                FinancialCreditCardInstallment.create(
                        purchase,
                        invoice,
                        installmentNumber,
                        new BigDecimal(amount)
                );
        ReflectionTestUtils.setField(installment, "id", UUID.randomUUID());
        return installment;
    }
}

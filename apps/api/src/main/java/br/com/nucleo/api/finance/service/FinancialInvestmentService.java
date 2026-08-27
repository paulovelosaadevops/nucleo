package br.com.nucleo.api.finance.service;

import br.com.nucleo.api.common.error.ResourceNotFoundException;
import br.com.nucleo.api.family.domain.FamilyMembership;
import br.com.nucleo.api.family.service.FamilyAccessService;
import br.com.nucleo.api.finance.domain.FinancialAccount;
import br.com.nucleo.api.finance.domain.FinancialAccountType;
import br.com.nucleo.api.finance.domain.FinancialInvestment;
import br.com.nucleo.api.finance.domain.FinancialInvestmentAccrualStartRule;
import br.com.nucleo.api.finance.domain.FinancialInvestmentLot;
import br.com.nucleo.api.finance.domain.FinancialInvestmentModality;
import br.com.nucleo.api.finance.domain.FinancialInvestmentMovement;
import br.com.nucleo.api.finance.domain.FinancialInvestmentMovementType;
import br.com.nucleo.api.finance.domain.FinancialInvestmentValuationStatus;
import br.com.nucleo.api.finance.domain.FinancialInvestmentYieldEntry;
import br.com.nucleo.api.finance.domain.FinancialInvestmentYieldStatus;
import br.com.nucleo.api.finance.domain.FinancialMarketIndexValue;
import br.com.nucleo.api.finance.domain.FinancialTransfer;
import br.com.nucleo.api.finance.domain.FinancialTransferType;
import br.com.nucleo.api.finance.dto.CreateFinancialInvestmentRequest;
import br.com.nucleo.api.finance.dto.FinancialInvestmentDashboardResponse;
import br.com.nucleo.api.finance.dto.FinancialInvestmentMovementResponse;
import br.com.nucleo.api.finance.dto.FinancialInvestmentResponse;
import br.com.nucleo.api.finance.dto.InvestmentTransferRequest;
import br.com.nucleo.api.finance.dto.ReconcileInvestmentRequest;
import br.com.nucleo.api.finance.repository.FinancialAccountRepository;
import br.com.nucleo.api.finance.repository.FinancialInvestmentLotRepository;
import br.com.nucleo.api.finance.repository.FinancialInvestmentMovementRepository;
import br.com.nucleo.api.finance.repository.FinancialInvestmentRepository;
import br.com.nucleo.api.finance.repository.FinancialInvestmentYieldEntryRepository;
import br.com.nucleo.api.finance.repository.FinancialMarketIndexValueRepository;
import br.com.nucleo.api.finance.repository.FinancialTransferRepository;
import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FinancialInvestmentService {
    private static final MathContext MC = new MathContext(20, RoundingMode.HALF_UP);

    private final FamilyAccessService familyAccessService;
    private final FinancialAccountRepository accountRepository;
    private final FinancialInvestmentRepository investmentRepository;
    private final FinancialInvestmentLotRepository lotRepository;
    private final FinancialInvestmentMovementRepository movementRepository;
    private final FinancialInvestmentYieldEntryRepository yieldEntryRepository;
    private final FinancialMarketIndexValueRepository indexValueRepository;
    private final FinancialTransferRepository transferRepository;
    private final FinancialBusinessCalendar businessCalendar;
    private final InvestmentYieldEngine yieldEngine;

    public FinancialInvestmentService(
            FamilyAccessService familyAccessService,
            FinancialAccountRepository accountRepository,
            FinancialInvestmentRepository investmentRepository,
            FinancialInvestmentLotRepository lotRepository,
            FinancialInvestmentMovementRepository movementRepository,
            FinancialInvestmentYieldEntryRepository yieldEntryRepository,
            FinancialMarketIndexValueRepository indexValueRepository,
            FinancialTransferRepository transferRepository,
            FinancialBusinessCalendar businessCalendar,
            InvestmentYieldEngine yieldEngine
    ) {
        this.familyAccessService = familyAccessService;
        this.accountRepository = accountRepository;
        this.investmentRepository = investmentRepository;
        this.lotRepository = lotRepository;
        this.movementRepository = movementRepository;
        this.yieldEntryRepository = yieldEntryRepository;
        this.indexValueRepository = indexValueRepository;
        this.transferRepository = transferRepository;
        this.businessCalendar = businessCalendar;
        this.yieldEngine = yieldEngine;
    }

    @Transactional(readOnly = true)
    public FinancialInvestmentDashboardResponse dashboard(UUID currentUserId) {
        FamilyMembership membership = familyAccessService.requireActiveMembership(currentUserId);
        return dashboardForFamily(membership.getFamily().getId(), YearMonth.now());
    }

    @Transactional(readOnly = true)
    public FinancialInvestmentDashboardResponse dashboardForFamily(UUID familyId, YearMonth month) {
        BigDecimal invested = zero(investmentRepository.calculateInvestedBalance(familyId));
        List<FinancialInvestment> investments =
                investmentRepository.findAllByFamily_IdOrderByActiveDescNameAsc(familyId);
        LocalDate from = month.atDay(1);
        LocalDate to = month.atEndOfMonth();
        List<FinancialInvestmentMovement> movements = investments.stream()
                .flatMap(item -> movementRepository
                        .findAllByInvestment_IdOrderByMovementDateDescCreatedAtDesc(item.getId())
                        .stream())
                .filter(item -> !item.getMovementDate().isBefore(from))
                .filter(item -> !item.getMovementDate().isAfter(to))
                .toList();
        BigDecimal contributions = movements.stream()
                .filter(item -> item.getMovementType() == FinancialInvestmentMovementType.CONTRIBUTION)
                .map(FinancialInvestmentMovement::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal gain = movements.stream()
                .filter(item -> item.getMovementType() == FinancialInvestmentMovementType.YIELD
                        || item.getMovementType() == FinancialInvestmentMovementType.VALUATION_ADJUSTMENT
                        || item.getMovementType() == FinancialInvestmentMovementType.RECONCILIATION)
                .map(FinancialInvestmentMovement::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal start = invested.subtract(gain, MC).subtract(contributions, MC);
        BigDecimal returnPercentage = yieldEngine.modifiedDietz(
                start,
                invested,
                contributions,
                contributions.divide(BigDecimal.valueOf(2), MC)
        );
        FinancialInvestmentValuationStatus status = investments.stream()
                .anyMatch(item -> item.getRealBalance() == null)
                ? FinancialInvestmentValuationStatus.ESTIMATED
                : FinancialInvestmentValuationStatus.RECONCILED;
        LocalDate updatedAt = investments.stream()
                .map(item -> item.getLastReconciledAt() == null
                        ? item.getLastCalculatedAt()
                        : item.getLastReconciledAt())
                .filter(item -> item != null)
                .max(LocalDate::compareTo)
                .orElse(null);
        return new FinancialInvestmentDashboardResponse(
                invested,
                contributions,
                gain,
                returnPercentage,
                status,
                updatedAt
        );
    }

    @Transactional(readOnly = true)
    public List<FinancialInvestmentResponse> list(UUID currentUserId) {
        FamilyMembership membership = familyAccessService.requireActiveMembership(currentUserId);
        return investmentRepository
                .findAllByFamily_IdOrderByActiveDescNameAsc(membership.getFamily().getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public FinancialInvestmentResponse findById(UUID currentUserId, UUID investmentId) {
        FamilyMembership membership = familyAccessService.requireActiveMembership(currentUserId);
        return toResponse(requireInvestment(investmentId, membership.getFamily().getId()));
    }

    @Transactional
    public FinancialInvestmentResponse create(UUID currentUserId, CreateFinancialInvestmentRequest request) {
        FamilyMembership membership = familyAccessService.requireAdministrator(currentUserId);
        BigDecimal initialAmount = money(request.initialAmount());
        FinancialAccount account = FinancialAccount.create(
                membership.getFamily(),
                request.name(),
                FinancialAccountType.INVESTMENT,
                initialAmount,
                "#10b981",
                true,
                membership.getUser()
        );
        accountRepository.save(account);
        FinancialInvestment investment = FinancialInvestment.create(
                membership.getFamily(),
                account,
                request.name(),
                request.institution(),
                request.modality(),
                request.startDate(),
                request.maturityDate(),
                request.liquidity(),
                defaultBenchmark(request),
                request.annualFixedRate(),
                request.annualSpreadRate(),
                request.taxExempt(),
                request.autoCalculate(),
                request.accrualStartRule(),
                initialAmount,
                request.notes(),
                membership.getUser()
        );
        investmentRepository.save(investment);
        if (initialAmount.signum() > 0) {
            FinancialInvestmentLot lot = FinancialInvestmentLot.create(
                    investment,
                    null,
                    request.startDate(),
                    accrualStart(request.startDate(), investment.getAccrualStartRule()),
                    initialAmount
            );
            lotRepository.save(lot);
            movementRepository.save(FinancialInvestmentMovement.create(
                    investment,
                    null,
                    FinancialInvestmentMovementType.INITIAL_BALANCE,
                    request.startDate(),
                    initialAmount,
                    BigDecimal.ZERO,
                    initialAmount,
                    "Saldo inicial do investimento",
                    "investment-initial:" + investment.getId()
            ));
        }
        return toResponse(investment);
    }

    @Transactional
    public FinancialInvestmentResponse contribute(UUID currentUserId, UUID investmentId, InvestmentTransferRequest request) {
        FamilyMembership membership = familyAccessService.requireAdministrator(currentUserId);
        FinancialInvestment investment = requireInvestment(investmentId, membership.getFamily().getId());
        FinancialAccount source = requireAccount(request.accountId(), membership.getFamily().getId());
        ensureNonInvestment(source, "A origem do aporte deve ser uma conta de saldo disponivel");
        BigDecimal before = investment.getCalculatedBalance();
        FinancialTransfer transfer = transferRepository.save(FinancialTransfer.create(
                membership.getFamily(),
                source,
                investment.getAccount(),
                request.amount(),
                request.date(),
                FinancialTransferType.INVESTMENT_CONTRIBUTION,
                request.notes(),
                membership.getUser()
        ));
        investment.contribute(request.amount(), request.date());
        lotRepository.save(FinancialInvestmentLot.create(
                investment,
                transfer,
                request.date(),
                accrualStart(request.date(), investment.getAccrualStartRule()),
                request.amount()
        ));
        movementRepository.save(FinancialInvestmentMovement.create(
                investment,
                transfer,
                FinancialInvestmentMovementType.CONTRIBUTION,
                request.date(),
                request.amount(),
                before,
                investment.getCalculatedBalance(),
                request.notes(),
                "investment-contribution:" + transfer.getId()
        ));
        return toResponse(investment);
    }

    @Transactional
    public FinancialInvestmentResponse redeem(UUID currentUserId, UUID investmentId, InvestmentTransferRequest request) {
        FamilyMembership membership = familyAccessService.requireAdministrator(currentUserId);
        FinancialInvestment investment = requireInvestment(investmentId, membership.getFamily().getId());
        FinancialAccount destination = requireAccount(request.accountId(), membership.getFamily().getId());
        ensureNonInvestment(destination, "O destino do resgate deve ser uma conta de saldo disponivel");
        BigDecimal amount = request.amount();
        BigDecimal before = investment.getCalculatedBalance();
        BigDecimal remaining = amount;
        for (FinancialInvestmentLot lot : lotRepository
                .findAllByInvestment_IdAndActiveTrueOrderByContributionDateAscCreatedAtAsc(investmentId)) {
            if (remaining.signum() == 0) {
                break;
            }
            BigDecimal redeemed = lot.getRemainingAmount().min(remaining);
            lot.reduce(redeemed);
            remaining = remaining.subtract(redeemed);
        }
        if (remaining.signum() > 0) {
            throw new IllegalArgumentException("Saldo insuficiente para resgate");
        }
        FinancialTransfer transfer = transferRepository.save(FinancialTransfer.create(
                membership.getFamily(),
                investment.getAccount(),
                destination,
                amount,
                request.date(),
                FinancialTransferType.INVESTMENT_REDEMPTION,
                request.notes(),
                membership.getUser()
        ));
        investment.redeem(amount, request.date());
        movementRepository.save(FinancialInvestmentMovement.create(
                investment,
                transfer,
                FinancialInvestmentMovementType.REDEMPTION,
                request.date(),
                amount.negate(),
                before,
                investment.getCalculatedBalance(),
                request.notes(),
                "investment-redemption:" + transfer.getId()
        ));
        return toResponse(investment);
    }

    @Transactional
    public FinancialInvestmentResponse reconcile(UUID currentUserId, UUID investmentId, ReconcileInvestmentRequest request) {
        FamilyMembership membership = familyAccessService.requireAdministrator(currentUserId);
        FinancialInvestment investment = requireInvestment(investmentId, membership.getFamily().getId());
        BigDecimal before = investment.getCalculatedBalance();
        BigDecimal adjustment = investment.reconcile(request.realBalance(), request.referenceDate());
        movementRepository.save(FinancialInvestmentMovement.create(
                investment,
                null,
                FinancialInvestmentMovementType.RECONCILIATION,
                request.referenceDate(),
                adjustment,
                before,
                investment.getCalculatedBalance(),
                request.notes(),
                "investment-reconcile:" + investmentId + ":" + request.referenceDate()
        ));
        return toResponse(investment);
    }

    @Transactional
    public int processAutomaticYields(LocalDate until) {
        int created = 0;
        for (FinancialInvestment investment : investmentRepository.findAll()) {
            if (!investment.isActive() || !investment.isAutoCalculate()) {
                continue;
            }
            LocalDate date = investment.getLastCalculatedAt() == null
                    ? investment.getStartDate()
                    : investment.getLastCalculatedAt().plusDays(1);
            while (!date.isAfter(until)) {
                if (businessCalendar.isBusinessDay(date)) {
                    created += processDay(investment, date);
                }
                date = date.plusDays(1);
            }
        }
        return created;
    }

    private int processDay(FinancialInvestment investment, LocalDate date) {
        FinancialMarketIndexValue indexValue = marketIndexValue(investment.getModality(), date);
        BigDecimal annualRate = indexValue == null ? BigDecimal.ZERO : indexValue.getValue();
        int created = 0;
        for (FinancialInvestmentLot lot : lotRepository
                .findAllByInvestment_IdAndActiveTrueOrderByContributionDateAscCreatedAtAsc(investment.getId())) {
            if (date.isBefore(lot.getAccrualStartDate())
                    || yieldEntryRepository.existsByLot_IdAndReferenceDate(lot.getId(), date)) {
                continue;
            }
            BigDecimal before = investment.getCalculatedBalance();
            BigDecimal factor = yieldEngine.dailyFactor(
                    investment.getModality(),
                    annualRate,
                    investment.getBenchmarkPercentage(),
                    investment.getAnnualFixedRate(),
                    investment.getAnnualSpreadRate()
            );
            BigDecimal amount = yieldEngine.grossYield(lot.getRemainingAmount(), factor);
            if (amount.signum() == 0) {
                continue;
            }
            lot.addYield(amount);
            investment.yield(amount, date);
            String key = "investment-yield:" + lot.getId() + ":" + date;
            yieldEntryRepository.save(FinancialInvestmentYieldEntry.create(
                    investment,
                    lot,
                    indexValue,
                    date,
                    annualRate,
                    investment.getAnnualFixedRate(),
                    factor,
                    amount,
                    FinancialInvestmentYieldStatus.ESTIMATED,
                    key
            ));
            movementRepository.save(FinancialInvestmentMovement.create(
                    investment,
                    null,
                    FinancialInvestmentMovementType.YIELD,
                    date,
                    amount,
                    before,
                    investment.getCalculatedBalance(),
                    "Rendimento automatico estimado",
                    key
            ));
            created++;
        }
        return created;
    }

    private FinancialInvestmentResponse toResponse(FinancialInvestment investment) {
        BigDecimal totalContributed = zero(investment.getTotalContributed());
        BigDecimal totalRedeemed = zero(investment.getTotalRedeemed());
        BigDecimal calculatedBalance = zero(investment.getCalculatedBalance());
        BigDecimal base = totalContributed.subtract(totalRedeemed, MC);
        BigDecimal returnPercentage = base.signum() == 0
                ? BigDecimal.ZERO
                : calculatedBalance.subtract(base, MC)
                        .divide(base, 8, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100), MC);
        List<FinancialInvestmentMovementResponse> movements = movementRepository
                .findAllByInvestment_IdOrderByMovementDateDescCreatedAtDesc(investment.getId())
                .stream()
                .map(FinancialInvestmentMovementResponse::from)
                .toList();
        return FinancialInvestmentResponse.from(investment, returnPercentage, movements);
    }

    private FinancialInvestment requireInvestment(UUID investmentId, UUID familyId) {
        return investmentRepository.findByIdAndFamily_Id(investmentId, familyId)
                .orElseThrow(() -> new ResourceNotFoundException("Investimento nao encontrado"));
    }

    private FinancialAccount requireAccount(UUID accountId, UUID familyId) {
        return accountRepository.findByIdAndFamily_Id(accountId, familyId)
                .orElseThrow(() -> new ResourceNotFoundException("Conta financeira nao encontrada"));
    }

    private void ensureNonInvestment(FinancialAccount account, String message) {
        if (account.getType() == FinancialAccountType.INVESTMENT) {
            throw new IllegalArgumentException(message);
        }
    }

    private LocalDate accrualStart(LocalDate date, FinancialInvestmentAccrualStartRule rule) {
        if (rule == FinancialInvestmentAccrualStartRule.SAME_BUSINESS_DAY
                && businessCalendar.isBusinessDay(date)) {
            return date;
        }
        return businessCalendar.nextBusinessDay(date);
    }

    private FinancialMarketIndexValue marketIndexValue(FinancialInvestmentModality modality, LocalDate date) {
        String code = switch (modality) {
            case PERCENT_CDI, CDI_PLUS -> "CDI";
            case PERCENT_SELIC -> "SELIC";
            case IPCA_PLUS -> "IPCA";
            case SAVINGS -> "TR";
            case FIXED_RATE, MANUAL, NO_YIELD -> null;
        };
        if (code == null) {
            return null;
        }
        return indexValueRepository
                .findFirstByMarketIndex_CodeAndReferenceDateLessThanEqualOrderByReferenceDateDesc(code, date)
                .orElse(null);
    }

    private BigDecimal defaultBenchmark(CreateFinancialInvestmentRequest request) {
        if (request.benchmarkPercentage() != null) {
            return request.benchmarkPercentage();
        }
        return request.modality() == FinancialInvestmentModality.PERCENT_CDI
                || request.modality() == FinancialInvestmentModality.PERCENT_SELIC
                ? BigDecimal.valueOf(100)
                : null;
    }

    private BigDecimal money(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private BigDecimal zero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}

package br.com.nucleo.api.settings.service;

import br.com.nucleo.api.family.domain.Family;
import br.com.nucleo.api.family.domain.FamilyMembership;
import br.com.nucleo.api.family.service.FamilyAccessService;
import br.com.nucleo.api.settings.domain.FamilySettings;
import br.com.nucleo.api.settings.dto.FamilySettingsResponse;
import br.com.nucleo.api.settings.dto.UpdateFamilySettingsRequest;
import br.com.nucleo.api.settings.repository.FamilySettingsRepository;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FamilySettingsService {

    private final FamilyAccessService familyAccessService;
    private final FamilySettingsRepository settingsRepository;

    public FamilySettingsService(
            FamilyAccessService familyAccessService,
            FamilySettingsRepository settingsRepository
    ) {
        this.familyAccessService = familyAccessService;
        this.settingsRepository = settingsRepository;
    }

    @Transactional
    public FamilySettingsResponse get(UUID currentUserId) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        FamilySettings settings =
                findOrCreate(membership.getFamily());

        return FamilySettingsResponse.from(
                settings,
                membership
        );
    }

    @Transactional
    public FamilySettingsResponse update(
            UUID currentUserId,
            UpdateFamilySettingsRequest request
    ) {
        FamilyMembership administrator =
                familyAccessService.requireAdministrator(
                        currentUserId
                );

        Family family = administrator.getFamily();

        family.rename(request.familyName());
        family.changeTimeZone(request.timeZone());

        FamilySettings settings = findOrCreate(family);

        settings.update(
                request.defaultCurrency(),
                request.locale(),
                request.weekStartDay()
        );

        settingsRepository.flush();

        return FamilySettingsResponse.from(
                settings,
                administrator
        );
    }

    private FamilySettings findOrCreate(Family family) {
        return settingsRepository
                .findByFamily_Id(family.getId())
                .orElseGet(() -> createDefault(family));
    }

    private FamilySettings createDefault(Family family) {
        try {
            return settingsRepository.saveAndFlush(
                    FamilySettings.createDefault(family)
            );
        } catch (DataIntegrityViolationException exception) {
            return settingsRepository
                    .findByFamily_Id(family.getId())
                    .orElseThrow(() -> exception);
        }
    }
}
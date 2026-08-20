package br.com.nucleo.api.notification.service;

import br.com.nucleo.api.family.domain.Family;
import br.com.nucleo.api.family.domain.FamilyMembership;
import br.com.nucleo.api.family.service.FamilyAccessService;
import br.com.nucleo.api.identity.user.domain.User;
import br.com.nucleo.api.notification.domain.NotificationPreference;
import br.com.nucleo.api.notification.domain.NotificationType;
import br.com.nucleo.api.notification.dto.NotificationPreferenceResponse;
import br.com.nucleo.api.notification.dto.UpdateNotificationPreferenceRequest;
import br.com.nucleo.api.notification.repository.NotificationPreferenceRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationPreferenceService {

    private final FamilyAccessService familyAccessService;
    private final NotificationPreferenceRepository
            preferenceRepository;

    public NotificationPreferenceService(
            FamilyAccessService familyAccessService,
            NotificationPreferenceRepository preferenceRepository
    ) {
        this.familyAccessService = familyAccessService;
        this.preferenceRepository = preferenceRepository;
    }

    @Transactional
    public NotificationPreferenceResponse get(
            UUID currentUserId
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        NotificationPreference preference =
                getOrCreate(
                        membership.getFamily(),
                        membership.getUser()
                );

        return NotificationPreferenceResponse.from(preference);
    }

    @Transactional
    public NotificationPreferenceResponse update(
            UUID currentUserId,
            UpdateNotificationPreferenceRequest request
    ) {
        FamilyMembership membership =
                familyAccessService.requireActiveMembership(
                        currentUserId
                );

        NotificationPreference preference =
                getOrCreate(
                        membership.getFamily(),
                        membership.getUser()
                );

        preference.update(
                request.inAppEnabled(),
                request.familyEnabled(),
                request.agendaEnabled(),
                request.shoppingEnabled(),
                request.financeEnabled()
        );

        return NotificationPreferenceResponse.from(preference);
    }

    @Transactional
    public boolean allows(
            Family family,
            User user,
            NotificationType type
    ) {
        NotificationPreference preference =
                getOrCreate(family, user);

        return preference.allows(type);
    }

    private NotificationPreference getOrCreate(
            Family family,
            User user
    ) {
        return preferenceRepository
                .findByFamily_IdAndUser_Id(
                        family.getId(),
                        user.getId()
                )
                .orElseGet(() ->
                        preferenceRepository.save(
                                NotificationPreference
                                        .createDefault(
                                                family,
                                                user
                                        )
                        )
                );
    }
}
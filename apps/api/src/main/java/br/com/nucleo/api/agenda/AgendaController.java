package br.com.nucleo.api.agenda;

import jakarta.validation.Valid;
import java.net.URI;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/agenda")
public class AgendaController {

    private final AgendaService agendaService;
    private final AgendaReadService agendaReadService;
    private final AgendaOccurrenceActionService actionService;
    private final AgendaEventManagementService managementService;

    public AgendaController(
            AgendaService agendaService,
            AgendaReadService agendaReadService,
            AgendaOccurrenceActionService actionService,
            AgendaEventManagementService managementService
    ) {
        this.agendaService = agendaService;
        this.agendaReadService = agendaReadService;
        this.actionService = actionService;
        this.managementService = managementService;
    }

    @PostMapping("/events")
    public ResponseEntity<CreateAgendaEventResponse> create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateAgendaEventRequest request
    ) {
        CreateAgendaEventResponse response =
                agendaService.createEvent(
                        userId(jwt),
                        request
                );

        return ResponseEntity
                .created(
                        URI.create(
                                "/api/agenda/events/"
                                        + response.eventId()
                        )
                )
                .body(response);
    }

    @GetMapping("/occurrences")
    public List<AgendaOccurrenceSummaryResponse> list(
            @AuthenticationPrincipal Jwt jwt,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            OffsetDateTime from,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            OffsetDateTime to,

            @RequestParam(required = false)
            OccurrenceStatus status,

            @RequestParam(required = false)
            UUID assignedToMembershipId
    ) {
        return agendaReadService.list(
                userId(jwt),
                from.toInstant(),
                to.toInstant(),
                status,
                assignedToMembershipId
        );
    }

    @GetMapping("/occurrences/{occurrenceId}")
    public AgendaOccurrenceDetailsResponse findById(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID occurrenceId
    ) {
        return agendaReadService.findById(
                userId(jwt),
                occurrenceId
        );
    }

    @PatchMapping("/occurrences/{occurrenceId}/complete")
    public ResponseEntity<Void> complete(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID occurrenceId,
            @Valid @RequestBody
            AgendaOccurrenceActionRequest request
    ) {
        actionService.complete(
                userId(jwt),
                occurrenceId,
                request
        );

        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/occurrences/{occurrenceId}/cancel")
    public ResponseEntity<Void> cancel(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID occurrenceId,
            @Valid @RequestBody
            AgendaOccurrenceActionRequest request
    ) {
        actionService.cancel(
                userId(jwt),
                occurrenceId,
                request
        );

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/occurrences/{occurrenceId}/duplicate")
    public ResponseEntity<CreateAgendaEventResponse> duplicate(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID occurrenceId,
            @Valid
            @RequestBody(required = false)
            DuplicateAgendaEventRequest request
    ) {
        CreateAgendaEventResponse response =
                managementService.duplicateOccurrence(
                        userId(jwt),
                        occurrenceId,
                        request
                );

        return ResponseEntity
                .created(
                        URI.create(
                                "/api/agenda/events/"
                                        + response.eventId()
                        )
                )
                .body(response);
    }

    @DeleteMapping("/occurrences/{occurrenceId}")
    public ResponseEntity<Void> deleteOccurrence(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID occurrenceId
    ) {
        managementService.deleteOccurrence(
                userId(jwt),
                occurrenceId
        );

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/events/{eventId}")
    public ResponseEntity<Void> deleteEventSeries(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID eventId
    ) {
        managementService.deleteEventSeries(
                userId(jwt),
                eventId
        );

        return ResponseEntity.noContent().build();
    }

    private UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}
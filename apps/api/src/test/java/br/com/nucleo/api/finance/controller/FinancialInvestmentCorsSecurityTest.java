package br.com.nucleo.api.finance.controller;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.nucleo.api.config.SecurityConfig;
import br.com.nucleo.api.audit.service.AuditService;
import br.com.nucleo.api.family.service.FamilyAccessService;
import br.com.nucleo.api.finance.domain.FinancialInvestmentModality;
import br.com.nucleo.api.finance.domain.FinancialInvestmentValuationStatus;
import br.com.nucleo.api.finance.dto.FinancialInvestmentResponse;
import br.com.nucleo.api.finance.service.FinancialInvestmentService;
import br.com.nucleo.api.security.handler.SecurityErrorWriter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(FinancialInvestmentController.class)
@Import({SecurityConfig.class, SecurityErrorWriter.class})
@TestPropertySource(properties = {
        "app.cors.allowed-origins=https://nucleo-five-eta.vercel.app"
})
class FinancialInvestmentCorsSecurityTest {
    private static final String VERCEL_ORIGIN =
            "https://nucleo-five-eta.vercel.app";
    private static final String UNKNOWN_ORIGIN =
            "https://unknown.example.com";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private FinancialInvestmentService investmentService;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @MockitoBean
    private FamilyAccessService familyAccessService;

    @MockitoBean
    private AuditService auditService;

    @Test
    void preflightFromVercelOriginSucceeds() throws Exception {
        mockMvc.perform(options("/api/finance/investments")
                        .header(HttpHeaders.ORIGIN, VERCEL_ORIGIN)
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
                        .header(
                                HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS,
                                "Authorization, Content-Type, Accept"
                        ))
                .andExpect(status().isOk())
                .andExpect(header().string(
                        HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN,
                        VERCEL_ORIGIN
                ))
                .andExpect(header().string(
                        HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS,
                        "GET,POST,PUT,PATCH,DELETE,OPTIONS"
                ));
    }

    @Test
    void unauthenticatedPostKeepsCorsHeaderAndReturnsUnauthorized() throws Exception {
        mockMvc.perform(post("/api/finance/investments")
                        .header(HttpHeaders.ORIGIN, VERCEL_ORIGIN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validCreatePayload()))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string(
                        HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN,
                        VERCEL_ORIGIN
                ));
    }

    @Test
    void authenticatedPostFromVercelOriginWorks() throws Exception {
        when(investmentService.create(any(), any()))
                .thenReturn(response());

        mockMvc.perform(post("/api/finance/investments")
                        .with(jwt().jwt(token -> token.subject(UUID.randomUUID().toString())))
                        .header(HttpHeaders.ORIGIN, VERCEL_ORIGIN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validCreatePayload()))
                .andExpect(status().isCreated())
                .andExpect(header().string(
                        HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN,
                        VERCEL_ORIGIN
                ));
    }

    @Test
    void unknownOriginPreflightIsBlocked() throws Exception {
        mockMvc.perform(options("/api/finance/investments")
                        .header(HttpHeaders.ORIGIN, UNKNOWN_ORIGIN)
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
                        .header(
                                HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS,
                                "Authorization, Content-Type, Accept"
                        ))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist(
                        HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN
                ));
    }

    @Test
    void unknownOriginPostDoesNotExposeCorsHeader() throws Exception {
        mockMvc.perform(post("/api/finance/investments")
                        .header(HttpHeaders.ORIGIN, UNKNOWN_ORIGIN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validCreatePayload()))
                .andExpect(header().doesNotExist(
                        HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN
                ));
    }

    private String validCreatePayload() {
        return """
                {
                  "name": "Caixinha",
                  "institution": "Nubank",
                  "modality": "PERCENT_CDI",
                  "startDate": "2026-08-27",
                  "initialAmount": 100.00,
                  "benchmarkPercentage": 120,
                  "taxExempt": false,
                  "autoCalculate": true,
                  "accrualStartRule": "NEXT_BUSINESS_DAY"
                }
                """;
    }

    private FinancialInvestmentResponse response() {
        return new FinancialInvestmentResponse(
                UUID.randomUUID(),
                UUID.randomUUID(),
                "Caixinha",
                "Nubank",
                FinancialInvestmentModality.PERCENT_CDI,
                new BigDecimal("120"),
                null,
                null,
                new BigDecimal("100.00"),
                new BigDecimal("100.00"),
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                FinancialInvestmentValuationStatus.ESTIMATED,
                LocalDate.of(2026, 8, 27),
                false,
                true,
                List.of()
        );
    }
}

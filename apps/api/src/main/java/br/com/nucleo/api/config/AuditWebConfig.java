package br.com.nucleo.api.config;

import br.com.nucleo.api.audit.service.AuditRequestInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class AuditWebConfig
        implements WebMvcConfigurer {

    private final AuditRequestInterceptor auditRequestInterceptor;

    public AuditWebConfig(
            AuditRequestInterceptor auditRequestInterceptor
    ) {
        this.auditRequestInterceptor =
                auditRequestInterceptor;
    }

    @Override
    public void addInterceptors(
            InterceptorRegistry registry
    ) {
        registry.addInterceptor(
                auditRequestInterceptor
        ).addPathPatterns("/api/**");
    }
}
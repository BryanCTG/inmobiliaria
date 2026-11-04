package com.example.inmobiliaria.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;

    public SecurityConfig(CustomUserDetailsService userDetailsService) {
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
            .csrf(csrf -> csrf.disable())

            .authorizeHttpRequests(auth -> auth
                // Recursos estáticos e imágenes subidas
                .requestMatchers("/css/**", "/js/**", "/img/**", "/uploads/**", "/error").permitAll()

                // Páginas públicas
                .requestMatchers(
                    "/",
                    "/index.html",
                    "/nosotros.html",
                    "/anuncio.html",
                    "/contacto.html",
                    "/propiedad.html",
                    "/admin/login.html"
                ).permitAll()

                // API pública: solo lectura de propiedades publicadas y envío de contacto
                .requestMatchers(HttpMethod.GET, "/api/propiedades/visibles").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/propiedades/{id}").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/contacto").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/valoracion").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/valoracion/info").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/imagenes/{id}").permitAll()

                // Todo lo demás de la API y del panel: solo ADMIN
                .requestMatchers("/api/**", "/admin/**").hasRole("ADMIN")

                // Cualquier otra ruta (por ejemplo una URL mal escrita) llega al 404 normal.
                // Lo sensible (/api/** y /admin/**) ya quedó protegido arriba.
                .anyRequest().permitAll()
            )

            // Las llamadas a la API sin sesión responden 401 (en vez de redirigir al HTML de login)
            .exceptionHandling(ex -> ex
                .defaultAuthenticationEntryPointFor(
                    new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),
                    new AntPathRequestMatcher("/api/**"))
            )

            .formLogin(form -> form
                .loginPage("/admin/login.html")
                .loginProcessingUrl("/login")
                .usernameParameter("username")
                .passwordParameter("password")
                .defaultSuccessUrl("/admin/index.html", true)
                .failureUrl("/admin/login.html?error=true")
                .permitAll()
            )

            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/admin/login.html?logout=true")
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID")
                .permitAll()
            );

        return http.build();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}

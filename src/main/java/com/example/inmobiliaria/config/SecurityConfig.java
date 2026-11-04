package com.example.inmobiliaria.config;

import org.springframework.beans.factory.annotation.Value;
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
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

import com.example.inmobiliaria.Service.RateLimitService;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;
    private final RateLimitService limite;

    @Value("${app.ratelimit.login.max:20}")
    private int maxLogin;

    @Value("${app.ratelimit.login.ventana:600}")
    private long ventanaLogin;

    public SecurityConfig(CustomUserDetailsService userDetailsService, RateLimitService limite) {
        this.userDetailsService = userDetailsService;
        this.limite = limite;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
            .csrf(csrf -> csrf.disable())   // Las cookies de sesión son SameSite=Lax (ver application.properties)

            .addFilterBefore(new LoginRateLimitFilter(limite, maxLogin, ventanaLogin), UsernamePasswordAuthenticationFilter.class)

            .authorizeHttpRequests(auth -> auth
                // Recursos estáticos e imágenes subidas
                .requestMatchers("/css/**", "/js/**", "/img/**", "/uploads/**", "/error").permitAll()

                // Login del administrador
                .requestMatchers("/admin/login.html").permitAll()

                // API pública: lectura de propiedades publicadas, contacto, valoración y registro
                .requestMatchers(HttpMethod.GET, "/api/propiedades/visibles").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/propiedades/{id}").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/contacto").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/valoracion").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/valoracion/info").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/imagenes/{id}").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/registro").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/auth/yo").permitAll()

                // Cuentas de usuarios: cada rol solo entra a lo suyo
                .requestMatchers("/api/cuenta/**").hasAnyRole("CLIENTE", "PROPIETARIO")
                .requestMatchers("/api/cliente/**").hasRole("CLIENTE")
                .requestMatchers("/api/propietario/**").hasRole("PROPIETARIO")

                // Todo lo demás de la API y del panel: solo ADMIN
                .requestMatchers("/api/**", "/admin/**").hasRole("ADMIN")

                // Cualquier otra ruta (por ejemplo una URL mal escrita) llega al 404 normal.
                .anyRequest().permitAll()
            )

            // Las llamadas a la API sin sesión responden 401 (en vez de redirigir al HTML de login)
            .exceptionHandling(ex -> ex
                .defaultAuthenticationEntryPointFor(
                    new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),
                    new AntPathRequestMatcher("/api/**"))
            )

            .formLogin(form -> form
                .loginPage("/admin/login.html")      // páginas /admin/** sin sesión redirigen aquí
                .loginProcessingUrl("/login")
                .usernameParameter("username")
                .passwordParameter("password")
                // Cada rol aterriza en su propia página
                .successHandler((request, response, authentication) -> {
                    boolean admin = authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
                    boolean propietario = authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_PROPIETARIO"));
                    String destino = admin ? "/admin/index.html" : (propietario ? "/propietario.html" : "/cuenta.html");

                    // Un cliente puede volver a la página donde estaba (solo rutas internas)
                    String volver = request.getParameter("volver");
                    if (!admin && !propietario && volver != null && volver.startsWith("/") && !volver.startsWith("//")
                            && !volver.contains("\\") && !volver.contains("\r") && !volver.contains("\n")) {
                        destino = volver;
                    }
                    response.sendRedirect(destino);
                })
                .failureHandler((request, response, exception) ->
                    response.sendRedirect(LoginRateLimitFilter.origenSeguro(request.getParameter("origen")) + "?error=true"))
                .permitAll()
            )

            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessHandler((request, response, authentication) ->
                    response.sendRedirect("admin".equals(request.getParameter("destino"))
                            ? "/admin/login.html?logout=true" : "/?salio=1"))
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

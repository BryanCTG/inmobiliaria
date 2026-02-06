package com.example.inmobiliaria.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

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
                // Login ADMIN (PÚBLICO)
                .requestMatchers(
                    "/admin/login.html",
                    "/css/**",
                    "/js/**",
                    "/img/**"
                ).permitAll()

                // Páginas públicas
                .requestMatchers(
                    "/",
                    "/index.html"
                ).permitAll()

                // APIs públicas
                .requestMatchers(
                    "/api/propiedades/**",
                    "/api/contacto/**"
                ).permitAll()

                // Admin protegido
                .requestMatchers("/admin/**").hasRole("ADMIN")

                .anyRequest().authenticated()
            )

            .formLogin(form -> form
                .loginPage("/admin/login.html")     // 👈 AQUÍ
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








// package com.example.inmobiliaria.config;

// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.context.annotation.Bean;
// import org.springframework.context.annotation.Configuration;
// import org.springframework.security.authentication.AuthenticationManager;
// import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
// import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
// import org.springframework.security.config.annotation.web.builders.HttpSecurity;
// import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
// import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
// import org.springframework.security.crypto.password.PasswordEncoder;
// import org.springframework.security.web.SecurityFilterChain;

// @Configuration
// @EnableWebSecurity
// public class SecurityConfig {

//     @Autowired
//     private CustomUserDetailsService customUserDetailsService;

//     @Bean
//     public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

//         http
//             // CSRF deshabilitado para facilitar pruebas
//             .csrf(csrf -> csrf.disable())

//             // AUTORIZACIÓN DE RUTAS
//             .authorizeHttpRequests(auth -> auth

//                 // ===== RUTAS PÚBLICAS =====
//                 .requestMatchers(
//                     "/",
//                     "/index.html",
//                     "/nosotros.html",
//                     "/anuncio.html",
//                     "/anuncios.html",
//                     "/blog.html",
//                     "/contacto.html",
//                     "/propiedad.html",
//                     "/css/**",
//                     "/js/**",
//                     "/img/**",
//                     "/admin/login",
//                     "/admin/login.html"
//                 ).permitAll()

//                 // ===== API PÚBLICA =====
//                 .requestMatchers(
//                      "/admin/login"
//                 ).permitAll()

//                 // ===== ADMIN =====
//                 .requestMatchers("/admin/**").hasRole("ADMIN")

//                 // ===== TODO LO DEMÁS =====
//                 .anyRequest().authenticated()
//             )

//             // FORM LOGIN
//             .formLogin(form -> form
//                 .loginPage("/admin/login")
//                 .loginProcessingUrl("/admin/login")
//                 .defaultSuccessUrl("/admin/index.html", true)
//                 .failureUrl("/admin/login?error=true")
//                 .permitAll()
// )

//             // LOGOUT
//             .logout(logout -> logout
//                 .logoutUrl("/admin/logout")
//                 .logoutSuccessUrl("/admin/login.html?logout=true")
//                 .invalidateHttpSession(true)
//                 .deleteCookies("JSESSIONID")
//                 .permitAll()
//             )

//             // MANEJO DE ERRORES
//             .exceptionHandling(exception -> exception
//                 .authenticationEntryPoint(
//                     (request, response, authException) ->
//                         response.sendRedirect("/admin/login.html")
//                 )
//                 .accessDeniedHandler(
//                     (request, response, accessDeniedException) ->
//                         response.sendRedirect("/admin/login.html?accessDenied=true")
//                 )
//             );

//         return http.build();
//     }

//     @Bean
//     public DaoAuthenticationProvider authenticationProvider() {
//         DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
//         authProvider.setUserDetailsService(customUserDetailsService);
//         authProvider.setPasswordEncoder(passwordEncoder());
//         return authProvider;
//     }

//     @Bean
//     public PasswordEncoder passwordEncoder() {
//         return new BCryptPasswordEncoder();
//     }

//     @Bean
//     public AuthenticationManager authenticationManager(
//             AuthenticationConfiguration authConfig) throws Exception {
//         return authConfig.getAuthenticationManager();
//     }
// }


// package com.example.inmobiliaria.config;

// import org.springframework.context.annotation.Bean;
// import org.springframework.context.annotation.Configuration;
// import org.springframework.security.config.annotation.web.builders.HttpSecurity;
// import org.springframework.security.web.SecurityFilterChain;

// @Configuration
// public class SecurityConfig {
//     @Bean
//     public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
//         http
//             .csrf(csrf -> csrf.disable())
//             .cors(cors -> cors.disable())
//             .authorizeHttpRequests(auth -> auth
//                 .anyRequest().permitAll()
//             )
//             .httpBasic(httpBasic -> httpBasic.disable())
//             .formLogin(form -> form.disable());
//         return http.build();
//     }
// }

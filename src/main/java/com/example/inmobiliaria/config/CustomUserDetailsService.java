package com.example.inmobiliaria.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import com.example.inmobiliaria.model.Usuario;
import com.example.inmobiliaria.repository.UsuarioRepository;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    public UserDetails loadUserByUsername(String username)
            throws UsernameNotFoundException {

        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() ->
                        new UsernameNotFoundException("Usuario no encontrado: " + username));

        return User.builder()
                .username(usuario.getUsername())
                .password(usuario.getPassword()) // BCrypt
                .authorities(List.of(
                        new SimpleGrantedAuthority("ROLE_" + usuario.getRol())
                ))
                .disabled(!usuario.isEnabled())
                .build();
    }
}







// package com.example.inmobiliaria.config;

// import com.example.inmobiliaria.model.Usuario;
// import com.example.inmobiliaria.repository.UsuarioRepository;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.security.core.GrantedAuthority;
// import org.springframework.security.core.authority.SimpleGrantedAuthority;
// import org.springframework.security.core.userdetails.User;
// import org.springframework.security.core.userdetails.UserDetails;
// import org.springframework.security.core.userdetails.UserDetailsService;
// import org.springframework.security.core.userdetails.UsernameNotFoundException;
// import org.springframework.stereotype.Service;

// import java.util.ArrayList;
// import java.util.List;

// /**
//  * Servicio personalizado para cargar usuarios desde MongoDB
//  * Este servicio es usado automáticamente por Spring Security
//  * cuando un usuario intenta autenticarse
//  */
// @Service
// public class CustomUserDetailsService implements UserDetailsService {

//     @Autowired
//     private UsuarioRepository usuarioRepository;

//     /**
//      * Método llamado por Spring Security durante el login
//      * @param username - El nombre de usuario ingresado en el formulario
//      * @return UserDetails - Objeto con la información del usuario
//      * @throws UsernameNotFoundException si el usuario no existe
//      */
//     @Override
//     public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        
//         // Buscar el usuario en la base de datos
//         Usuario usuario = usuarioRepository.findByUsername(username)
//                 .orElseThrow(() -> new UsernameNotFoundException(
//                     "Usuario no encontrado con username: " + username));

//         // Verificar que el usuario esté habilitado
//         if (!usuario.isEnabled()) {
//             throw new UsernameNotFoundException("Usuario deshabilitado: " + username);
//         }

//         // Construir la lista de roles/autoridades
//         List<GrantedAuthority> authorities = new ArrayList<>();
        
//         // Spring Security requiere que los roles tengan el prefijo ROLE_
//         // Si guardamos "ADMIN" en la BD, aquí se convierte a "ROLE_ADMIN"
//         authorities.add(new SimpleGrantedAuthority("ROLE_" + usuario.getRol()));

//         // Retornar el UserDetails que Spring Security usará para autenticar
//         return User.builder()
//                 .username(usuario.getUsername())
//                 .password(usuario.getPassword()) // Ya debe estar hasheado con BCrypt
//                 .authorities(authorities)
//                 .accountExpired(false)
//                 .accountLocked(false)
//                 .credentialsExpired(false)
//                 .disabled(!usuario.isEnabled())
//                 .build();
//     }
// }








// @Service
// public class CustomUserDetailsService implements UserDetailsService {

//     private final AdministradorRepository repo;

//     public CustomUserDetailsService(AdministradorRepository repo) {
//         this.repo = repo;
//     }

//     @Override
//     public UserDetails loadUserByUsername(String correo) throws UsernameNotFoundException {
//         Administrador admin = repo.findByCorreo(correo);
//         if (admin == null) {
//             throw new UsernameNotFoundException("Administrador no encontrado: " + correo);
//         }
//         return User.builder()
//                 .username(admin.getCorreo())
//                 .password(admin.getContrasena())
//                 .authorities(List.of(new SimpleGrantedAuthority("ROLE_ADMIN")))
//                 .build();
//     }
// }

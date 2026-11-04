package com.example.inmobiliaria.Service;

import java.time.format.DateTimeFormatter;
import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.example.inmobiliaria.model.Contacto;
import com.example.inmobiliaria.model.Propiedad;

/**
 * Correos automáticos: confirmación a quien escribe y aviso a la inmobiliaria.
 *
 * Solo envía si hay un servidor de correo configurado (spring.mail.host, por ejemplo con la variable
 * MAIL_HOST). Si no lo hay, deja una línea en el log y la aplicación sigue funcionando normal.
 * Un fallo al enviar nunca rompe el formulario de contacto: se envía en segundo plano.
 */
@Service
public class NotificacionService {

    private static final Logger log = LoggerFactory.getLogger(NotificacionService.class);
    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("EEEE d 'de' MMMM 'de' yyyy", new Locale("es", "CO"));

    private final ObjectProvider<JavaMailSender> mailSender;

    @Value("${spring.mail.host:}")
    private String host;

    @Value("${app.notify.admin-email:}")
    private String correoAdmin;

    @Value("${app.notify.from:${spring.mail.username:}}")
    private String remitente;

    public NotificacionService(ObjectProvider<JavaMailSender> mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    public void contactoRecibido(Contacto c, Propiedad propiedad) {
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null || host == null || host.isBlank()) {
            log.info("Correo no configurado (MAIL_HOST): no se envían avisos del contacto {}", c.getId());
            return;
        }

        String titulo = propiedad != null ? propiedad.getTitulo() : null;
        String visita = c.getFechaVisita() != null
                ? c.getFechaVisita().format(FECHA) + " a las " + c.getHoraVisita()
                : null;

        // 1) Confirmación para quien escribió
        try {
            StringBuilder cuerpo = new StringBuilder();
            cuerpo.append("Hola ").append(limpiar(c.getNombre())).append(",\n\n")
                  .append("Recibimos tu mensaje y un asesor te contactará por ")
                  .append(medio(c.getMedioContacto())).append(".\n\n");
            if (titulo != null) cuerpo.append("Propiedad de interés: ").append(titulo).append('\n');
            if (visita != null) cuerpo.append("Visita solicitada: ").append(visita)
                    .append(" (te confirmaremos la disponibilidad)\n");
            cuerpo.append("\nTu mensaje:\n").append(c.getMensaje()).append("\n\n")
                  .append("Gracias por escribirnos.\nBelar Inmobiliaria");
            enviar(sender, c.getCorreo(), "Recibimos tu mensaje | Belar Inmobiliaria", cuerpo.toString());
        } catch (Exception e) {
            log.warn("No se pudo enviar la confirmación al cliente: {}", e.getMessage());
        }

        // 2) Aviso para la inmobiliaria
        if (correoAdmin != null && !correoAdmin.isBlank()) {
            try {
                StringBuilder cuerpo = new StringBuilder();
                cuerpo.append("Nuevo mensaje de contacto\n\n")
                      .append("Nombre: ").append(limpiar(c.getNombre())).append('\n')
                      .append("Correo: ").append(limpiar(c.getCorreo())).append('\n')
                      .append("Celular: ").append(c.getCelular() == null || c.getCelular().isBlank() ? "no indicó" : limpiar(c.getCelular())).append('\n')
                      .append("Prefiere: ").append(medio(c.getMedioContacto())).append('\n');
                if (titulo != null) cuerpo.append("Propiedad: ").append(titulo).append('\n');
                if (visita != null) cuerpo.append("Visita solicitada: ").append(visita).append('\n');
                cuerpo.append("\nMensaje:\n").append(c.getMensaje());
                enviar(sender, correoAdmin, "Nuevo mensaje en Belar Inmobiliaria", cuerpo.toString());
            } catch (Exception e) {
                log.warn("No se pudo enviar el aviso a la inmobiliaria: {}", e.getMessage());
            }
        }
    }

    private void enviar(JavaMailSender sender, String para, String asunto, String texto) {
        SimpleMailMessage m = new SimpleMailMessage();
        if (remitente != null && !remitente.isBlank()) m.setFrom(remitente);
        m.setTo(para);
        m.setSubject(asunto);
        m.setText(texto);
        sender.send(m);
    }

    /** Quita saltos de línea para impedir inyección de cabeceras con datos del usuario. */
    private static String limpiar(String s) {
        return s == null ? "" : s.replaceAll("[\\r\\n]+", " ").trim();
    }

    private static String medio(String m) {
        if (m == null) return "correo";
        return switch (m) {
            case "telefono" -> "teléfono";
            case "whatsapp" -> "WhatsApp";
            default -> "correo";
        };
    }
}

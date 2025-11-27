document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formLogin");
  if (!form) { console.error("formLogin no encontrado"); return; }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const correo = form.querySelector("input[name='correo']").value.trim();
    const contrasena = form.querySelector("input[name='contrasena']").value;

    if (!correo || !contrasena) {
      alert("Correo y contraseña obligatorios");
      return;
    }

    try {
      const res = await fetch("http://localhost:8080/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, contrasena })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("adminAuth", data.token);
        // ahora ir al panel admin (ruta en minúsculas)
        window.location.href = "/admin/index.html";
      } else {
        alert(data.error || "Credenciales inválidas");
      }
    } catch (err) {
      console.error("login error:", err);
      alert("No se pudo conectar al servidor");
    }
  });
});

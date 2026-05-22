import admin from "firebase-admin";

export default async function handler(req, res) {
  // Configuración de CORS y método
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Inicializar Firebase Admin SDK de forma segura
  let adminAuth;
  try {
    if (!admin.apps.length) {
      // Intentamos procesar la private key limpiando comillas o saltos de línea extraños
      const rawKey = process.env.FIREBASE_PRIVATE_KEY || "";
      const formattedKey = rawKey.replace(/\\n/g, "\n").replace(/^"|"$/g, "");

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.VITE_FIREBASE_PROJECT_ID || "tabar-token-mvp-2026",
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: formattedKey,
        }),
      });
    }
    adminAuth = admin.auth();
  } catch (initErr) {
    console.error("Error inicializando Firebase Admin:", initErr);
    return res.status(500).json({ error: "Configuración de credenciales de Firebase en Vercel incompleta o inválida: " + initErr.message });
  }

  const { email, firstName, lastName, role, companyName, origin } = req.body;

  // Solo se requiere 'email' y 'role' de forma obligatoria
  if (!email || !role) {
    return res.status(400).json({ error: "Faltan campos obligatorios (email y role)" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("Falta la variable de entorno RESEND_API_KEY");
    return res.status(500).json({ error: "Configuración del servidor incompleta" });
  }

  // Traducción y adaptación del rol
  const roleNames = {
    producer: "Productor Tabacalero",
    industry: "Acopiador (Entidad / Acopio)",
    state: "Estado (Ente Nacional / FET)",
    dealer: "Dealer (Revendedor / Trader)"
  };

  const roleName = roleNames[role] || "Entidad Registrada";

  let welcomeText = "";
  if (role === "producer") {
    welcomeText = "Te damos la bienvenida a la plataforma TABAR como Productor Tabacalero. Ahora podrás registrar tus cultivos, certificar tus fardos y acceder de forma segura al mercado digital.";
  } else if (role === "industry") {
    welcomeText = "Te damos la bienvenida a la plataforma TABAR como Acopiador/Industria. Ahora podrás registrar tus órdenes de compra, solicitar financiamiento y abrir nuevos mercados.";
  } else if (role === "state") {
    welcomeText = "Te damos la bienvenida a la plataforma TABAR en tu carácter de Entidad Estatal / Administrador del FET. Ahora podrás cargar informar novedades del FET, comunicar sobre las transferencias a provincias y poner POAs en Garantía.";
  } else if (role === "dealer") {
    welcomeText = "Te damos la bienvenida a la plataforma TABAR como Dealer/Trader. Ahora podrás operar en el mercado, financiar solicitudes y conectar de manera eficiente con productores y acopiadores.";
  } else {
    welcomeText = "Te damos la bienvenida a la plataforma TABAR. Tu solicitud de registro se ha iniciado con éxito para coordinar transacciones y optimizar tus operaciones.";
  }

  const baseOrigin = origin || "https://agrotabaco-labs.com";
  const verificationUrl = await adminAuth.generateEmailVerificationLink(email, {
  url: `${baseOrigin}/?mode=login`,
  handleCodeInApp: true,
});
  
  const hasNames = firstName && lastName;
  const greetingName = hasNames ? `${firstName.trim()} ${lastName.trim()}` : "Miembro de TABAR";
  const displayCompany = companyName ? companyName.trim() : "Entidad a confirmar";

  // Diseño HTML Dark Luxury compatible con clientes de correo, usando el dorado #e5c158
  const htmlBody = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a TABAR</title>
</head>
<body style="margin: 0; padding: 0; background-color: #121212; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E0E0E0; -webkit-font-smoothing: antialiased;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #121212; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #1a1a1a; border-radius: 16px; border: 1px solid rgba(229, 193, 88, 0.2); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); overflow: hidden; padding: 40px 30px;">
          <!-- LOGO -->
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color: #121212; border: 1px solid #e5c158; border-radius: 8px; width: 44px; height: 44px; text-align: center; vertical-align: middle; color: #e5c158; font-size: 24px; font-weight: bold; line-height: 44px; font-family: serif;">
                    T
                  </td>
                  <td style="padding-left: 12px; font-size: 20px; font-weight: 800; color: #FFFFFF; letter-spacing: 3px;">
                    TABAR
                  </td>
                </tr>
              </table>
              <div style="font-size: 10px; color: #e5c158; letter-spacing: 2px; margin-top: 5px; text-transform: uppercase; font-weight: 600;">
                Mercado Digital de Tabaco Argentino
              </div>
            </td>
          </tr>

          <!-- HEADER -->
          <tr>
            <td align="center" style="padding-bottom: 25px;">
              <h1 style="color: #FFFFFF; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">
                ¡Solicitud de Alta Recibida!
              </h1>
              <p style="color: #e5c158; font-size: 14px; font-weight: 500; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 1.5px;">
                Rol: ${roleName}
              </p>
            </td>
          </tr>

          <!-- GREETING & DETAILS -->
          <tr>
            <td style="padding-bottom: 30px;">
              <p style="font-size: 16px; line-height: 1.6; color: #E0E0E0; margin: 0 0 15px 0;">
                Estimado/a <strong>${greetingName}</strong>,
              </p>
              <p style="font-size: 15px; line-height: 1.6; color: #B0B0B0; margin: 0 0 20px 0;">
                ${welcomeText}
              </p>
              
              <!-- DETALLES DE REGISTRO -->
              <div style="background-color: rgba(229, 193, 88, 0.04); border: 1px solid rgba(229, 193, 88, 0.1); border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                <h3 style="color: #e5c158; font-size: 13px; font-weight: 700; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px;">
                  Detalles de la Entidad
                </h3>
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="font-size: 14px; color: #888888; padding: 4px 0; font-family: sans-serif;">Organización:</td>
                    <td style="font-size: 14px; color: #FFFFFF; font-weight: 600; padding: 4px 0; text-align: right; font-family: sans-serif;">${displayCompany}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 14px; color: #888888; padding: 4px 0; font-family: sans-serif;">Correo:</td>
                    <td style="font-size: 14px; color: #FFFFFF; font-weight: 600; padding: 4px 0; text-align: right; font-family: sans-serif;">${email}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 14px; color: #888888; padding: 4px 0; font-family: sans-serif;">Estado:</td>
                    <td style="font-size: 14px; color: #e5c158; font-weight: 600; padding: 4px 0; text-align: right; font-family: sans-serif;">Pendiente de Validación</td>
                  </tr>
                </table>
              </div>

              <p style="font-size: 14px; line-height: 1.6; color: #B0B0B0; margin: 0 0 10px 0; text-align: center;">
                Para continuar y verificar tu acceso a la plataforma, por favor haz clic en el siguiente enlace:
              </p>
            </td>
          </tr>

          <!-- BUTTON -->
          <tr>
            <td align="center" style="padding-bottom: 40px;">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background-color: #e5c158; border-radius: 8px;">
                    <a href="${verificationUrl}" target="_blank" style="display: inline-block; font-size: 15px; font-weight: 700; color: #0F0F0F; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-family: 'Inter', sans-serif; letter-spacing: 0.5px;">
                      Validar y Acceder al Portal
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 25px;">
              <p style="font-size: 12px; color: #666666; margin: 0 0 5px 0; line-height: 1.5;">
                Este es un correo automático enviado por el sistema de seguridad de TABAR Protocol.<br>
                Si no solicitaste esta cuenta, puedes ignorar este correo de forma segura.
              </p>
              <p style="font-size: 12px; color: #e5c158; font-weight: 600; margin: 10px 0 0 0; letter-spacing: 1px; text-transform: uppercase;">
                TABAR Protocol · Agrotabaco Labs
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Soporte Tabar <soporte@agrotabaco-labs.com>",
        to: email,
        subject: `¡Bienvenido/a a Tabar! Alta de usuario`,
        html: htmlBody
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error al disparar el email con Resend:", data);
      return res.status(response.status).json({ error: data.message || "Error al enviar el email." });
    }

    return res.status(200).json({ success: true, messageId: data.id });
  } catch (error) {
    console.error("Excepción al enviar email de validación:", error);
    return res.status(500).json({ error: "Error interno del servidor al enviar email" });
  }
}

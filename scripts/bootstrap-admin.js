// scripts/bootstrap-admin.js
//
// Crea (o actualiza) la primera cuenta admin/fideicomiso del proyecto.
// Necesario porque /admin/login solo permite ENTRAR a una cuenta que ya
// exista con role:"admin" en Firestore — no hay alta self-service por
// diseño (es el panel ops interno, no un rol público).
//
// Uso:
//   node --env-file=.env scripts/bootstrap-admin.js <email> <password> ["Nombre visible"]
//
// Ejemplo:
//   node --env-file=.env scripts/bootstrap-admin.js admin@agrotabaco.com "unaClaveSegura123" "Fideicomiso AgroTabaco"

import admin from "firebase-admin";

const [, , email, password, displayName] = process.argv;

if (!email || !password) {
  console.error("Uso: node --env-file=.env scripts/bootstrap-admin.js <email> <password> [\"Nombre visible\"]");
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const auth = admin.auth();
const db = admin.firestore();

async function main() {
  let user;
  try {
    user = await auth.getUserByEmail(email);
    await auth.updateUser(user.uid, { password, emailVerified: true });
    console.log(`Usuario existente actualizado: ${user.uid}`);
  } catch (err) {
    if (err.code !== "auth/user-not-found") throw err;
    user = await auth.createUser({ email, password, emailVerified: true });
    console.log(`Usuario creado: ${user.uid}`);
  }

  await db.collection("users").doc(user.uid).set({
    uid: user.uid,
    email,
    displayName: displayName || "Fideicomiso / Admin",
    role: "admin",
    status: "approved",
    emailVerified: true,
    createdAt: new Date().toISOString(),
  }, { merge: true });

  console.log(`Listo. Ingresá en /admin/login con ${email}.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error al crear el admin:", err);
    process.exit(1);
  });

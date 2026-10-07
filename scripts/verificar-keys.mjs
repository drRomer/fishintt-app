// =============================================================================
// Fishin't — Verificador de API keys
// =============================================================================
// Lee .env.local y comprueba contra cada servicio que la clave funcione.
// NUNCA imprime el valor de una clave: solo su estado.
//
// Ejecutar:  npm run verificar-keys
// =============================================================================

import fs from "node:fs";
import path from "node:path";

const RUTA = path.join(process.cwd(), ".env.local");

function leerEnv(ruta) {
  if (!fs.existsSync(ruta)) return {};
  const env = {};
  for (const linea of fs.readFileSync(ruta, "utf8").split(/\r?\n/)) {
    const t = linea.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = leerEnv(RUTA);
const ok = (m) => `  OK        ${m}`;
const mal = (m) => `  PROBLEMA  ${m}`;
const na = (m) => `  SIN CLAVE ${m}`;

async function verificarSafeBrowsing(key) {
  if (!key) return na("GOOGLE_SAFE_BROWSING_KEY no está definida en .env.local");
  try {
    const res = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: { clientId: "fishintt", clientVersion: "1.0" },
          threatInfo: {
            threatTypes: ["MALWARE", "SOCIAL_ENGINEERING"],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            // URL de prueba oficial de Google: debe dar coincidencia.
            threatEntries: [{ url: "http://malware.testing.google.test/testing/malware/" }],
          },
        }),
      }
    );
    const body = await res.json().catch(() => ({}));
    if (res.status === 200) {
      const detecto = Array.isArray(body?.matches) && body.matches.length > 0;
      return detecto
        ? ok("Safe Browsing: clave válida y detectó la URL de prueba de Google")
        : mal("Safe Browsing: la clave responde, pero NO detectó la URL de prueba (revisa que sea la API v4)");
    }
    if (res.status === 403) {
      const msg = body?.error?.message || "";
      return mal(
        `Safe Browsing: 403. ${/not been used|disabled/i.test(msg)
          ? "La API no está HABILITADA en el proyecto: ve a Biblioteca y habilita 'Safe Browsing API'."
          : "Clave rechazada o restringida a otra API."}`
      );
    }
    if (res.status === 400) return mal("Safe Browsing: 400, la clave parece inválida o mal copiada");
    return mal(`Safe Browsing: respuesta inesperada HTTP ${res.status}`);
  } catch (e) {
    return mal(`Safe Browsing: error de red (${e.name})`);
  }
}

async function verificarVirusTotal(key) {
  if (!key) return na("VIRUSTOTAL_API_KEY no está definida en .env.local");
  try {
    const res = await fetch("https://www.virustotal.com/api/v3/domains/google.com", {
      headers: { "x-apikey": key },
    });
    if (res.status === 200) return ok("VirusTotal: clave válida");
    if (res.status === 401) return mal("VirusTotal: 401, la clave es inválida o está mal copiada");
    if (res.status === 429) return mal("VirusTotal: 429, cuota agotada (el plan gratuito permite 4 consultas/min)");
    return mal(`VirusTotal: respuesta inesperada HTTP ${res.status}`);
  } catch (e) {
    return mal(`VirusTotal: error de red (${e.name})`);
  }
}

console.log("\n──────────────────────────────────────────────────────────────");
console.log("  Verificación de API keys (no se muestra ningún valor)");
console.log("──────────────────────────────────────────────────────────────");
if (!fs.existsSync(RUTA)) console.log("  No se encontró .env.local en", RUTA);
console.log(await verificarSafeBrowsing(env.GOOGLE_SAFE_BROWSING_KEY));
console.log(await verificarVirusTotal(env.VIRUSTOTAL_API_KEY));
console.log("  (Gemini) " + (env.GEMINI_API_KEY ? "definida localmente" : "no definida localmente; en Vercel está solo en Production"));
console.log("──────────────────────────────────────────────────────────────\n");

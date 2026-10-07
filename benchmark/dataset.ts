// =============================================================================
// Fishin't — Banco de pruebas etiquetado para el motor de detección
// =============================================================================
// Sirve para medir el motor según los criterios de éxito de la tesis (§3.2.4):
//   - Exhaustividad (recall) ≥ 85 % sobre enlaces maliciosos
//   - Tasa de falsos positivos ≤ 10 % sobre enlaces legítimos
//
// FOCO LOCAL: el conjunto está deliberadamente ponderado hacia Chile (marcas e
// instituciones chilenas suplantadas con mayor frecuencia), que es el escenario
// real de uso. La muestra internacional es pequeña y actúa como control.
//
// PROCEDENCIA DE LOS DATOS (importante para la honestidad metodológica):
//   - Los enlaces LEGÍTIMOS son dominios oficiales reales.
//   - Los enlaces de PHISHING son casos CURADOS a partir de patrones de campañas
//     chilenas documentadas (CSIRT, BancoEstado, prensa) y de la tipología de
//     src/lib/data/scams.ts. NO son capturas en vivo de un feed.
//     Para la validación final conviene complementar con una muestra de un
//     repositorio público verificado (OpenPhish / PhishTank), como indica §3.1.2.b.
//
// Los enlaces de phishing aquí listados NUNCA se visitan: el harness solo los
// analiza como texto.
// =============================================================================

export interface BenchmarkEntry {
  url: string;
  label: "phishing" | "legitimo";
  origen: "cl" | "intl";
  /** Qué indicador debería dispararse, o por qué es legítimo. */
  nota: string;
}

export const DATASET: BenchmarkEntry[] = [
  // ===========================================================================
  // LEGÍTIMOS — CHILE (instituciones suplantadas con mayor frecuencia)
  // Estos NO deben marcarse. Miden la tasa de falsos positivos.
  // ===========================================================================
  { url: "https://www.bancoestado.cl/", label: "legitimo", origen: "cl", nota: "Banca oficial (whitelist)" },
  { url: "https://www.bancoestado.cl/imagenes/_personas/home.asp", label: "legitimo", origen: "cl", nota: "Banca oficial con ruta real" },
  { url: "https://www.bancochile.cl/personas", label: "legitimo", origen: "cl", nota: "Banca oficial" },
  { url: "https://portalpersonas.bancochile.cl/mibancochile/rest/persona", label: "legitimo", origen: "cl", nota: "Subdominio legítimo + ruta larga" },
  { url: "https://www.santander.cl/personas", label: "legitimo", origen: "cl", nota: "Banca oficial" },
  { url: "https://www.bci.cl/personas", label: "legitimo", origen: "cl", nota: "Marca corta 'bci' en dominio oficial" },
  { url: "https://www.scotiabank.cl/", label: "legitimo", origen: "cl", nota: "Banca oficial" },
  { url: "https://www.itau.cl/", label: "legitimo", origen: "cl", nota: "Banca oficial" },
  { url: "https://www.bancofalabella.cl/", label: "legitimo", origen: "cl", nota: "Banca retail oficial" },
  { url: "https://www.coopeuch.cl/", label: "legitimo", origen: "cl", nota: "Cooperativa oficial" },
  { url: "https://www.sii.cl/", label: "legitimo", origen: "cl", nota: "Estado, marca corta 'sii'" },
  { url: "https://www.sii.cl/servicios_online/1039-1040.html", label: "legitimo", origen: "cl", nota: "SII con ruta numérica real" },
  { url: "https://www.chileatiende.gob.cl/fichas", label: "legitimo", origen: "cl", nota: "Estado oficial" },
  { url: "https://www.tesoreria.cl/", label: "legitimo", origen: "cl", nota: "Estado oficial" },
  { url: "https://www.registrocivil.cl/", label: "legitimo", origen: "cl", nota: "Estado oficial" },
  { url: "https://www.correoschile.cl/seguimiento", label: "legitimo", origen: "cl", nota: "Reparto oficial" },
  { url: "https://www.chilexpress.cl/seguimiento", label: "legitimo", origen: "cl", nota: "Reparto oficial" },
  { url: "https://www.starken.cl/seguimiento", label: "legitimo", origen: "cl", nota: "Reparto oficial" },
  { url: "https://www.falabella.com/falabella-cl/", label: "legitimo", origen: "cl", nota: "Retail oficial" },
  { url: "https://www.paris.cl/", label: "legitimo", origen: "cl", nota: "Retail oficial" },
  { url: "https://www.ripley.cl/", label: "legitimo", origen: "cl", nota: "Retail oficial" },
  { url: "https://www.afphabitat.cl/", label: "legitimo", origen: "cl", nota: "AFP oficial" },
  { url: "https://www.afpcapital.cl/", label: "legitimo", origen: "cl", nota: "AFP oficial" },
  { url: "https://www.tag.cl/", label: "legitimo", origen: "cl", nota: "Marca MUY corta 'tag' legítima" },
  { url: "https://www.metrogas.cl/", label: "legitimo", origen: "cl", nota: "Utility oficial" },
  { url: "https://www.enel.cl/", label: "legitimo", origen: "cl", nota: "Utility oficial" },
  { url: "https://www.entel.cl/", label: "legitimo", origen: "cl", nota: "Telco oficial" },
  { url: "https://www.mercadolibre.cl/", label: "legitimo", origen: "cl", nota: "Marketplace oficial" },

  // Legítimos chilenos FUERA de la whitelist (prueban el camino "desconocido limpio")
  { url: "https://www.uchile.cl/", label: "legitimo", origen: "cl", nota: "Universidad, NO está en whitelist" },
  { url: "https://www.umayor.cl/", label: "legitimo", origen: "cl", nota: "Universidad, NO está en whitelist" },
  { url: "https://www.emol.com/", label: "legitimo", origen: "cl", nota: "Prensa, NO está en whitelist" },
  { url: "https://www.latercera.com/", label: "legitimo", origen: "cl", nota: "Prensa, NO está en whitelist" },
  { url: "https://www.cooperativa.cl/", label: "legitimo", origen: "cl", nota: "Prensa, NO está en whitelist" },
  { url: "https://www.duoc.cl/", label: "legitimo", origen: "cl", nota: "Instituto, NO está en whitelist" },
  { url: "https://www.csirt.gob.cl/", label: "legitimo", origen: "cl", nota: "Organismo ciberseguridad, fuera de whitelist" },

  // ===========================================================================
  // LEGÍTIMOS — INTERNACIONAL (muestra de control, pequeña)
  // ===========================================================================
  { url: "https://www.google.com/", label: "legitimo", origen: "intl", nota: "Control global" },
  { url: "https://github.com/", label: "legitimo", origen: "intl", nota: "Control global" },
  { url: "https://es.wikipedia.org/wiki/Phishing", label: "legitimo", origen: "intl", nota: "Control global con ruta" },
  { url: "https://www.instagram.com/", label: "legitimo", origen: "intl", nota: "Contiene 'tag' — prueba falso positivo de marca" },

  // ===========================================================================
  // PHISHING — CHILE (patrones de campañas documentadas)
  // Estos SÍ deben marcarse. Miden la exhaustividad (recall).
  // ===========================================================================
  { url: "http://bancoestado-seguro.tk/login", label: "phishing", origen: "cl", nota: "Marca + TLD riesgo + sin HTTPS" },
  { url: "https://bancoestado-clientes.online/acceso", label: "phishing", origen: "cl", nota: "Marca + TLD riesgo" },
  { url: "http://www.bancoestado.cl.verificacion-cuenta.xyz/", label: "phishing", origen: "cl", nota: "Dominio oficial como subdominio (truco clásico)" },
  { url: "https://bancochile-seguridad.monster/bloqueo", label: "phishing", origen: "cl", nota: "Marca + TLD riesgo" },
  { url: "https://portal-santander.click/clave", label: "phishing", origen: "cl", nota: "Marca + TLD riesgo" },
  { url: "http://bci-empresas.top/token", label: "phishing", origen: "cl", nota: "Marca corta + TLD riesgo" },
  { url: "https://bancofalabella-cmr.buzz/premio", label: "phishing", origen: "cl", nota: "Marca retail + TLD riesgo" },
  { url: "http://sii-devolucion.top/renta2026", label: "phishing", origen: "cl", nota: "SII + devolución de impuestos" },
  { url: "https://sii-impuestos.cyou/formulario22", label: "phishing", origen: "cl", nota: "SII + TLD riesgo" },
  { url: "https://tesoreria-gob.click/beneficio", label: "phishing", origen: "cl", nota: "Tesorería suplantada" },
  { url: "http://chileatiende-bono.site/postular", label: "phishing", origen: "cl", nota: "Bono estatal (gancho típico)" },
  { url: "https://subsidio-gob-cl.sbs/solicitud", label: "phishing", origen: "cl", nota: "Subsidio + TLD riesgo" },
  { url: "http://chilexpress-seguimiento.ml/envio?id=X7k2", label: "phishing", origen: "cl", nota: "Reparto + query aleatoria" },
  { url: "https://correoschile-pago.cf/retencion", label: "phishing", origen: "cl", nota: "Correos + pago de retención" },
  { url: "http://starken-encomienda.ga/pago", label: "phishing", origen: "cl", nota: "Reparto suplantado" },
  { url: "https://afp-habitat.cyou/fondos", label: "phishing", origen: "cl", nota: "AFP suplantada" },
  { url: "https://tag-autopista.sbs/deuda", label: "phishing", origen: "cl", nota: "TAG + deuda (gancho típico)" },
  { url: "http://autopistacentral-pago.rest/multa", label: "phishing", origen: "cl", nota: "Autopista suplantada" },
  { url: "https://metrogas-boleta.live/pagar", label: "phishing", origen: "cl", nota: "Utility suplantada" },
  { url: "http://entel-factura.info/deuda", label: "phishing", origen: "cl", nota: "Telco suplantada" },
  { url: "https://mercadopago-chile.xyz/transferencia", label: "phishing", origen: "cl", nota: "Pagos suplantado" },
  { url: "https://claveunica-gob.site/acceso", label: "phishing", origen: "cl", nota: "ClaveÚnica (campaña documentada 2026)" },

  // Acortadores: vector dominante en smishing chileno
  { url: "https://n9.cl/abc123", label: "phishing", origen: "cl", nota: "Acortador chileno (muy usado en smishing)" },
  { url: "https://bit.ly/3spdere", label: "phishing", origen: "cl", nota: "Acortador reportado en la base comunitaria" },
  { url: "https://acortar.link/x9Kp2", label: "phishing", origen: "cl", nota: "Acortador" },
  { url: "https://lnk.ink/Qw3Zt", label: "phishing", origen: "cl", nota: "Acortador" },

  // Casos DIFÍCILES: homóglifos e IDN (el motor actual NO los detecta — §2.4.1.a los exige)
  { url: "https://bancoestadо.cl/acceso", label: "phishing", origen: "cl", nota: "HOMÓGLIFO: 'о' cirílica en bancoestado" },
  { url: "https://bancochiIe.cl/login", label: "phishing", origen: "cl", nota: "HOMÓGLIFO: 'I' mayúscula en vez de 'l'" },
  { url: "https://www.xn--bancoestad-9za.cl/", label: "phishing", origen: "cl", nota: "IDN/punycode sospechoso" },
  { url: "https://santandor.cl/personas", label: "phishing", origen: "cl", nota: "Typosquatting (santandor vs santander)" },
  { url: "https://falabela.cl/ofertas", label: "phishing", origen: "cl", nota: "Typosquatting (una 'l' menos)" },

  // Casos DIFÍCILES: dominio nuevo/limpio sin señales obvias (requiere WHOIS)
  { url: "https://portal-clientes-cl.com/ingreso", label: "phishing", origen: "cl", nota: "Dominio recién registrado, sin marca explícita (requiere WHOIS)" },
  { url: "https://verificacion-identidad.net/validar", label: "phishing", origen: "cl", nota: "Genérico y limpio (requiere WHOIS/edad)" },

  // IP directa
  { url: "http://45.33.32.156/bancoestado/login.php", label: "phishing", origen: "cl", nota: "IP directa + marca en ruta" },

  // ===========================================================================
  // PHISHING — INTERNACIONAL (muestra de control, pequeña)
  // ===========================================================================
  { url: "http://paypal-verify-account.tk/login", label: "phishing", origen: "intl", nota: "Control global" },
  { url: "https://apple-id-locked.xyz/unlock", label: "phishing", origen: "intl", nota: "Control global" },
  { url: "https://netflix-pago-rechazado.top/actualizar", label: "phishing", origen: "intl", nota: "Control global" },
  { url: "http://secure-microsoft-login.ga/office", label: "phishing", origen: "intl", nota: "Control global" },
];

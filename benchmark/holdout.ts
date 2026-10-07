// =============================================================================
// Fishin't — Conjunto de VALIDACIÓN (held-out)
// =============================================================================
// POR QUÉ EXISTE: los indicadores del motor (typosquatting, homóglifos, IP,
// antigüedad) se afinaron observando qué fallaba en benchmark/dataset.ts. Medir
// ahí otra vez devuelve una cifra optimista. Este conjunto se construye aparte
// para estimar el desempeño sobre casos que no guiaron el diseño.
//
// PRINCIPIO DE MUESTREO DISTINTO (a propósito):
//   - Los enlaces de phishing se derivan de las 10 campañas chilenas que el
//     equipo ya tenía documentadas en src/lib/data/scams.ts, no de inventar
//     casos que prueben los indicadores que sabemos que existen.
//   - Los legítimos son instituciones chilenas reales que NO aparecen en
//     dataset.ts, e incluyen varias fuera de la whitelist del motor.
//   - Se incorporan vectores EVASIVOS que el primer conjunto casi no tenía
//     (sitios legítimos comprometidos, hosting gratuito, dominios limpios),
//     porque el phishing real no se reduce a dominios .tk.
//
// REGLA DE USO: se mide UNA vez y se reporta el resultado tal cual, incluso si
// es peor. Si después se ajusta el motor mirando estos fallos, este conjunto
// deja de ser held-out y hay que construir uno nuevo.
//
// LÍMITE HONESTO: quien escribió el detector escribió también este conjunto, así
// que no hay independencia real entre evaluador y evaluado. Reduce el sesgo de
// afinamiento, no lo elimina. La validación definitiva requiere una muestra de
// un repositorio público verificado (OpenPhish / PhishTank), como pide §3.1.2.b.
// =============================================================================

import type { BenchmarkEntry } from "./dataset.ts";

/** Qué tan evidente es el fraude, para desglosar el resultado. */
export type Dificultad = "directa" | "media" | "evasiva";

export interface HoldoutEntry extends BenchmarkEntry {
  dificultad: Dificultad;
}

export const HOLDOUT: HoldoutEntry[] = [
  // ===========================================================================
  // LEGÍTIMOS — instituciones chilenas reales, ninguna usada en dataset.ts
  // ===========================================================================
  { url: "https://www.sernac.cl/portal/604/w3-channel.html", label: "legitimo", origen: "cl", dificultad: "directa", nota: "SERNAC, fuera de whitelist, ruta larga real" },
  { url: "https://www.minsal.cl/", label: "legitimo", origen: "cl", dificultad: "directa", nota: "Ministerio de Salud, fuera de whitelist" },
  { url: "https://www.fonasa.cl/sites/fonasa/beneficiarios", label: "legitimo", origen: "cl", dificultad: "directa", nota: "FONASA con subdirectorios" },
  { url: "https://www.previred.com/web/previred/", label: "legitimo", origen: "cl", dificultad: "directa", nota: "PreviRed, .com chileno fuera de whitelist" },
  { url: "https://www.pdichile.cl/", label: "legitimo", origen: "cl", dificultad: "directa", nota: "PDI" },
  { url: "https://www.carabineros.cl/", label: "legitimo", origen: "cl", dificultad: "directa", nota: "Carabineros" },
  { url: "https://www.bomberos.cl/", label: "legitimo", origen: "cl", dificultad: "directa", nota: "Bomberos de Chile" },
  { url: "https://www.dt.gob.cl/portal/1626/w3-propertyvalue-22262.html", label: "legitimo", origen: "cl", dificultad: "media", nota: "Dirección del Trabajo: .gob.cl con ruta de números" },
  { url: "https://www.bcn.cl/leychile/navegar", label: "legitimo", origen: "cl", dificultad: "directa", nota: "Biblioteca del Congreso Nacional" },
  { url: "https://www.sence.gob.cl/", label: "legitimo", origen: "cl", dificultad: "directa", nota: "SENCE" },
  { url: "https://www.mercadopublico.cl/Home", label: "legitimo", origen: "cl", dificultad: "directa", nota: "Compras públicas" },
  { url: "https://www.sodimac.cl/sodimac-cl/", label: "legitimo", origen: "cl", dificultad: "directa", nota: "Retail fuera de whitelist" },
  { url: "https://www.tottus.cl/tottus-cl/", label: "legitimo", origen: "cl", dificultad: "directa", nota: "Retail fuera de whitelist" },
  { url: "https://www.easy.cl/", label: "legitimo", origen: "cl", dificultad: "directa", nota: "Retail fuera de whitelist" },
  { url: "https://www.copec.cl/", label: "legitimo", origen: "cl", dificultad: "directa", nota: "Combustibles" },
  { url: "https://www.chilquinta.cl/", label: "legitimo", origen: "cl", dificultad: "directa", nota: "Eléctrica regional" },
  { url: "https://www.saesa.cl/", label: "legitimo", origen: "cl", dificultad: "directa", nota: "Eléctrica regional" },
  { url: "https://www.bancobice.cl/", label: "legitimo", origen: "cl", dificultad: "media", nota: "Banco real fuera de la whitelist: prueba falso positivo bancario" },
  { url: "https://www.uc.cl/", label: "legitimo", origen: "cl", dificultad: "directa", nota: "Universidad" },
  { url: "https://www.usach.cl/", label: "legitimo", origen: "cl", dificultad: "directa", nota: "Universidad" },
  { url: "https://www.udd.cl/", label: "legitimo", origen: "cl", dificultad: "directa", nota: "Universidad" },
  { url: "https://www.skyairline.com/chile", label: "legitimo", origen: "intl", dificultad: "directa", nota: "Aerolínea que opera en Chile" },
  { url: "https://www.latamairlines.com/cl/es", label: "legitimo", origen: "intl", dificultad: "directa", nota: "Aerolínea, dominio largo con ruta de idioma" },

  // ===========================================================================
  // PHISHING — derivado de las 10 campañas documentadas en scams.ts
  // ===========================================================================

  // --- Directas: TLD barato o acortador (el patrón más masivo) ---------------
  { url: "http://bancoestado-actualizar.cf/datos", label: "phishing", origen: "cl", dificultad: "directa", nota: "Campaña «actualizar datos» de BancoEstado" },
  { url: "https://bancochile-transaccion.gq/rechazar", label: "phishing", origen: "cl", dificultad: "directa", nota: "Campaña «transacción no reconocida»" },
  { url: "http://correoschile-retencion.ml/pagar", label: "phishing", origen: "cl", dificultad: "directa", nota: "Campaña «paquete retenido»" },
  { url: "https://santander-clave.cyou/restablecer", label: "phishing", origen: "cl", dificultad: "directa", nota: "Campaña de clonación de credenciales" },
  { url: "https://afphabitat-tramite.sbs/urgente", label: "phishing", origen: "cl", dificultad: "directa", nota: "Campaña «trámite urgente» de AFP" },
  { url: "https://sii-multa.buzz/pagar", label: "phishing", origen: "cl", dificultad: "directa", nota: "Campaña de multa tributaria" },
  { url: "https://cmr-falabella.rest/reclamo", label: "phishing", origen: "cl", dificultad: "directa", nota: "Campaña «compra no reconocida» CMR" },
  { url: "http://metrogas-corte.monster/evitar", label: "phishing", origen: "cl", dificultad: "directa", nota: "Campaña «corte de suministro»" },
  { url: "https://puntos-canje.top/reclamar", label: "phishing", origen: "cl", dificultad: "directa", nota: "Smishing de puntos por vencer" },
  { url: "https://acortar.link/bE9kZ", label: "phishing", origen: "cl", dificultad: "directa", nota: "Acortador en smishing" },
  { url: "https://n9.cl/sii2026", label: "phishing", origen: "cl", dificultad: "directa", nota: "Acortador chileno" },

  // --- Medias: imitación tipográfica y subdominios ---------------------------
  { url: "https://bancoestaco.cl/login", label: "phishing", origen: "cl", dificultad: "media", nota: "Typosquatting de bancoestado.cl" },
  { url: "https://correoschi1e.cl/envio", label: "phishing", origen: "cl", dificultad: "media", nota: "Dígito 1 en lugar de la letra l" },
  { url: "https://metrogaas.cl/boleta", label: "phishing", origen: "cl", dificultad: "media", nota: "Letra duplicada" },
  { url: "http://bancochile.cl.seguridad-cuenta.info/acceso", label: "phishing", origen: "cl", dificultad: "media", nota: "Dominio oficial usado como subdominio" },

  // --- Evasivas: lo que el primer conjunto casi no cubría ---------------------
  { url: "https://bancoestado-clientes.web.app/ingreso", label: "phishing", origen: "cl", dificultad: "evasiva", nota: "Hosting gratuito con la marca en el subdominio" },
  { url: "https://actualizacion-datos.pages.dev/formulario", label: "phishing", origen: "cl", dificultad: "evasiva", nota: "Hosting gratuito SIN marca: dominio padre legítimo" },
  { url: "https://verificacion-cuenta.netlify.app/login", label: "phishing", origen: "cl", dificultad: "evasiva", nota: "Hosting gratuito sin marca" },
  { url: "https://www.floreriaelrosal.cl/wp-content/uploads/bancoestado/", label: "phishing", origen: "cl", dificultad: "evasiva", nota: "Sitio chileno legítimo COMPROMETIDO (WordPress): host limpio, marca en la ruta" },
  { url: "https://construccionesvaldes.cl/wp-includes/sii/formulario.php", label: "phishing", origen: "cl", dificultad: "evasiva", nota: "WordPress comprometido, marca en la ruta" },
  { url: "https://portalclientes-cl.com/acceso", label: "phishing", origen: "cl", dificultad: "evasiva", nota: "Dominio limpio y genérico: solo delatable por antigüedad (WHOIS)" },
  { url: "https://mi-cuenta-segura.cl/validar", label: "phishing", origen: "cl", dificultad: "evasiva", nota: "Dominio .cl limpio: solo delatable por antigüedad" },
];

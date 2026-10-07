// =============================================================================
// Fishin't — Aplicación del instrumento de medición del CRD (§3.2.3 y §3.2.4)
// =============================================================================
// Registra las dos aplicaciones del instrumento (pre y post) y calcula la
// variación, que es el dato con el que se evalúan los criterios de éxito.
//
// ADVERTENCIA METODOLÓGICA (importante para el informe):
// El criterio de §3.2.4 exige ΔCRD ≥ 150. Como en el pre-test U = 0 por
// definición, un usuario que NO aprenda nada pero sí use la plataforma puede
// alcanzar ΔCRD = 10·0,35·100 = 350 solo por el componente de uso, superando el
// umbral sin ninguna ganancia de conocimiento.
// Por eso este módulo reporta además deltaC (ganancia de conocimiento aislada),
// que es la medida que realmente evidencia aprendizaje.
//
// COMPROBADO EMPÍRICAMENTE con esta implementación: un usuario con 12/12 en
// ambas aplicaciones (C = 100 en las dos, o sea cero aprendizaje) que además usa
// la plataforma hasta saturar U pasa de CRD 650 a 1000, es decir ΔCRD = +350, y
// "cumple" el umbral de 150 con ΔC = 0.
// =============================================================================

import { PESO_NIVEL, type NivelEjercicio } from "./ejercicios";
import { INSTRUMENTOS, type TipoInstrumento } from "./data/evaluacion";
import { computeU, type Activity } from "./activity";

export interface RespuestaItem {
  id: string;
  nivel: NivelEjercicio;
  correcto: boolean;
}

export interface ResultadoInstrumento {
  tipo: TipoInstrumento;
  c: number; // componente de Conocimiento (0..100)
  u: number; // componente de Uso al momento de rendirlo (0..100)
  crd: number; // 0..1000
  aciertos: number;
  total: number;
  fecha: string;
}

const KEY = "fishintt_evaluaciones";

export function getResultados(): ResultadoInstrumento[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/** Calcula C ponderado por dificultad: C = (Σ wᵢ·xᵢ / Σ wᵢ) × 100 */
export function calcularC(respuestas: RespuestaItem[]): number {
  let num = 0;
  let den = 0;
  for (const r of respuestas) {
    const w = PESO_NIVEL[r.nivel] ?? 1;
    den += w;
    if (r.correcto) num += w;
  }
  return den === 0 ? 0 : (num / den) * 100;
}

/**
 * Guarda el resultado de una aplicación del instrumento.
 * En el pre-test U = 0 por definición del instrumento (§3.2.3): el valor
 * inicial debe reflejar exclusivamente el conocimiento previo.
 */
export function guardarResultado(
  tipo: TipoInstrumento,
  respuestas: RespuestaItem[],
  actividad: Activity,
  reportes: number
): ResultadoInstrumento {
  const c = calcularC(respuestas);
  const u = tipo === "pre" ? 0 : computeU(actividad, reportes);
  const resultado: ResultadoInstrumento = {
    tipo,
    c,
    u,
    crd: Math.round(10 * (0.65 * c + 0.35 * u)),
    aciertos: respuestas.filter((r) => r.correcto).length,
    total: respuestas.length,
    fecha: new Date().toISOString(),
  };
  try {
    // Se conserva la última aplicación de cada tipo.
    const otros = getResultados().filter((r) => r.tipo !== tipo);
    localStorage.setItem(KEY, JSON.stringify([...otros, resultado]));
  } catch {
    /* almacenamiento no disponible */
  }
  return resultado;
}

export function getResultado(tipo: TipoInstrumento): ResultadoInstrumento | null {
  return getResultados().find((r) => r.tipo === tipo) ?? null;
}

/** Qué aplicación corresponde rendir ahora, o null si ya están ambas. */
export function siguienteInstrumento(): TipoInstrumento | null {
  if (!getResultado("pre")) return "pre";
  if (!getResultado("post")) return "post";
  return null;
}

export function nivelCrd(crd: number): string {
  if (crd < 400) return "Vulnerable";
  if (crd < 600) return "En formación";
  if (crd < 800) return "Resiliente";
  return "Experto";
}

export interface Comparacion {
  pre: ResultadoInstrumento;
  post: ResultadoInstrumento;
  deltaCrd: number;
  /** Ganancia de conocimiento aislada: la medida que sí evidencia aprendizaje. */
  deltaC: number;
  subioNivel: boolean;
  /** ¿Cumple el umbral de §3.2.4 (ΔCRD ≥ 150)? */
  cumpleUmbral: boolean;
}

export function compararAplicaciones(): Comparacion | null {
  const pre = getResultado("pre");
  const post = getResultado("post");
  if (!pre || !post) return null;
  return {
    pre,
    post,
    deltaCrd: post.crd - pre.crd,
    deltaC: post.c - pre.c,
    subioNivel: nivelCrd(post.crd) !== nivelCrd(pre.crd),
    cumpleUmbral: post.crd - pre.crd >= 150,
  };
}

export function getItems(tipo: TipoInstrumento) {
  return INSTRUMENTOS[tipo];
}

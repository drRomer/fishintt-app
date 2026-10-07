// =============================================================================
// Fishin't — Ejercicios de clasificación (componente C del CRD)
// =============================================================================
// Registra las respuestas del usuario a los ejercicios de la Cyber-Academy,
// incluidos los que cierran cada microcápsula del analizador.
//
// Implementa el componente de Conocimiento de la tesis (§3.2.1):
//     C = ( Σ wᵢ · xᵢ / Σ wᵢ ) × 100
// con pesos por dificultad: básico = 1, intermedio = 2, avanzado = 3, y
// xᵢ = 1 si el ítem fue clasificado correctamente.
//
// Solo se conserva el PRIMER intento de cada ejercicio: repetir el mismo ítem
// hasta acertar no debe inflar el indicador de conocimiento.
// =============================================================================

export type NivelEjercicio = "basico" | "intermedio" | "avanzado";

export const PESO_NIVEL: Record<NivelEjercicio, number> = {
  basico: 1,
  intermedio: 2,
  avanzado: 3,
};

export interface RegistroEjercicio {
  id: string;
  nivel: NivelEjercicio;
  correcto: boolean;
  fecha: string;
}

const KEY = "fishintt_ejercicios";

export function getEjercicios(): RegistroEjercicio[] {
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

/** ¿Ya respondió este ejercicio alguna vez? */
export function yaRespondido(id: string): boolean {
  return getEjercicios().some((e) => e.id === id);
}

/** Registra el primer intento. Los reintentos del mismo ítem se ignoran. */
export function registrarEjercicio(
  id: string,
  nivel: NivelEjercicio,
  correcto: boolean
): RegistroEjercicio[] {
  const actuales = getEjercicios();
  if (actuales.some((e) => e.id === id)) return actuales;
  const nuevos = [
    ...actuales,
    { id, nivel, correcto, fecha: new Date().toISOString() },
  ];
  try {
    localStorage.setItem(KEY, JSON.stringify(nuevos));
  } catch {
    /* almacenamiento no disponible */
  }
  return nuevos;
}

/**
 * Componente de Conocimiento (0..100) según §3.2.1.
 * Sin ejercicios respondidos devuelve 0: el conocimiento aún no se ha medido.
 */
export function computeC(registros: RegistroEjercicio[] = getEjercicios()): number {
  if (registros.length === 0) return 0;
  let numerador = 0;
  let denominador = 0;
  for (const r of registros) {
    const w = PESO_NIVEL[r.nivel] ?? 1;
    denominador += w;
    if (r.correcto) numerador += w;
  }
  if (denominador === 0) return 0;
  return (numerador / denominador) * 100;
}

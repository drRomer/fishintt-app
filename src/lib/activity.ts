// =============================================================================
// Fishin't — Actividad del usuario (conteo local) e insignias
// =============================================================================
// Guarda contadores en localStorage para alimentar el contenedor "Tu actividad"
// y el sistema de insignias del perfil. Los reportes se cuentan desde
// "fishintt_reports" (fuente de verdad de la pantalla Reportar).
// =============================================================================

export interface Activity {
  analyses: number; // enlaces analizados
  blocked: number; // amenazas detectadas (resultado distinto de "seguro")
  educationViewed: boolean; // visitó la sección educativa
}

const KEY = "fishintt_activity";
const REPORTS_KEY = "fishintt_reports";

const EMPTY: Activity = { analyses: 0, blocked: 0, educationViewed: false };

export function getActivity(): Activity {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...EMPTY, ...JSON.parse(raw) };
  } catch {}
  return { ...EMPTY };
}

function save(a: Activity) {
  try {
    localStorage.setItem(KEY, JSON.stringify(a));
  } catch {}
}

export function getReportsCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(REPORTS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.length : 0;
    }
  } catch {}
  return 0;
}

// Registrar un análisis. `blocked` = el resultado fue sospechoso o peligroso.
export function recordAnalysis(blocked: boolean): Activity {
  const a = getActivity();
  a.analyses += 1;
  if (blocked) a.blocked += 1;
  save(a);
  return a;
}

export function markEducationViewed(): Activity {
  const a = getActivity();
  if (!a.educationViewed) {
    a.educationViewed = true;
    save(a);
  }
  return a;
}

// -----------------------------------------------------------------------------
// Coeficiente de Resiliencia Digital (CRD)
// -----------------------------------------------------------------------------
// Métrica compuesta (0..1000) definida operacionalmente en la tesis (§3.2.1).
// Combina DOS dimensiones, no solo el uso:
//   C = conocimiento demostrado en los ejercicios de clasificación (0..100),
//       ponderado por dificultad — lo entrega computeC() de ./ejercicios.
//   U = adopción de conductas preventivas en la plataforma (0..100).
//   CRD = 10 · (0,65·C + 0,35·U)
// La ponderación 65/35 es del documento: la resiliencia se sostiene en la
// competencia de la persona, no en cuánto usa la herramienta.
// El esquema Supabase reserva `profiles.crd_score` para persistirlo por usuario.

export interface CrdStatus {
  score: number; // 0..1000
  level: "Vulnerable" | "En formación" | "Resiliente" | "Experto";
  tone: "danger" | "warn" | "safe" | "navy"; // color semáforo para la UI
  hint: string;
}

/**
 * Componente de Uso (0..100) según §3.2.1:
 *   U = mín(100; 40·mín(A,15)/15 + 30·mín(R,8)/8 + 30·mín(D,10)/10)
 * A = enlaces analizados, R = amenazas reportadas, D = amenazas detectadas.
 * Los topes evitan que la repetición mecánica infle el indicador.
 */
export function computeU(a: Activity, reports: number): number {
  const A = Math.min(a.analyses, 15);
  const R = Math.min(reports, 8);
  const D = Math.min(a.blocked, 10);
  return Math.min(100, (40 * A) / 15 + (30 * R) / 8 + (30 * D) / 10);
}

/**
 * CRD = 10 · (0,65·C + 0,35·U)   — §3.2.1
 * `c` es el componente de Conocimiento (0..100) que entrega computeC() de
 * src/lib/ejercicios.ts. Sin ejercicios respondidos C = 0, de modo que el
 * puntaje refleja solo conducta de uso, tal como describe el instrumento.
 */
export function computeCrd(a: Activity, reports: number, c: number = 0): CrdStatus {
  const C = Math.max(0, Math.min(100, c));
  const U = computeU(a, reports);
  const score = Math.max(0, Math.min(1000, Math.round(10 * (0.65 * C + 0.35 * U))));

  let level: CrdStatus["level"];
  let tone: CrdStatus["tone"];
  let hint: string;
  if (score < 400) {
    level = "Vulnerable";
    tone = "danger";
    hint = "Analiza enlaces y visita Aprende para subir tu resiliencia.";
  } else if (score < 600) {
    level = "En formación";
    tone = "warn";
    hint = "Vas bien. Reporta amenazas y sigue aprendiendo.";
  } else if (score < 800) {
    level = "Resiliente";
    tone = "safe";
    hint = "Sabes identificar fraudes. Mantén el hábito de verificar.";
  } else {
    level = "Experto";
    tone = "navy";
    hint = "Dominas la detección de phishing. ¡Ayuda a tu círculo!";
  }
  return { score, level, tone, hint };
}

export interface BadgeStatus {
  key: string;
  label: string;
  earned: boolean;
  hint: string;
}

// Insignias y sus condiciones de obtención.
export function computeBadges(a: Activity, reports: number): BadgeStatus[] {
  return [
    { key: "protector", label: "Protector", earned: a.analyses >= 6, hint: "Analiza 6 enlaces" },
    { key: "reporter", label: "Reporter", earned: reports >= 6, hint: "Reporta 6 amenazas" },
    { key: "educador", label: "Educador", earned: a.educationViewed && a.analyses >= 5, hint: "Visita Aprende y analiza 5 enlaces" },
    { key: "elite", label: "Elite", earned: a.blocked >= 10, hint: "Detecta 10 amenazas" },
  ];
}

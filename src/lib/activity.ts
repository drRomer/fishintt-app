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

export interface BadgeStatus {
  key: string;
  label: string;
  earned: boolean;
  hint: string;
}

// Insignias y sus condiciones de obtención.
export function computeBadges(a: Activity, reports: number): BadgeStatus[] {
  return [
    { key: "protector", label: "Protector", earned: a.analyses >= 1, hint: "Analiza tu primer enlace" },
    { key: "reporter", label: "Reporter", earned: reports >= 1, hint: "Reporta una amenaza" },
    { key: "educador", label: "Educador", earned: a.educationViewed, hint: "Visita la sección Aprende" },
    { key: "elite", label: "Elite", earned: a.blocked >= 5, hint: "Detecta 5 amenazas" },
  ];
}

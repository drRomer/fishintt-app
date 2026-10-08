// =============================================================================
// Fishin't — Cyber-Academy: progreso y armado de los casos de ejemplo
// =============================================================================
// Dos responsabilidades, ambas del lado del cliente:
//
// 1. PROGRESO. No inventa un registro paralelo: la fuente de verdad de "esta
//    cápsula ya está hecha" es src/lib/ejercicios.ts, el mismo almacén que
//    alimenta el componente C del CRD. Consecuencia buscada: quien ya respondió
//    la cápsula de acortadores porque el analizador se la mostró tras un enlace
//    real, la encuentra hecha en la Academy, y al revés. Son la misma lección y
//    el mismo ítem, y solo cuenta el primer intento.
//
//    Lo único propio de la Academy son las pruebas de cierre, en
//    "fishintt_academia": hacen falta porque la aprobación (y con ella el
//    desbloqueo del nivel siguiente) se puede reintentar, mientras que el
//    puntaje del CRD se congela en el primer intento.
//
// 2. CASOS DE EJEMPLO. En el analizador la evidencia sale del enlace que la
//    persona acaba de pegar. Acá no hay tal enlace, así que el `ejemplo` de cada
//    cápsula se pasa por el MISMO motor determinista: la evidencia que se
//    muestra es la que produce el motor, no un texto escrito a mano. Solo se
//    rellenan a mano los campos que el motor offline no puede conocer (edad del
//    dominio, cadena TLS, DNS, reportes de la comunidad).
// =============================================================================

import { analyzeLocally, type AnalysisResult } from "@/lib/analysis";
import {
  MICROCAPSULAS,
  type Evidencia,
  type IndicadorId,
  type Microcapsula,
} from "@/lib/data/microcapsulas";
import {
  NIVELES,
  aciertosParaAprobar,
  type NivelAcademia,
} from "@/lib/data/academia";
import {
  getEjercicios,
  registrarEjercicio,
  type NivelEjercicio,
} from "@/lib/ejercicios";

/**
 * Id del ejercicio de una cápsula. Lo comparten el analizador y la Academy a
 * propósito: si cambia acá, cambia en los dos lados.
 */
export function idEjercicioCapsula(indicador: IndicadorId): string {
  return `micro-${indicador}`;
}

// -----------------------------------------------------------------------------
// Casos de ejemplo
// -----------------------------------------------------------------------------

/**
 * Resultado de análisis del enlace de ejemplo de una cápsula, equivalente a lo
 * que devolvería el pipeline completo para ese enlace.
 */
export function construirResultadoEjemplo(capsula: Microcapsula): AnalysisResult {
  const { url, servidor } = capsula.ejemplo;
  const base = analyzeLocally(
    url,
    servidor?.reportCount
      ? { matchType: "exacto", reportCount: servidor.reportCount }
      : null
  );
  return {
    ...base,
    expandedUrl: servidor?.expandedUrl ?? base.expandedUrl ?? null,
    anatomy: {
      ...base.anatomy,
      // `??` y no `||`: false y 0 son respuestas válidas del servidor.
      domainAgeDays: servidor?.domainAgeDays ?? base.anatomy.domainAgeDays,
      certChainValid: servidor?.certChainValid ?? base.anatomy.certChainValid,
      domainResolves: servidor?.domainResolves ?? base.anatomy.domainResolves,
      lookalikeOf: servidor?.lookalikeOf ?? base.anatomy.lookalikeOf,
    },
  };
}

/**
 * Evidencia a mostrar en la Academy. Lo que la persona "vio en pantalla" va
 * primero, porque monta la escena; después viene lo que el motor descubrió.
 */
export function evidenciaEjemplo(capsula: Microcapsula): Evidencia[] {
  const r = construirResultadoEjemplo(capsula);
  return [...(capsula.ejemplo.evidenciaExtra ?? []), ...capsula.evidencia(r)];
}

// -----------------------------------------------------------------------------
// Pruebas de cierre
// -----------------------------------------------------------------------------

const KEY = "fishintt_academia";

export interface RegistroPrueba {
  nivel: NivelEjercicio;
  /** Mejor resultado obtenido, no el último: reintentar no debe cerrar lo abierto. */
  aciertos: number;
  total: number;
  aprobada: boolean;
  intentos: number;
  fecha: string;
}

interface Almacen {
  pruebas: Record<string, RegistroPrueba>;
}

const VACIO: Almacen = { pruebas: {} };

function getAlmacen(): Almacen {
  if (typeof window === "undefined") return { pruebas: {} };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { pruebas: {} };
    const obj = JSON.parse(raw);
    return { ...VACIO, ...obj, pruebas: obj?.pruebas ?? {} };
  } catch {
    return { pruebas: {} };
  }
}

function guardar(a: Almacen) {
  try {
    localStorage.setItem(KEY, JSON.stringify(a));
  } catch {
    /* almacenamiento no disponible */
  }
}

export function getPrueba(nivel: NivelEjercicio): RegistroPrueba | null {
  return getAlmacen().pruebas[nivel] ?? null;
}

export interface RespuestaPrueba {
  id: string;
  correcto: boolean;
}

/**
 * Cierra un intento de prueba. Hace dos cosas distintas a propósito:
 *   - registra cada ítem en el almacén de ejercicios (CRD), donde los
 *     reintentos se ignoran porque solo vale el primer intento;
 *   - guarda el MEJOR resultado del nivel, que es lo que gobierna el desbloqueo.
 */
export function registrarPrueba(
  nivel: NivelEjercicio,
  respuestas: RespuestaPrueba[]
): RegistroPrueba {
  for (const r of respuestas) registrarEjercicio(r.id, nivel, r.correcto);

  const aciertos = respuestas.filter((r) => r.correcto).length;
  const total = respuestas.length;
  const almacen = getAlmacen();
  const previo = almacen.pruebas[nivel];
  const mejorAciertos = Math.max(aciertos, previo?.aciertos ?? 0);

  const registro: RegistroPrueba = {
    nivel,
    aciertos: mejorAciertos,
    total,
    aprobada: mejorAciertos >= aciertosParaAprobar(total),
    intentos: (previo?.intentos ?? 0) + 1,
    fecha: new Date().toISOString(),
  };
  almacen.pruebas[nivel] = registro;
  guardar(almacen);
  return registro;
}

// -----------------------------------------------------------------------------
// Progreso
// -----------------------------------------------------------------------------

export interface EstadoCapsula {
  indicador: IndicadorId;
  capsula: Microcapsula;
  respondida: boolean;
  /** null si todavía no se ha respondido. */
  correcta: boolean | null;
}

export interface EstadoNivel {
  nivel: NivelAcademia;
  capsulas: EstadoCapsula[];
  respondidas: number;
  total: number;
  desbloqueado: boolean;
  completado: boolean;
  /** Todas las cápsulas respondidas: ya se puede rendir la prueba de cierre. */
  pruebaDisponible: boolean;
  prueba: RegistroPrueba | null;
  /** Qué falta para abrirlo, cuando está bloqueado. */
  requisito: string | null;
}

export interface ProgresoAcademia {
  niveles: EstadoNivel[];
  capsulasRespondidas: number;
  totalCapsulas: number;
  nivelesCompletados: number;
  /** Nivel por el que conviene seguir; null si ya está todo completo. */
  siguiente: NivelAcademia | null;
}

export function getProgreso(): ProgresoAcademia {
  const registros = getEjercicios();
  const almacen = getAlmacen();
  const porId = new Map(registros.map((r) => [r.id, r]));

  const niveles: EstadoNivel[] = [];
  let anteriorCompleto = true; // el primer nivel siempre está abierto

  for (const nivel of NIVELES) {
    const capsulas: EstadoCapsula[] = nivel.capsulas.map((indicador) => {
      const reg = porId.get(idEjercicioCapsula(indicador));
      return {
        indicador,
        capsula: MICROCAPSULAS[indicador],
        respondida: !!reg,
        correcta: reg ? reg.correcto : null,
      };
    });

    const respondidas = capsulas.filter((c) => c.respondida).length;
    const prueba = almacen.pruebas[nivel.id] ?? null;
    const pruebaDisponible = respondidas === capsulas.length;
    const completado = pruebaDisponible && !!prueba?.aprobada;
    const desbloqueado = anteriorCompleto;

    niveles.push({
      nivel,
      capsulas,
      respondidas,
      total: capsulas.length,
      desbloqueado,
      completado,
      pruebaDisponible,
      prueba,
      requisito: desbloqueado
        ? null
        : `Completa el Nivel ${nivel.numero - 1} para abrir este`,
    });
    anteriorCompleto = completado;
  }

  const capsulasRespondidas = niveles.reduce((n, e) => n + e.respondidas, 0);
  const totalCapsulas = niveles.reduce((n, e) => n + e.total, 0);
  const siguiente =
    niveles.find((e) => e.desbloqueado && !e.completado)?.nivel ?? null;

  return {
    niveles,
    capsulasRespondidas,
    totalCapsulas,
    nivelesCompletados: niveles.filter((e) => e.completado).length,
    siguiente,
  };
}

export function getEstadoNivel(id: string | undefined): EstadoNivel | null {
  return getProgreso().niveles.find((e) => e.nivel.id === id) ?? null;
}

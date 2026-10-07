// =============================================================================
// Fishin't — Validación sobre el conjunto held-out
// =============================================================================
// Compara el desempeño del motor en el conjunto con el que se AFINÓ frente al
// conjunto de validación que no guió el diseño. La diferencia entre ambos es la
// estimación del sesgo de afinamiento.
//
// Ejecutar:  npm run validar
// =============================================================================

import { analyzeLocally } from "../src/lib/analysis.ts";
import { DATASET, type BenchmarkEntry } from "./dataset.ts";
import { HOLDOUT, type Dificultad, type HoldoutEntry } from "./holdout.ts";

interface Metricas {
  tp: number; fn: number; fp: number; tn: number;
  recall: number; fpr: number; precision: number;
}

function detectado(url: string): boolean {
  return analyzeLocally(url).riskLevel !== "safe";
}

function medir(entries: BenchmarkEntry[]): Metricas {
  let tp = 0, fn = 0, fp = 0, tn = 0;
  for (const e of entries) {
    const d = detectado(e.url);
    if (e.label === "phishing") d ? tp++ : fn++;
    else d ? fp++ : tn++;
  }
  const pct = (a: number, b: number) => (b === 0 ? 0 : (a / b) * 100);
  return { tp, fn, fp, tn, recall: pct(tp, tp + fn), fpr: pct(fp, fp + tn), precision: pct(tp, tp + fp) };
}

const f = (n: number) => n.toFixed(1).padStart(5) + " %";
const linea = (c = "─", n = 74) => c.repeat(n);
const veredicto = (ok: boolean) => (ok ? "CUMPLE" : "NO CUMPLE");

const afinado = medir(DATASET);
const validacion = medir(HOLDOUT);

console.log("\n" + linea("═"));
console.log("  Fishin't — Validación del motor sobre conjunto held-out");
console.log(linea("═"));

console.log("\n" + linea());
console.log("  COMPARACIÓN");
console.log(linea());
console.log("                        Afinamiento      Validación        Brecha");
const brechaR = validacion.recall - afinado.recall;
const brechaF = validacion.fpr - afinado.fpr;
console.log(`  Exhaustividad        ${f(afinado.recall)}       ${f(validacion.recall)}      ${brechaR >= 0 ? "+" : ""}${brechaR.toFixed(1)} pts`);
console.log(`  Falsos positivos     ${f(afinado.fpr)}       ${f(validacion.fpr)}      ${brechaF >= 0 ? "+" : ""}${brechaF.toFixed(1)} pts`);
console.log(`  Precisión            ${f(afinado.precision)}       ${f(validacion.precision)}`);
console.log(`  (enlaces)                     ${String(DATASET.length).padStart(3)}             ${String(HOLDOUT.length).padStart(3)}`);

console.log("\n" + linea());
console.log("  CRITERIOS DE ÉXITO (§3.2.4) — se evalúan sobre la VALIDACIÓN");
console.log(linea());
console.log(`  Exhaustividad ≥ 85 %     ${f(validacion.recall)}   ${veredicto(validacion.recall >= 85)}`);
console.log(`  Falsos positivos ≤ 10 %  ${f(validacion.fpr)}   ${veredicto(validacion.fpr <= 10)}`);

console.log("\n" + linea());
console.log("  DESGLOSE POR DIFICULTAD (solo phishing del conjunto de validación)");
console.log(linea());
const niveles: Dificultad[] = ["directa", "media", "evasiva"];
for (const niv of niveles) {
  const sub = HOLDOUT.filter((e) => e.label === "phishing" && e.dificultad === niv);
  const m = medir(sub);
  console.log(`  ${niv.padEnd(10)} ${String(m.tp).padStart(2)}/${String(sub.length).padEnd(2)} detectados   recall ${f(m.recall)}`);
}

const perdidos = HOLDOUT.filter((e) => e.label === "phishing" && !detectado(e.url)) as HoldoutEntry[];
const falsasAlarmas = HOLDOUT.filter((e) => e.label === "legitimo" && detectado(e.url));

if (perdidos.length) {
  console.log("\n" + linea());
  console.log(`  NO DETECTADOS (${perdidos.length})`);
  console.log(linea());
  for (const e of perdidos) console.log(`  [${e.dificultad}] ${e.url}\n        ↳ ${e.nota}`);
}
if (falsasAlarmas.length) {
  console.log("\n" + linea());
  console.log(`  FALSAS ALARMAS (${falsasAlarmas.length})`);
  console.log(linea());
  for (const e of falsasAlarmas) console.log(`  ${e.url}\n        ↳ ${e.nota}`);
}

console.log("\n" + linea("═") + "\n");

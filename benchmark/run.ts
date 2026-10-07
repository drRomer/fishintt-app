// =============================================================================
// Fishin't — Harness de evaluación del motor de detección
// =============================================================================
// Mide el motor determinista (src/lib/analysis.ts) contra el banco etiquetado y
// reporta las métricas que exige la tesis (§3.2.4):
//   - Exhaustividad (recall) ≥ 85 %   sobre enlaces maliciosos
//   - Tasa de falsos positivos ≤ 10 % sobre enlaces legítimos
//
// Regla de decisión: se considera "detectado" todo veredicto distinto de "safe"
// (es decir, sospechoso o peligroso), porque ambos muestran advertencia al usuario.
//
// IMPORTANTE: mide SOLO la heurística local. No consulta Safe Browsing, VirusTotal
// ni la base comunitaria — esos suman detección pero requieren red y API keys.
// Esta es a propósito la línea base "peor caso" del motor propio.
//
// Ejecutar:  npm run benchmark
// =============================================================================

import { analyzeLocally, type RiskLevel } from "../src/lib/analysis.ts";
import { DATASET, type BenchmarkEntry } from "./dataset.ts";

interface Resultado {
  entry: BenchmarkEntry;
  riskLevel: RiskLevel;
  rawScore: number;
  detectado: boolean; // true si riskLevel !== "safe"
}

function evaluar(entries: BenchmarkEntry[]): Resultado[] {
  return entries.map((entry) => {
    const r = analyzeLocally(entry.url);
    return {
      entry,
      riskLevel: r.riskLevel,
      rawScore: r.rawScore,
      detectado: r.riskLevel !== "safe",
    };
  });
}

interface Metricas {
  tp: number; fn: number; fp: number; tn: number;
  recall: number; fpr: number; precision: number; exactitud: number;
}

function metricas(res: Resultado[]): Metricas {
  const tp = res.filter((r) => r.entry.label === "phishing" && r.detectado).length;
  const fn = res.filter((r) => r.entry.label === "phishing" && !r.detectado).length;
  const fp = res.filter((r) => r.entry.label === "legitimo" && r.detectado).length;
  const tn = res.filter((r) => r.entry.label === "legitimo" && !r.detectado).length;
  const pct = (a: number, b: number) => (b === 0 ? 0 : (a / b) * 100);
  return {
    tp, fn, fp, tn,
    recall: pct(tp, tp + fn),
    fpr: pct(fp, fp + tn),
    precision: pct(tp, tp + fp),
    exactitud: pct(tp + tn, res.length),
  };
}

function f(n: number): string {
  return n.toFixed(1).padStart(5) + " %";
}

function linea(char = "─", n = 72): string {
  return char.repeat(n);
}

// -----------------------------------------------------------------------------
const resultados = evaluar(DATASET);
const global = metricas(resultados);
const soloCl = metricas(resultados.filter((r) => r.entry.origen === "cl"));
const soloIntl = metricas(resultados.filter((r) => r.entry.origen === "intl"));

const OK = "CUMPLE";
const NO = "NO CUMPLE";

console.log("\n" + linea("═"));
console.log("  Fishin't — Evaluación del motor de detección (heurística local)");
console.log(linea("═"));
console.log(`  Enlaces evaluados: ${DATASET.length}` +
  `  (phishing: ${DATASET.filter((d) => d.label === "phishing").length},` +
  ` legítimos: ${DATASET.filter((d) => d.label === "legitimo").length})`);
console.log(`  Foco Chile: ${DATASET.filter((d) => d.origen === "cl").length}` +
  `   Internacional: ${DATASET.filter((d) => d.origen === "intl").length}`);

console.log("\n" + linea());
console.log("  MATRIZ DE CONFUSIÓN (global)");
console.log(linea());
console.log(`  Verdaderos positivos (phishing detectado) : ${global.tp}`);
console.log(`  Falsos negativos     (phishing NO visto)  : ${global.fn}  <- los peligrosos`);
console.log(`  Falsos positivos     (legítimo marcado)   : ${global.fp}  <- erosionan confianza`);
console.log(`  Verdaderos negativos (legítimo limpio)    : ${global.tn}`);

console.log("\n" + linea());
console.log("  MÉTRICAS vs. CRITERIOS DE ÉXITO (tesis §3.2.4)");
console.log(linea());
console.log(`  Exhaustividad (recall)   ${f(global.recall)}   meta ≥ 85 %   ${global.recall >= 85 ? OK : NO}`);
console.log(`  Falsos positivos (FPR)   ${f(global.fpr)}   meta ≤ 10 %   ${global.fpr <= 10 ? OK : NO}`);
console.log(`  Precisión                ${f(global.precision)}`);
console.log(`  Exactitud                ${f(global.exactitud)}`);

console.log("\n" + linea());
console.log("  DESGLOSE POR ORIGEN (el foco real de uso es Chile)");
console.log(linea());
console.log(`  CHILE          recall ${f(soloCl.recall)}   FPR ${f(soloCl.fpr)}`);
console.log(`  INTERNACIONAL  recall ${f(soloIntl.recall)}   FPR ${f(soloIntl.fpr)}`);

const falsosNegativos = resultados.filter((r) => r.entry.label === "phishing" && !r.detectado);
const falsosPositivos = resultados.filter((r) => r.entry.label === "legitimo" && r.detectado);

if (falsosNegativos.length > 0) {
  console.log("\n" + linea());
  console.log(`  FALSOS NEGATIVOS — phishing que se escapó (${falsosNegativos.length})`);
  console.log(linea());
  for (const r of falsosNegativos) {
    console.log(`  [${String(r.rawScore).padStart(3)}] ${r.entry.url}`);
    console.log(`        ↳ ${r.entry.nota}`);
  }
}

if (falsosPositivos.length > 0) {
  console.log("\n" + linea());
  console.log(`  FALSOS POSITIVOS — legítimos marcados (${falsosPositivos.length})`);
  console.log(linea());
  for (const r of falsosPositivos) {
    console.log(`  [${String(r.rawScore).padStart(3)}] ${r.entry.url}  (${r.riskLevel})`);
    console.log(`        ↳ ${r.entry.nota}`);
  }
}

console.log("\n" + linea("═") + "\n");

"use client";

// =============================================================================
// Fishin't — Microcápsula formativa tras una alerta
// =============================================================================
// Se muestra bajo el resultado del analizador cuando el veredicto NO es seguro
// (paso 6 del flujo principal, §5.1). Desarrolla el indicador que se detectó en
// ESE enlace y cierra con un ejercicio que alimenta el componente C del CRD.
// =============================================================================

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, ArrowRight, Check, X, Lightbulb } from "lucide-react";
import type { AnalysisResult } from "@/lib/analysis";
import { seleccionarMicrocapsula } from "@/lib/data/microcapsulas";
import { registrarEjercicio, yaRespondido } from "@/lib/ejercicios";

export function Microcapsula({ result }: { result: AnalysisResult }) {
  const capsula = seleccionarMicrocapsula(result);
  const [elegida, setElegida] = useState<number | null>(null);

  if (!capsula) return null;

  const evidencia = capsula.evidencia(result);
  const respondida = elegida !== null;
  const acerto = elegida === capsula.pregunta.correcta;
  const ejercicioId = `micro-${capsula.id}`;

  function responder(i: number) {
    if (respondida || !capsula) return;
    setElegida(i);
    // Solo el primer intento cuenta para el CRD.
    if (!yaRespondido(ejercicioId)) {
      registrarEjercicio(ejercicioId, capsula.pregunta.nivel, i === capsula.pregunta.correcta);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden mt-4">
      {/* Encabezado */}
      <div className="bg-navy-700 text-white px-5 py-3 flex items-center gap-2">
        <GraduationCap className="w-4 h-4 flex-shrink-0" />
        <span className="text-xs font-semibold uppercase tracking-wide">
          Aprende de este caso
        </span>
      </div>

      <div className="p-5 space-y-4">
        <h3 className="font-bold text-navy-700 text-[17px] leading-tight">{capsula.titulo}</h3>

        {/* Evidencia del propio enlace */}
        {evidencia.length > 0 && (
          <div className="bg-surface-alt rounded-xl p-3 space-y-2">
            {evidencia.map((e, i) => (
              <div key={i}>
                <div className="text-[10px] uppercase tracking-wide text-navy-400 font-medium">
                  {e.etiqueta}
                </div>
                <div
                  className={`text-sm font-mono break-all ${
                    e.peligroso === true
                      ? "text-brand-600 font-semibold"
                      : e.peligroso === false
                      ? "text-safe-500 font-semibold"
                      : "text-navy-700"
                  }`}
                >
                  {e.valor}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-sm text-navy-600 leading-relaxed">{capsula.explicacion}</p>

        {/* Qué hacer */}
        <div className="flex items-start gap-2.5 bg-safe-50 rounded-xl p-3">
          <Lightbulb className="w-4 h-4 text-safe-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-[10px] uppercase tracking-wide text-safe-900 font-semibold">
              Qué hacer
            </div>
            <p className="text-sm text-navy-700 leading-relaxed mt-0.5">{capsula.queHacer}</p>
          </div>
        </div>

        {/* Ejercicio */}
        <div className="border-t border-navy-50 pt-4">
          <p className="text-sm font-semibold text-navy-700 mb-3">{capsula.pregunta.enunciado}</p>
          <div className="space-y-2">
            {capsula.pregunta.opciones.map((op, i) => {
              const esCorrecta = i === capsula.pregunta.correcta;
              const esElegida = i === elegida;
              let estilo = "border-navy-100 bg-white text-navy-700 hover:bg-surface-alt";
              if (respondida && esCorrecta) estilo = "border-safe-500 bg-safe-50 text-safe-900";
              else if (respondida && esElegida) estilo = "border-brand-500 bg-brand-50 text-brand-700";
              else if (respondida) estilo = "border-navy-100 bg-white text-navy-300";
              return (
                <button
                  key={i}
                  onClick={() => responder(i)}
                  disabled={respondida}
                  className={`w-full text-left text-sm font-medium px-4 py-3 rounded-xl border-2 transition-colors flex items-center justify-between gap-2 ${estilo}`}
                >
                  <span className="font-mono break-all">{op}</span>
                  {respondida && esCorrecta && <Check className="w-4 h-4 flex-shrink-0" />}
                  {respondida && esElegida && !esCorrecta && <X className="w-4 h-4 flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          {respondida && (
            <div className="mt-3 fade-in">
              <div
                className={`text-sm font-semibold mb-1 ${
                  acerto ? "text-safe-500" : "text-brand-600"
                }`}
              >
                {acerto ? "Correcto" : "No es esa"}
              </div>
              <p className="text-sm text-navy-600 leading-relaxed">
                {capsula.pregunta.explicacion}
              </p>
              <Link
                href="/educacion"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 hover:underline mt-3"
              >
                Seguir aprendiendo <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

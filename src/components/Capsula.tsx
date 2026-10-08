"use client";

// =============================================================================
// Fishin't — Cápsula formativa (presentación compartida)
// =============================================================================
// Una sola pieza visual para los dos puntos de entrada de una microcápsula:
//   - el analizador, con el enlace que la persona acaba de pegar;
//   - la Cyber-Academy, con el caso de ejemplo de la cápsula.
// El contenido formativo es el mismo en ambos, así que no debe existir dos
// veces. Lo que cambia es el encabezado, el pie y si la pregunta ya está
// respondida de antes.
// =============================================================================

import { useState, type ReactNode } from "react";
import { GraduationCap, Check, X, Lightbulb, RotateCcw } from "lucide-react";
import type { Evidencia, Microcapsula } from "@/lib/data/microcapsulas";

export interface EstadoPrevio {
  /** Si acertó en su primer intento. Lo que se eligió entonces no se guarda. */
  correcto: boolean;
}

export interface CapsulaFormativaProps {
  capsula: Microcapsula;
  evidencia: Evidencia[];
  /** Texto del encabezado ("Aprende de este caso", "Lección 2 de 5"...). */
  etiqueta: string;
  /** Una línea sobre cómo le llegó el enlace a la persona (la usa la Academy). */
  contexto?: string;
  /**
   * Resultado del primer intento, si ya existe. Cuando viene, la pregunta se
   * muestra revelada en vez de volver a preguntar: reintentarla no cambiaría el
   * CRD y hacer creer lo contrario sería engañoso.
   */
  estadoPrevio?: EstadoPrevio | null;
  /** Contenido al pie de la tarjeta (enlaces, botón de avance). */
  pie?: ReactNode;
  onResponder?: (correcto: boolean) => void;
}

export function CapsulaFormativa({
  capsula,
  evidencia,
  etiqueta,
  contexto,
  estadoPrevio,
  pie,
  onResponder,
}: CapsulaFormativaProps) {
  const [elegida, setElegida] = useState<number | null>(null);

  const { pregunta } = capsula;
  const respondidaAhora = elegida !== null;
  const revelada = respondidaAhora || !!estadoPrevio;
  const acerto = respondidaAhora ? elegida === pregunta.correcta : !!estadoPrevio?.correcto;

  function responder(i: number) {
    if (revelada) return;
    setElegida(i);
    onResponder?.(i === pregunta.correcta);
  }

  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden">
      <div className="bg-navy-700 text-white px-5 py-3 flex items-center gap-2">
        <GraduationCap className="w-4 h-4 flex-shrink-0" />
        <span className="text-xs font-semibold uppercase tracking-wide">{etiqueta}</span>
      </div>

      <div className="p-5 space-y-4">
        <h3 className="font-bold text-navy-700 text-[17px] leading-tight">{capsula.titulo}</h3>

        {contexto && (
          <div className="border-l-2 border-navy-200 pl-3">
            <div className="text-[10px] uppercase tracking-wide text-navy-400 font-medium">
              El caso
            </div>
            <p className="text-sm text-navy-600 leading-relaxed mt-0.5">{contexto}</p>
          </div>
        )}

        {/* Evidencia: lo que tiene el enlace, no una afirmación nuestra */}
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
                      ? "text-brand-700 font-semibold"
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

        <div className="flex items-start gap-2.5 bg-safe-50 rounded-xl p-3">
          <Lightbulb className="w-4 h-4 text-safe-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-[10px] uppercase tracking-wide text-safe-900 font-semibold">
              Qué hacer
            </div>
            <p className="text-sm text-navy-700 leading-relaxed mt-0.5">{capsula.queHacer}</p>
          </div>
        </div>

        {/* Ejercicio: alimenta el componente C del CRD */}
        <div className="border-t border-navy-50 pt-4">
          {estadoPrevio && !respondidaAhora && (
            <div className="flex items-center gap-1.5 text-[11px] text-navy-400 mb-2">
              <RotateCcw className="w-3 h-3 flex-shrink-0" />
              Ya respondiste esta pregunta antes
              {estadoPrevio.correcto ? " y acertaste." : ", y no acertaste."}
            </div>
          )}
          <p className="text-sm font-semibold text-navy-700 mb-3">{pregunta.enunciado}</p>
          <div className="space-y-2">
            {pregunta.opciones.map((op, i) => {
              const esCorrecta = i === pregunta.correcta;
              const esElegida = i === elegida;
              let estilo = "border-navy-100 bg-white text-navy-700 hover:bg-surface-alt";
              if (revelada && esCorrecta) estilo = "border-safe-500 bg-safe-50 text-safe-900";
              else if (revelada && esElegida) estilo = "border-brand-500 bg-brand-50 text-brand-700";
              else if (revelada) estilo = "border-navy-100 bg-white text-navy-300";
              return (
                <button
                  key={i}
                  onClick={() => responder(i)}
                  disabled={revelada}
                  className={`w-full text-left text-sm font-medium px-4 py-3 rounded-xl border-2 transition-colors flex items-center justify-between gap-2 ${estilo}`}
                >
                  <span className="font-mono break-all">{op}</span>
                  {revelada && esCorrecta && <Check className="w-4 h-4 flex-shrink-0" />}
                  {revelada && esElegida && !esCorrecta && <X className="w-4 h-4 flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          {revelada && (
            <div className="mt-3 fade-in">
              {respondidaAhora && (
                <div
                  className={`text-sm font-semibold mb-1 ${
                    acerto ? "text-safe-500" : "text-brand-700"
                  }`}
                >
                  {acerto ? "Correcto" : "No es esa"}
                </div>
              )}
              <p className="text-sm text-navy-600 leading-relaxed">{pregunta.explicacion}</p>
            </div>
          )}
        </div>

        {pie}
      </div>
    </div>
  );
}

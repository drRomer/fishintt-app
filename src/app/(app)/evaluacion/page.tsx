"use client";

// =============================================================================
// Fishin't — Instrumento de medición del CRD (§3.2.3)
// =============================================================================
// Aplica los 12 ítems (4 básicos, 4 intermedios, 4 avanzados) y calcula el CRD.
// No se entrega retroalimentación ítem por ítem: en una medición diagnóstica,
// explicar durante la aplicación convierte el instrumento en entrenamiento y
// contamina el resultado. Las explicaciones se muestran todas al final.
// =============================================================================

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, ClipboardCheck, ShieldAlert, ShieldCheck, Check, X,
  TrendingUp, Mail, MessageSquare, Smartphone, LinkIcon,
} from "lucide-react";
import { getActivity, getReportsCount } from "@/lib/activity";
import {
  getItems, guardarResultado, siguienteInstrumento, compararAplicaciones,
  nivelCrd, type RespuestaItem, type ResultadoInstrumento, type Comparacion,
} from "@/lib/evaluacion";
import type { TipoInstrumento, ItemEvaluacion } from "@/lib/data/evaluacion";

const ICONO_CANAL = {
  SMS: Smartphone,
  Correo: Mail,
  WhatsApp: MessageSquare,
  Enlace: LinkIcon,
} as const;

export default function EvaluacionPage() {
  const [tipo, setTipo] = useState<TipoInstrumento | null>(null);
  const [completadas, setCompletadas] = useState(false);
  const [fase, setFase] = useState<"intro" | "test" | "resultado">("intro");
  const [indice, setIndice] = useState(0);
  const [respuestas, setRespuestas] = useState<RespuestaItem[]>([]);
  const [resultado, setResultado] = useState<ResultadoInstrumento | null>(null);
  const [comparacion, setComparacion] = useState<Comparacion | null>(null);

  useEffect(() => {
    const siguiente = siguienteInstrumento();
    setTipo(siguiente ?? "post");
    setCompletadas(siguiente === null);
    setComparacion(compararAplicaciones());
  }, []);

  const items: ItemEvaluacion[] = tipo ? getItems(tipo) : [];
  const item = items[indice];

  function responder(esFraudeElegido: boolean) {
    if (!item || !tipo) return;
    const nuevas = [
      ...respuestas,
      { id: item.id, nivel: item.nivel, correcto: esFraudeElegido === item.esFraude },
    ];
    setRespuestas(nuevas);
    if (indice + 1 < items.length) {
      setIndice(indice + 1);
      return;
    }
    const r = guardarResultado(tipo, nuevas, getActivity(), getReportsCount());
    setResultado(r);
    setComparacion(compararAplicaciones());
    setFase("resultado");
  }

  function reiniciar() {
    setIndice(0);
    setRespuestas([]);
    setResultado(null);
    setFase("intro");
    const siguiente = siguienteInstrumento();
    setTipo(siguiente ?? "post");
    setCompletadas(siguiente === null);
  }

  return (
    <div className="fade-in pb-4">
      <div className="bg-navy-700 text-white pt-6 pb-8 px-5 rounded-b-3xl">
        <Link href="/educacion" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-3">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Evalúa tu resiliencia</h1>
        </div>
        <p className="text-sm text-white/70 mt-1">
          12 mensajes reales. Decide cuáles son fraude y cuáles no.
        </p>
      </div>

      <div className="px-5 py-5">
        {/* ---------------------------------------------------------------- */}
        {fase === "intro" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-card p-5">
              <h2 className="font-bold text-navy-700 mb-2">
                {tipo === "pre" ? "Diagnóstico inicial" : "Evaluación final"}
              </h2>
              <p className="text-sm text-navy-600 leading-relaxed">
                {tipo === "pre"
                  ? "Antes de empezar a aprender, veamos cómo estás hoy. Te mostraremos 12 mensajes: algunos son estafas reales que circulan en Chile y otros son comunicaciones legítimas de las mismas instituciones."
                  : "Ahora que recorriste el material, midamos tu avance con 12 mensajes distintos del mismo nivel de dificultad."}
              </p>
              <ul className="text-sm text-navy-500 mt-3 space-y-1.5">
                <li>• No hay tiempo límite.</li>
                <li>• No se muestran respuestas hasta el final, para no influir en tu criterio.</li>
                <li>• Ojo: no todos son fraude.</li>
              </ul>
            </div>

            {completadas && comparacion && (
              <div className="bg-warn-50 border border-warn-200 rounded-2xl p-4 text-sm text-navy-700">
                Ya completaste ambas aplicaciones. Si vuelves a rendirla, se
                reemplazará tu resultado final.
              </div>
            )}

            <button
              onClick={() => setFase("test")}
              className="w-full bg-navy-700 hover:bg-navy-800 text-white font-semibold py-4 rounded-2xl transition-colors"
            >
              Comenzar
            </button>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {fase === "test" && item && (
          <div className="space-y-4">
            {/* Progreso */}
            <div>
              <div className="flex justify-between text-xs text-navy-500 mb-1.5">
                <span>Mensaje {indice + 1} de {items.length}</span>
                <span className="capitalize">{item.nivel}</span>
              </div>
              <div className="h-2 bg-surface-alt rounded-full overflow-hidden">
                <div
                  className="h-full bg-navy-700 rounded-full transition-all"
                  style={{ width: `${((indice) / items.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Mensaje a clasificar */}
            <MensajeCard item={item} />

            <p className="text-sm text-navy-500 text-center">
              ¿Es un fraude o una comunicación legítima?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => responder(true)}
                className="flex flex-col items-center gap-1.5 bg-white border-2 border-brand-200 text-brand-600 font-semibold py-4 rounded-2xl hover:bg-brand-50 transition-colors"
              >
                <ShieldAlert className="w-6 h-6" />
                Es fraude
              </button>
              <button
                onClick={() => responder(false)}
                className="flex flex-col items-center gap-1.5 bg-white border-2 border-safe-200 text-safe-500 font-semibold py-4 rounded-2xl hover:bg-safe-50 transition-colors"
              >
                <ShieldCheck className="w-6 h-6" />
                Es legítimo
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {fase === "resultado" && resultado && (
          <div className="space-y-4">
            {/* Puntaje */}
            <div className="bg-white rounded-2xl shadow-card p-5 text-center">
              <div className="text-xs uppercase tracking-wide text-navy-400 font-medium">
                Tu Coeficiente de Resiliencia Digital
              </div>
              <div className="text-5xl font-bold text-navy-700 mt-2">{resultado.crd}</div>
              <div className="text-sm text-navy-400">de 1000</div>
              <div className="mt-2 inline-block text-sm font-semibold bg-navy-100 text-navy-700 px-3 py-1 rounded-full">
                {nivelCrd(resultado.crd)}
              </div>
              <p className="text-sm text-navy-500 mt-3">
                {resultado.aciertos} de {resultado.total} correctas
                {resultado.tipo === "pre" && " · diagnóstico inicial"}
              </p>
            </div>

            {/* Comparación pre/post */}
            {comparacion && resultado.tipo === "post" && (
              <div className="bg-white rounded-2xl shadow-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-safe-500" />
                  <h3 className="font-bold text-navy-700">Tu avance</h3>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-2xl font-bold text-navy-400">{comparacion.pre.crd}</div>
                    <div className="text-[10px] uppercase tracking-wide text-navy-400 mt-0.5">Inicial</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-navy-700">{comparacion.post.crd}</div>
                    <div className="text-[10px] uppercase tracking-wide text-navy-400 mt-0.5">Final</div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${comparacion.deltaCrd >= 0 ? "text-safe-500" : "text-brand-500"}`}>
                      {comparacion.deltaCrd >= 0 ? "+" : ""}{comparacion.deltaCrd}
                    </div>
                    <div className="text-[10px] uppercase tracking-wide text-navy-400 mt-0.5">Variación</div>
                  </div>
                </div>
                <p className="text-xs text-navy-500 mt-3 border-t border-navy-50 pt-3">
                  Conocimiento: {comparacion.pre.c.toFixed(0)} → {comparacion.post.c.toFixed(0)}{" "}
                  ({comparacion.deltaC >= 0 ? "+" : ""}{comparacion.deltaC.toFixed(0)} puntos).
                  Esta es la parte que depende solo de lo que aprendiste.
                </p>
              </div>
            )}

            {/* Revisión */}
            <div>
              <h3 className="font-bold text-navy-700 mb-3 px-1">Revisa tus respuestas</h3>
              <div className="space-y-2">
                {items.map((it, i) => {
                  const r = respuestas[i];
                  return (
                    <div key={it.id} className="bg-white rounded-2xl shadow-card p-4">
                      <div className="flex items-start gap-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                            r?.correcto ? "bg-safe-500" : "bg-brand-500"
                          } text-white`}
                        >
                          {r?.correcto ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-navy-400">
                            {it.canal} · {it.remitente}
                          </div>
                          <p className="text-sm text-navy-700 mt-1 break-words">{it.mensaje}</p>
                          <div
                            className={`text-xs font-semibold mt-2 ${
                              it.esFraude ? "text-brand-600" : "text-safe-500"
                            }`}
                          >
                            {it.esFraude ? "Era fraude" : "Era legítimo"}
                          </div>
                          <p className="text-sm text-navy-600 mt-1 leading-relaxed">{it.explicacion}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <Link
                href="/educacion"
                className="block w-full bg-navy-700 hover:bg-navy-800 text-white font-semibold py-3.5 rounded-2xl text-center transition-colors"
              >
                Ir a aprender
              </Link>
              <button
                onClick={reiniciar}
                className="w-full bg-white text-navy-700 font-semibold py-3 rounded-2xl shadow-card hover:bg-surface-alt transition-colors"
              >
                Volver al inicio de la evaluación
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MensajeCard({ item }: { item: ItemEvaluacion }) {
  const Icono = ICONO_CANAL[item.canal];
  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-alt border-b border-navy-50">
        <Icono className="w-4 h-4 text-navy-500" />
        <span className="text-xs font-semibold text-navy-600">{item.canal}</span>
        <span className="text-xs text-navy-400 truncate">· {item.remitente}</span>
      </div>
      <div className="p-4">
        <p className="text-[15px] text-navy-700 leading-relaxed break-words whitespace-pre-wrap">
          {item.mensaje}
        </p>
      </div>
    </div>
  );
}

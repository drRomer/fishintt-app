"use client";

// =============================================================================
// Fishin't — Cyber-Academy: recorrido de un nivel
// =============================================================================
// Cuatro fases en una sola pantalla, porque el público objetivo opera en móvil
// y cada salto de página es una oportunidad de abandono:
//   índice → lección → prueba de cierre → resultado.
//
// La prueba NO da retroalimentación ítem por ítem, por la misma razón que el
// instrumento de medición (§3.2.3): explicar durante la aplicación la convierte
// en entrenamiento y deja de decir si la persona aprendió. Las explicaciones van
// todas al final.
// =============================================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Check, X, Lock, ClipboardCheck,
  GraduationCap, RotateCcw, ChevronRight,
} from "lucide-react";
import { getNivel, aciertosParaAprobar, type ItemPrueba } from "@/lib/data/academia";
import {
  evidenciaEjemplo, getEstadoNivel, idEjercicioCapsula, registrarPrueba,
  type EstadoNivel, type RegistroPrueba,
} from "@/lib/academia";
import { markEducationViewed } from "@/lib/activity";
import { registrarEjercicio, yaRespondido } from "@/lib/ejercicios";
import type { Microcapsula } from "@/lib/data/microcapsulas";
import { CapsulaFormativa } from "@/components/Capsula";

type Fase = "indice" | "capsula" | "prueba" | "resultado";

interface RespuestaLocal {
  item: ItemPrueba;
  elegida: number;
}

export default function NivelPage({ params }: { params: { nivel: string } }) {
  const nivel = getNivel(params.nivel);

  const [estado, setEstado] = useState<EstadoNivel | null>(null);
  const [cargado, setCargado] = useState(false);
  const [fase, setFase] = useState<Fase>("indice");
  const [indiceCapsula, setIndiceCapsula] = useState(0);
  const [indicePrueba, setIndicePrueba] = useState(0);
  const [respuestas, setRespuestas] = useState<RespuestaLocal[]>([]);
  const [resultado, setResultado] = useState<RegistroPrueba | null>(null);

  useEffect(() => {
    markEducationViewed();
    setEstado(getEstadoNivel(params.nivel));
    setCargado(true);
  }, [params.nivel]);

  if (!nivel) {
    return (
      <Aviso titulo="Ese nivel no existe">
        Puede que el enlace esté mal escrito. Vuelve al índice de la Academy.
      </Aviso>
    );
  }

  if (cargado && estado && !estado.desbloqueado) {
    return (
      <Aviso titulo={`Nivel ${nivel.numero} todavía cerrado`} icono="lock">
        {estado.requisito}. Los niveles se apoyan en el anterior: leer sobre
        homóglifos antes de saber dónde empieza el dominio no sirve de mucho.
      </Aviso>
    );
  }

  const totalCapsulas = nivel.capsulas.length;
  const estadoCapsula = estado?.capsulas[indiceCapsula] ?? null;
  const itemPrueba = nivel.prueba[indicePrueba];
  const paraAprobar = aciertosParaAprobar(nivel.prueba.length);
  // Resultado de ESTE intento. `resultado.aprobada` guarda el mejor histórico,
  // así que no sirve para contarle a la persona cómo le fue ahora.
  const aciertosAhora = respuestas.filter((r) => r.elegida === r.item.correcta).length;
  const aprobadaAhora = aciertosAhora >= paraAprobar;

  function abrirCapsula(i: number) {
    setIndiceCapsula(i);
    setFase("capsula");
    window.scrollTo({ top: 0 });
  }

  function responderCapsula(capsula: Microcapsula, correcto: boolean) {
    const id = idEjercicioCapsula(capsula.id);
    // El peso lo da la cápsula, no el nivel del recorrido: así el ítem vale lo
    // mismo si se responde acá o en el analizador.
    if (!yaRespondido(id)) {
      registrarEjercicio(id, capsula.pregunta.nivel, correcto);
    }
    setEstado(getEstadoNivel(nivel!.id));
  }

  function comenzarPrueba() {
    setIndicePrueba(0);
    setRespuestas([]);
    setResultado(null);
    setFase("prueba");
    window.scrollTo({ top: 0 });
  }

  function responderPrueba(elegida: number) {
    if (!itemPrueba) return;
    const nuevas = [...respuestas, { item: itemPrueba, elegida }];
    setRespuestas(nuevas);
    if (indicePrueba + 1 < nivel!.prueba.length) {
      setIndicePrueba(indicePrueba + 1);
      window.scrollTo({ top: 0 });
      return;
    }
    const r = registrarPrueba(
      nivel!.id,
      nuevas.map((n) => ({ id: n.item.id, correcto: n.elegida === n.item.correcta }))
    );
    setResultado(r);
    setEstado(getEstadoNivel(nivel!.id));
    setFase("resultado");
    window.scrollTo({ top: 0 });
  }

  function volverAlIndice() {
    setFase("indice");
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="fade-in pb-4">
      {/* Encabezado ------------------------------------------------------ */}
      <div className="bg-navy-700 text-white pt-6 pb-8 px-5 rounded-b-3xl">
        {fase === "indice" ? (
          <Link
            href="/academia"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-3"
          >
            <ArrowLeft className="w-4 h-4" /> Cyber-Academy
          </Link>
        ) : (
          <button
            onClick={volverAlIndice}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-3"
          >
            <ArrowLeft className="w-4 h-4" /> Nivel {nivel.numero}
          </button>
        )}
        <div className="text-[11px] uppercase tracking-wide text-white/60 font-medium">
          Nivel {nivel.numero}
        </div>
        <h1 className="text-2xl font-bold leading-tight">{nivel.nombre}</h1>
        <p className="text-sm text-white/70 mt-1">{nivel.lema}</p>
      </div>

      <div className="px-5 py-5">
        {/* ÍNDICE -------------------------------------------------------- */}
        {fase === "indice" && (
          <div className="space-y-3">
            <p className="text-sm text-navy-600 leading-relaxed">{nivel.descripcion}</p>

            {!cargado && <div className="h-40 bg-white rounded-2xl shadow-card animate-pulse" />}

            {cargado && estado && (
              <>
                <div className="bg-white rounded-2xl shadow-card overflow-hidden">
                  {estado.capsulas.map((c, i) => (
                    <button
                      key={c.indicador}
                      onClick={() => abrirCapsula(i)}
                      className="w-full flex items-center gap-3 p-4 text-left hover:bg-surface-alt transition-colors border-b border-navy-50 last:border-b-0"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                          c.respondida
                            ? c.correcta
                              ? "bg-safe-50 text-safe-500"
                              : "bg-warn-50 text-warn-500"
                            : "bg-navy-50 text-navy-400"
                        }`}
                      >
                        {c.respondida ? <Check className="w-4 h-4" /> : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-navy-700 text-sm leading-tight">
                          {c.capsula.titulo}
                        </div>
                        <div className="text-xs text-navy-400 mt-0.5">
                          {c.respondida
                            ? c.correcta
                              ? "Respondida · acertaste"
                              : "Respondida · conviene repasarla"
                            : "Sin responder"}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-navy-300 flex-shrink-0" />
                    </button>
                  ))}
                </div>

                {/* Prueba de cierre */}
                <div
                  className={`bg-white rounded-2xl shadow-card p-4 ${
                    estado.pruebaDisponible ? "" : "opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        estado.prueba?.aprobada
                          ? "bg-safe-50 text-safe-500"
                          : "bg-navy-50 text-navy-700"
                      }`}
                    >
                      {estado.pruebaDisponible ? (
                        <ClipboardCheck className="w-5 h-5" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-navy-700 text-[15px] leading-tight">
                        Prueba del nivel
                      </div>
                      <div className="text-xs text-navy-400 mt-0.5">
                        {estado.pruebaDisponible
                          ? `${nivel.prueba.length} casos mezclados · ${paraAprobar} aciertos para aprobar`
                          : `Responde las ${estado.total} lecciones para rendirla`}
                      </div>
                    </div>
                  </div>

                  {estado.prueba && (
                    <div className="mt-3 text-xs text-navy-500">
                      Mejor resultado: {estado.prueba.aciertos} de {estado.prueba.total}
                      {estado.prueba.aprobada ? " · aprobada" : " · no aprobada"}
                      {estado.prueba.intentos > 1 && ` · ${estado.prueba.intentos} intentos`}
                    </div>
                  )}

                  {estado.pruebaDisponible && (
                    <button
                      onClick={comenzarPrueba}
                      className="w-full mt-3 bg-navy-700 hover:bg-navy-800 text-white font-semibold py-3 rounded-xl transition-colors"
                    >
                      {estado.prueba ? "Rendirla de nuevo" : "Rendir la prueba"}
                    </button>
                  )}
                </div>

                {estado.completado && (
                  <div className="bg-safe-50 border border-safe-200 rounded-2xl p-4 text-sm text-navy-700 leading-relaxed">
                    Nivel {nivel.numero} completado.{" "}
                    <Link href="/academia" className="font-semibold hover:underline">
                      Vuelve al índice
                    </Link>{" "}
                    para seguir con el siguiente.
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* LECCIÓN ------------------------------------------------------- */}
        {fase === "capsula" && estadoCapsula && (
          <div className="space-y-3">
            <CapsulaFormativa
              key={estadoCapsula.indicador}
              capsula={estadoCapsula.capsula}
              evidencia={evidenciaEjemplo(estadoCapsula.capsula)}
              etiqueta={`Lección ${indiceCapsula + 1} de ${totalCapsulas}`}
              contexto={estadoCapsula.capsula.ejemplo.contexto}
              estadoPrevio={
                estadoCapsula.respondida ? { correcto: !!estadoCapsula.correcta } : null
              }
              onResponder={(correcto) => responderCapsula(estadoCapsula.capsula, correcto)}
            />

            <div className="flex gap-2">
              <button
                onClick={volverAlIndice}
                className="flex-1 bg-white border-2 border-navy-100 text-navy-700 font-semibold py-3 rounded-xl hover:bg-surface-alt transition-colors text-sm"
              >
                Índice
              </button>
              {indiceCapsula + 1 < totalCapsulas ? (
                <button
                  onClick={() => abrirCapsula(indiceCapsula + 1)}
                  className="flex-[2] bg-navy-700 hover:bg-navy-800 text-white font-semibold py-3 rounded-xl transition-colors text-sm inline-flex items-center justify-center gap-1.5"
                >
                  Siguiente lección <ArrowRight className="w-4 h-4" />
                </button>
              ) : estado?.pruebaDisponible ? (
                <button
                  onClick={comenzarPrueba}
                  className="flex-[2] bg-navy-700 hover:bg-navy-800 text-white font-semibold py-3 rounded-xl transition-colors text-sm inline-flex items-center justify-center gap-1.5"
                >
                  Rendir la prueba <ClipboardCheck className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={volverAlIndice}
                  className="flex-[2] bg-navy-700 hover:bg-navy-800 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                >
                  Terminar
                </button>
              )}
            </div>
          </div>
        )}

        {/* PRUEBA -------------------------------------------------------- */}
        {fase === "prueba" && itemPrueba && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-navy-500 mb-1.5">
                <span>
                  Caso {indicePrueba + 1} de {nivel.prueba.length}
                </span>
                <span>{paraAprobar} aciertos para aprobar</span>
              </div>
              <div className="h-2 bg-surface-alt rounded-full overflow-hidden">
                <div
                  className="h-full bg-navy-700 rounded-full transition-all"
                  style={{ width: `${(indicePrueba / nivel.prueba.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-card p-5 space-y-3">
              {itemPrueba.escenario && (
                <p className="text-sm text-navy-600 leading-relaxed">{itemPrueba.escenario}</p>
              )}
              {itemPrueba.enlace && (
                <div className="bg-surface-alt rounded-xl p-3">
                  <div className="text-[10px] uppercase tracking-wide text-navy-400 font-medium">
                    El enlace
                  </div>
                  <div className="text-sm font-mono break-all text-navy-700 mt-0.5">
                    {itemPrueba.enlace}
                  </div>
                </div>
              )}
              <p className="text-sm font-semibold text-navy-700">{itemPrueba.enunciado}</p>
              <div className="space-y-2">
                {itemPrueba.opciones.map((op, i) => (
                  <button
                    key={i}
                    onClick={() => responderPrueba(i)}
                    className="w-full text-left text-sm font-medium px-4 py-3 rounded-xl border-2 border-navy-100 bg-white text-navy-700 hover:bg-surface-alt transition-colors"
                  >
                    {op}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-navy-400 text-center">
              No se muestran respuestas hasta el final, para no influir en tu criterio.
            </p>
          </div>
        )}

        {/* RESULTADO ----------------------------------------------------- */}
        {fase === "resultado" && resultado && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-card p-5 text-center">
              <div
                className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${
                  aprobadaAhora ? "bg-safe-50 text-safe-500" : "bg-warn-50 text-warn-500"
                }`}
              >
                {aprobadaAhora ? (
                  <GraduationCap className="w-7 h-7" />
                ) : (
                  <RotateCcw className="w-7 h-7" />
                )}
              </div>
              <div className="text-3xl font-bold text-navy-700 mt-3">
                {aciertosAhora} de {respuestas.length}
              </div>
              <div className="text-sm font-semibold mt-1">
                {aprobadaAhora ? (
                  <span className="text-safe-500">Nivel {nivel.numero} aprobado</span>
                ) : (
                  <span className="text-warn-500">Se aprueba con {paraAprobar}</span>
                )}
              </div>
              <p className="text-sm text-navy-500 mt-2 leading-relaxed">
                {aprobadaAhora
                  ? "El nivel siguiente ya está abierto en el índice."
                  : "Repasa las lecciones y vuelve a rendirla: puedes repetirla cuantas veces quieras. Para tu Coeficiente de Resiliencia Digital solo cuenta el primer intento."}
              </p>
              {!aprobadaAhora && resultado.aprobada && (
                <p className="text-xs text-navy-400 mt-2">
                  El nivel sigue aprobado por un intento anterior, así que no se
                  cierra lo que ya tenías abierto.
                </p>
              )}
            </div>

            {/* Revisión caso por caso */}
            <div className="space-y-3">
              {respuestas.map(({ item, elegida }) => {
                const ok = elegida === item.correcta;
                return (
                  <div key={item.id} className="bg-white rounded-2xl shadow-card p-4">
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          ok ? "bg-safe-50 text-safe-500" : "bg-brand-50 text-brand-700"
                        }`}
                      >
                        {ok ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        {item.enlace && (
                          <div className="text-xs font-mono break-all text-navy-500 mb-1">
                            {item.enlace}
                          </div>
                        )}
                        <div className="text-sm font-semibold text-navy-700 leading-tight">
                          {item.enunciado}
                        </div>
                        {!ok && (
                          <div className="text-xs text-brand-700 mt-1.5">
                            Elegiste: {item.opciones[elegida]}
                          </div>
                        )}
                        <div className="text-xs text-safe-900 font-medium mt-1">
                          Correcta: {item.opciones[item.correcta]}
                        </div>
                        <p className="text-sm text-navy-600 leading-relaxed mt-2">
                          {item.explicacion}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2">
              <button
                onClick={volverAlIndice}
                className="flex-1 bg-white border-2 border-navy-100 text-navy-700 font-semibold py-3 rounded-xl hover:bg-surface-alt transition-colors text-sm"
              >
                Repasar lecciones
              </button>
              {aprobadaAhora ? (
                <Link
                  href="/academia"
                  className="flex-[2] bg-navy-700 hover:bg-navy-800 text-white font-semibold py-3 rounded-xl transition-colors text-sm inline-flex items-center justify-center gap-1.5"
                >
                  Volver al índice <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <button
                  onClick={comenzarPrueba}
                  className="flex-[2] bg-navy-700 hover:bg-navy-800 text-white font-semibold py-3 rounded-xl transition-colors text-sm inline-flex items-center justify-center gap-1.5"
                >
                  Rendirla de nuevo <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------

function Aviso({
  titulo, children, icono,
}: {
  titulo: string;
  children: React.ReactNode;
  icono?: "lock";
}) {
  return (
    <div className="fade-in px-5 py-8">
      <div className="bg-white rounded-2xl shadow-card p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-navy-50 text-navy-400 mx-auto flex items-center justify-center">
          {icono === "lock" ? <Lock className="w-6 h-6" /> : <GraduationCap className="w-6 h-6" />}
        </div>
        <h1 className="text-lg font-bold text-navy-700 mt-3">{titulo}</h1>
        <p className="text-sm text-navy-500 mt-2 leading-relaxed">{children}</p>
        <Link
          href="/academia"
          className="inline-flex items-center gap-1.5 mt-4 bg-navy-700 hover:bg-navy-800 text-white font-semibold px-5 py-3 rounded-xl transition-colors text-sm"
        >
          Ir a la Cyber-Academy <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

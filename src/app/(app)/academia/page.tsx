"use client";

// =============================================================================
// Fishin't — Cyber-Academy: índice de niveles
// =============================================================================
// Puerta de entrada a la formación. Hasta ahora las microcápsulas solo aparecían
// cuando el analizador marcaba un enlace, es decir cuando la persona ya había
// recibido una estafa; acá se pueden recorrer por decisión propia.
//
// Los niveles se abren en orden: cada uno se apoya en el anterior y abrir el
// de homóglifos a alguien que todavía no sabe leer un dominio no enseña nada.
// =============================================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, GraduationCap, Lock, Check, ChevronRight,
  ClipboardCheck, BookOpen, AlertTriangle,
} from "lucide-react";
import { markEducationViewed } from "@/lib/activity";
import { getProgreso, type EstadoNivel, type ProgresoAcademia } from "@/lib/academia";

export default function AcademiaPage() {
  const [progreso, setProgreso] = useState<ProgresoAcademia | null>(null);

  useEffect(() => {
    markEducationViewed();
    setProgreso(getProgreso());
  }, []);

  const pct = progreso
    ? Math.round((progreso.capsulasRespondidas / progreso.totalCapsulas) * 100)
    : 0;

  return (
    <div className="fade-in pb-4">
      {/* Encabezado */}
      <div className="bg-navy-700 text-white pt-6 pb-8 px-5 rounded-b-3xl">
        <Link
          href="/home"
          className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
        <div className="flex items-center gap-2">
          <GraduationCap className="w-6 h-6 flex-shrink-0" />
          <h1 className="text-2xl font-bold">Cyber-Academy</h1>
        </div>
        <p className="text-sm text-white/70 mt-1">
          Tres niveles para aprender a leer un enlace antes de tocarlo.
        </p>

        {progreso && (
          <div className="mt-5">
            <div className="flex justify-between text-xs text-white/70 mb-1.5">
              <span>
                {progreso.capsulasRespondidas} de {progreso.totalCapsulas} lecciones
              </span>
              <span>
                {progreso.nivelesCompletados} de {progreso.niveles.length} niveles
              </span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="px-5 py-5 space-y-3">
        {!progreso && (
          <>
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-card h-28 animate-pulse" />
            ))}
          </>
        )}

        {progreso?.niveles.map((estado) => (
          <TarjetaNivel key={estado.nivel.id} estado={estado} />
        ))}

        {progreso && progreso.nivelesCompletados === progreso.niveles.length && (
          <div className="bg-safe-50 border border-safe-200 rounded-2xl p-4 text-sm text-navy-700 leading-relaxed">
            Completaste los tres niveles. Reconocer las señales es la mitad del
            trabajo; la otra mitad es el hábito de revisar antes de tocar.
          </div>
        )}

        {/* Más material -------------------------------------------------- */}
        <h2 className="text-sm font-semibold text-navy-700 uppercase tracking-wide pt-4">
          Además
        </h2>

        <Link
          href="/evaluacion"
          className="flex items-center gap-4 bg-navy-700 text-white rounded-2xl p-4 shadow-card hover:bg-navy-800 transition-colors"
        >
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-[15px] leading-tight">Evalúa tu resiliencia</div>
            <div className="text-xs text-white/80 mt-1">
              12 mensajes reales: descubre tu Coeficiente de Resiliencia Digital
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-white/60 flex-shrink-0" />
        </Link>

        <TarjetaExtra
          href="/educacion"
          icon={BookOpen}
          iconBg="bg-navy-50"
          iconColor="text-navy-700"
          titulo="Material de referencia"
          descripcion="Tipos de amenaza, anatomía de un correo falso y preguntas frecuentes"
        />
        <TarjetaExtra
          href="/ejemplos"
          icon={AlertTriangle}
          iconBg="bg-warn-50"
          iconColor="text-warn-500"
          titulo="Casos reales en Chile"
          descripcion="BancoEstado, Correos de Chile, AFP y las demás campañas documentadas"
        />
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------

function TarjetaNivel({ estado }: { estado: EstadoNivel }) {
  const { nivel, desbloqueado, completado, respondidas, total } = estado;

  const contenido = (
    <>
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-bold ${
          completado
            ? "bg-safe-50 text-safe-500"
            : desbloqueado
            ? "bg-navy-50 text-navy-700"
            : "bg-navy-50 text-navy-300"
        }`}
      >
        {completado ? <Check className="w-5 h-5" /> : desbloqueado ? nivel.numero : <Lock className="w-4 h-4" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wide text-navy-400 font-medium">
          Nivel {nivel.numero}
          {completado && " · completado"}
        </div>
        <div
          className={`font-bold text-[15px] leading-tight ${
            desbloqueado ? "text-navy-700" : "text-navy-300"
          }`}
        >
          {nivel.nombre}
        </div>
        <div className="text-xs text-navy-400 mt-0.5">
          {desbloqueado ? nivel.lema : estado.requisito}
        </div>

        {desbloqueado && (
          <div className="mt-2.5">
            <div className="flex items-center justify-between text-[11px] text-navy-400 mb-1">
              <span>
                {respondidas} de {total} lecciones
              </span>
              {estado.prueba && (
                <span>
                  Prueba: {estado.prueba.aciertos}/{estado.prueba.total}
                  {estado.prueba.aprobada ? " · aprobada" : ""}
                </span>
              )}
            </div>
            <div className="h-1.5 bg-surface-alt rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  completado ? "bg-safe-500" : "bg-navy-700"
                }`}
                style={{ width: `${(respondidas / total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {desbloqueado && <ChevronRight className="w-4 h-4 text-navy-300 flex-shrink-0 self-center" />}
    </>
  );

  if (!desbloqueado) {
    return (
      <div className="flex items-start gap-4 bg-white rounded-2xl p-4 shadow-card opacity-60">
        {contenido}
      </div>
    );
  }

  return (
    <Link
      href={`/academia/${nivel.id}`}
      className="flex items-start gap-4 bg-white rounded-2xl p-4 shadow-card hover:shadow-card-hover transition-shadow"
    >
      {contenido}
    </Link>
  );
}

function TarjetaExtra({
  href, icon: Icon, iconBg, iconColor, titulo, descripcion,
}: {
  href: string;
  icon: typeof BookOpen;
  iconBg: string;
  iconColor: string;
  titulo: string;
  descripcion: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-card hover:shadow-card-hover transition-shadow"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-[15px] leading-tight text-navy-700">{titulo}</div>
        <div className="text-xs text-navy-400 mt-1">{descripcion}</div>
      </div>
      <ChevronRight className="w-4 h-4 text-navy-300 flex-shrink-0" />
    </Link>
  );
}

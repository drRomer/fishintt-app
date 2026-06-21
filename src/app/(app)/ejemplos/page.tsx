"use client";

import Link from "next/link";
import { ArrowLeft, AlertTriangle, Flag } from "lucide-react";
import { SCAMS, getSeverityColor, getCategoryLabel, type Severity } from "@/lib/data/scams";
import { useState } from "react";

export default function EjemplosPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = SCAMS.find((s) => s.id === selectedId);

  return (
    <div className="fade-in">
      <div className="px-5 pt-6 pb-4 bg-white border-b border-navy-50">
        <Link href="/home" className="inline-flex items-center gap-2 text-navy-500 hover:text-navy-700 text-sm mb-3">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
        <h1 className="text-2xl font-bold text-navy-700">Estafas más comunes</h1>
        <p className="text-sm text-navy-500 mt-1">
          Casos reportados frecuentemente por la comunidad chilena
        </p>
      </div>

      <div className="px-5 py-5">
        {/* Alert banner */}
        <div className="bg-warn-50 border border-warn-200 rounded-2xl p-4 mb-5 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-warn-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-warn-900 text-sm">Mantente alerta</div>
            <div className="text-xs text-warn-900/80 mt-0.5">
              Estas instituciones nunca te pedirán información sensible por correo, SMS o
              llamadas no solicitadas.
            </div>
          </div>
        </div>

        {/* Scam list */}
        <div className="space-y-3">
          {SCAMS.map((scam) => {
            const c = getSeverityColor(scam.severity);
            return (
              <button
                key={scam.id}
                onClick={() => setSelectedId(scam.id)}
                className="w-full text-left bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-shadow overflow-hidden"
              >
                {/* Mini preview banner */}
                <div className="h-24 bg-surface-alt overflow-hidden relative">
                  <img
                    src={`/scams/${scam.image}.svg`}
                    alt=""
                    className="w-full h-full object-cover object-top opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/60 to-transparent" />
                </div>
                <div className="flex items-start gap-3 p-4">
                  <div className="w-11 h-11 bg-navy-50 rounded-xl flex items-center justify-center font-bold text-navy-700 text-sm flex-shrink-0">
                    {scam.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="font-semibold text-navy-700 text-[15px] leading-tight">
                        {scam.shortName}
                      </div>
                      <SeverityBadge severity={scam.severity} />
                    </div>
                    <div className="text-xs text-navy-500 mb-2 leading-snug">
                      {scam.modusOperandi}
                    </div>
                    <div className="text-[11px] text-navy-400 flex items-center gap-2">
                      <span className="bg-navy-50 px-2 py-0.5 rounded-md">
                        {getCategoryLabel(scam.category)}
                      </span>
                      <span>{scam.reportedCases} casos reportados</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <Link
          href="/reportar"
          className="block w-full mt-5 bg-navy-700 hover:bg-navy-800 text-white font-semibold py-3.5 rounded-2xl text-center transition-colors"
        >
          Reportar nueva estafa
        </Link>
      </div>

      {/* Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelectedId(null)}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white px-5 pt-5 pb-4 border-b border-navy-100 flex items-start gap-3">
              <div className="w-12 h-12 bg-navy-50 rounded-xl flex items-center justify-center font-bold text-navy-700 flex-shrink-0">
                {selected.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-navy-700">{selected.institution}</div>
                <div className="text-xs text-navy-500 mt-0.5">{selected.modusOperandi}</div>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="text-navy-400 hover:text-navy-700 w-8 h-8 flex items-center justify-center"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="px-5 py-5 space-y-5">
              {/* Mockup image */}
              <div className="bg-surface-alt rounded-2xl overflow-hidden">
                <img
                  src={`/scams/${selected.image}.svg`}
                  alt={`Ejemplo visual de estafa: ${selected.institution}`}
                  className="w-full h-auto block"
                />
                <div className="px-3 py-2 text-[10px] text-navy-400 text-center bg-white border-t border-navy-100">
                  Mockup educativo · no es un mensaje real
                </div>
              </div>

              <div>
                <SeverityBadge severity={selected.severity} />
                <p className="text-navy-600 leading-relaxed mt-3 text-sm">
                  {selected.description}
                </p>
              </div>

              <div className="bg-brand-50 border border-brand-100 rounded-xl p-4">
                <div className="text-xs font-semibold text-brand-700 uppercase tracking-wide mb-1.5">
                  Ejemplo real
                </div>
                <div className="text-sm text-navy-700 italic">&ldquo;{selected.realExample}&rdquo;</div>
              </div>

              <div>
                <div className="text-xs font-semibold text-navy-500 uppercase tracking-wide mb-2">
                  Señales que delatan el fraude
                </div>
                <ul className="space-y-2">
                  {selected.signs.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm text-navy-700">
                      <Flag className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-safe-50 border border-safe-200 rounded-xl p-4">
                <div className="text-xs font-semibold text-safe-900 uppercase tracking-wide mb-1.5">
                  Cómo verificar de forma segura
                </div>
                <div className="text-sm text-safe-900">{selected.howToVerify}</div>
              </div>

              <Link
                href="/reportar"
                onClick={() => setSelectedId(null)}
                className="block w-full bg-navy-700 hover:bg-navy-800 text-white font-semibold py-3 rounded-xl text-center transition-colors"
              >
                Reportar caso similar
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: Severity }) {
  const c = getSeverityColor(severity);
  const labels = { alta: "Alta peligrosidad", media: "Peligrosidad media", baja: "Baja peligrosidad" };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide ${c.bg} ${c.text} px-2 py-1 rounded-md whitespace-nowrap`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} /> {labels[severity]}
    </span>
  );
}

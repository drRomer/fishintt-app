"use client";

import Link from "next/link";
import { ArrowLeft, AlertCircle, ChevronDown, X } from "lucide-react";
import { THREAT_TYPES, RED_FLAGS } from "@/lib/data/education";
import { useState } from "react";

export default function EducacionPage() {
  const [expandedId, setExpandedId] = useState<string | null>(THREAT_TYPES[0].id);
  const [showAnatomyModal, setShowAnatomyModal] = useState(false);

  return (
    <div className="fade-in">
      <div className="px-5 pt-6 pb-4 bg-white border-b border-navy-50">
        <Link href="/home" className="inline-flex items-center gap-2 text-navy-500 hover:text-navy-700 text-sm mb-3">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
        <h1 className="text-2xl font-bold text-navy-700">Cómo identificar phishing</h1>
        <p className="text-sm text-navy-500 mt-1">
          Aprende a protegerte de las estafas digitales más comunes en Chile
        </p>
      </div>

      <div className="px-5 py-5 space-y-3">
        {/* HERO: Anatomía del email phishing - Botón */}
        <button
          onClick={() => setShowAnatomyModal(true)}
          className="w-full bg-white rounded-2xl shadow-card overflow-hidden hover:shadow-card-hover transition-shadow text-left"
        >
          <div className="px-5 pt-5 pb-3">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-500 bg-brand-50 px-2 py-1 rounded-md mb-2">
              <AlertCircle className="w-3 h-3" /> Reconoce un fraude
            </div>
            <h2 className="text-lg font-bold text-navy-700 leading-tight">
              Anatomía de un correo malicioso: aprende a detectarlo
            </h2>
            <p className="text-xs text-navy-500 mt-1">
              7 señales que delatan un email falso, a través de un ejemplo real
            </p>
          </div>
          <div className="bg-surface-alt px-5 py-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-navy-700">Abre la imagen anotada</span>
            <svg className="w-5 h-5 text-navy-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        {/* Modal de Anatomía */}
        {showAnatomyModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white px-5 py-4 border-b border-navy-50 flex items-center justify-between">
                <h2 className="text-xl font-bold text-navy-700">Anatomía de un correo de phishing</h2>
                <button
                  onClick={() => setShowAnatomyModal(false)}
                  className="w-10 h-10 flex items-center justify-center text-navy-400 hover:text-navy-700 hover:bg-surface-alt rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <img
                  src="/anatomy-phishing-email.svg"
                  alt="Diagrama anotado de un correo de phishing con sus 7 señales de alerta"
                  className="block min-w-full w-full h-auto"
                />
              </div>
              <div className="px-5 py-4 border-t border-navy-50 text-sm text-navy-600 leading-relaxed">
                <p className="mb-3">
                  <strong>💡 Consejo:</strong> Si <strong>2 o más</strong> de estas señales aparecen en un correo, asume que es phishing y no respondas.
                </p>
                <div className="bg-brand-50 border border-brand-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-brand-700 uppercase mb-2">Ejemplos de señales típicas:</p>
                  <ul className="space-y-1 text-xs text-navy-700">
                    <li>• Errores gramaticales o de ortografía</li>
                    <li>• Remitente sospechoso o dirección falsa</li>
                    <li>• Enlaces que no coinciden con el dominio oficial</li>
                    <li>• Solicitudes urgentes de información personal</li>
                    <li>• Amenazas de cierre de cuenta inmediato</li>
                    <li>• Ofertas demasiado buenas para ser verdad</li>
                    <li>• Archivos adjuntos sospechosos</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Threat types - accordions */}
        {THREAT_TYPES.map((threat) => {
          const Icon = threat.icon;
          const expanded = expandedId === threat.id;
          return (
            <div
              key={threat.id}
              className="bg-white rounded-2xl shadow-card overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(expanded ? null : threat.id)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-surface-alt transition-colors"
              >
                <div className="w-10 h-10 bg-navy-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-navy-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-navy-700">{threat.name}</div>
                  <div className="text-xs text-navy-400 line-clamp-1 mt-0.5">
                    {threat.description.split(".")[0]}
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-navy-400 transition-transform flex-shrink-0 ${
                    expanded ? "rotate-180" : ""
                  }`}
                />
              </button>

              {expanded && (
                <div className="px-4 pb-4 fade-in">
                  <p className="text-sm text-navy-600 leading-relaxed mb-4">
                    {threat.description}
                  </p>

                  <div className="bg-brand-50 border border-brand-100 rounded-xl p-3 mb-3">
                    <div className="text-xs font-semibold text-brand-700 uppercase tracking-wide mb-1.5">
                      Ejemplo real
                    </div>
                    <div className="text-sm text-navy-700 italic">{threat.example}</div>
                  </div>

                  <div className="mb-3">
                    <div className="text-xs font-semibold text-navy-500 uppercase tracking-wide mb-2">
                      Señales de alerta
                    </div>
                    <ul className="space-y-1.5">
                      {threat.signs.map((sign, i) => (
                        <li key={i} className="text-sm text-navy-700 flex gap-2">
                          <span className="text-brand-500 flex-shrink-0">⚠</span>
                          {sign}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-navy-500 uppercase tracking-wide mb-2">
                      Cómo protegerte
                    </div>
                    <ul className="space-y-1.5">
                      {threat.prevention.map((p, i) => (
                        <li key={i} className="text-sm text-navy-700 flex gap-2">
                          <span className="text-safe-500 flex-shrink-0">✓</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Red flags general */}
        <div className="bg-gradient-to-br from-brand-50 to-brand-100/30 border border-brand-100 rounded-2xl p-5 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-brand-500" />
            <h2 className="font-bold text-navy-700">Señales generales de alerta</h2>
          </div>
          <div className="space-y-3">
            {RED_FLAGS.map((flag, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-6 h-6 bg-brand-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <div>
                  <div className="font-semibold text-navy-700 text-sm">{flag.title}</div>
                  <div className="text-xs text-navy-500 mt-0.5">{flag.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Link to examples */}
        <Link
          href="/ejemplos"
          className="block bg-navy-700 hover:bg-navy-800 text-white rounded-2xl p-5 mt-4 transition-colors"
        >
          <div className="font-bold text-lg mb-1">Ver casos reales en Chile</div>
          <div className="text-sm text-white/80">
            Estafas más reportadas: BancoEstado, AFP, Correos de Chile y más →
          </div>
        </Link>
      </div>
    </div>
  );
}

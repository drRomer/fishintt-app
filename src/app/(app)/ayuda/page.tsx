"use client";

// =============================================================================
// Fishin't — Ayuda y emergencias
// =============================================================================
// Esta página tenía antes un "Asistente IA" y un "Operador humano" con botón de
// solicitar llamada. Los dos eran botones muertos: no había nada detrás. Se
// eliminaron porque el proyecto se declara NO COMERCIAL y sin ingresos, así que
// no existe ni existirá una mesa de ayuda; y porque prometer un chat que no
// responde, en una aplicación de seguridad, destruye justamente la confianza que
// el producto busca construir.
//
// Queda lo que sí está respaldado y es gratuito: el protocolo de emergencia de
// la Ley N° 20.009 (las primeras 24 horas son las que importan) y las preguntas
// frecuentes. Ambos siguen siendo de acceso libre, sin cuenta.
// =============================================================================

import Link from "next/link";
import { ArrowLeft, ChevronDown, LifeBuoy } from "lucide-react";
import { FAQS } from "@/lib/data/education";
import { useState } from "react";

export default function AyudaPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="fade-in">
      <div className="px-5 pt-6 pb-4 bg-white border-b border-navy-50">
        <Link
          href="/home"
          className="inline-flex items-center gap-2 text-navy-500 hover:text-navy-700 text-sm mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
        <div className="flex items-center gap-2">
          <LifeBuoy className="w-5 h-5 text-navy-700" />
          <h1 className="text-2xl font-bold text-navy-700">Ayuda y emergencias</h1>
        </div>
        <p className="text-sm text-navy-500 mt-1">
          Qué hacer si caíste en una estafa, y respuestas a las dudas más comunes
        </p>
      </div>

      <div className="px-5 py-5 space-y-4">
        {/* Emergencia: lo primero, porque es lo que apura */}
        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5">
          <div className="font-bold text-brand-700 mb-1">¿Caíste en una estafa?</div>
          <p className="text-sm text-navy-700 mb-3">
            Actuar dentro de las primeras 24 horas mejora tus posibilidades de recuperar el
            dinero según la Ley N° 20.009.
          </p>
          <div className="space-y-2 text-sm">
            <PasoEmergencia n={1}>
              Llama a tu banco para bloquear cuentas y tarjetas
            </PasoEmergencia>
            <PasoEmergencia n={2}>Cambia todas tus contraseñas</PasoEmergencia>
            <PasoEmergencia n={3}>
              Denuncia en{" "}
              <a
                href="https://cibercrimen.pdichile.cl"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-500 font-medium underline"
              >
                PDI Cibercrimen
              </a>
            </PasoEmergencia>
          </div>
        </div>

        {/* Qué es y qué no es Fishin't: esperar una mesa de ayuda que no existe
            es peligroso cuando te acaban de estafar. */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h2 className="font-bold text-navy-700 mb-2">Fishin&apos;t no responde por ti</h2>
          <p className="text-sm text-navy-600 leading-relaxed">
            Esta aplicación es gratuita y no tiene mesa de ayuda ni atención telefónica.
            Analiza enlaces y te enseña a reconocer fraudes, pero no puede bloquear tu
            tarjeta, revertir una transferencia ni presentar una denuncia.
          </p>
          <p className="text-sm text-navy-600 leading-relaxed mt-2">
            Para eso están los pasos de arriba: tu banco y la PDI. Haz eso primero.
          </p>
        </div>

        {/* FAQs */}
        <div className="pt-1">
          <h2 className="font-bold text-navy-700 mb-3">Preguntas frecuentes</h2>
          <div className="space-y-2">
            {FAQS.map((faq, i) => {
              const open = openFaq === i;
              return (
                <div key={i} className="bg-white rounded-xl shadow-card overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-surface-alt"
                  >
                    <span className="text-sm font-semibold text-navy-700">{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-navy-400 flex-shrink-0 transition-transform ${
                        open ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {open && (
                    <div className="px-4 pb-4 text-sm text-navy-600 leading-relaxed fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function PasoEmergencia({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-5 h-5 bg-brand-500 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
        {n}
      </span>
      <span className="text-navy-700">{children}</span>
    </div>
  );
}

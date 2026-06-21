"use client";

import Link from "next/link";
import { ArrowLeft, MessageCircle, Headphones, ChevronDown, Phone, Clock } from "lucide-react";
import { FAQS } from "@/lib/data/education";
import { useState } from "react";

export default function OperadorPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="fade-in">
      <div className="px-5 pt-6 pb-4 bg-white border-b border-navy-50">
        <Link href="/home" className="inline-flex items-center gap-2 text-navy-500 hover:text-navy-700 text-sm mb-3">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
        <h1 className="text-2xl font-bold text-navy-700">Contactar con operador</h1>
        <p className="text-sm text-navy-500 mt-1">
          Obtén ayuda personalizada para resolver tus dudas
        </p>
      </div>

      <div className="px-5 py-5 space-y-4">
        {/* Asistente IA */}
        <div className="bg-navy-700 text-white rounded-2xl p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-lg">Asistente IA</div>
              <div className="text-sm text-white/80 mt-0.5">
                Respuestas instantáneas disponibles 24/7
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-xs">
                <span className="w-2 h-2 bg-safe-200 rounded-full inline-block animate-pulse" />
                <span className="text-white/90 font-medium">Disponible ahora</span>
              </div>
            </div>
          </div>
          <button className="w-full bg-white hover:bg-white/95 text-navy-700 font-semibold py-3 rounded-xl mt-2 flex items-center justify-center gap-2">
            <MessageCircle className="w-4 h-4" /> Iniciar Chat con IA
          </button>
        </div>

        {/* Operador humano */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Headphones className="w-5 h-5 text-brand-500" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-navy-700">Operador humano</div>
              <div className="text-sm text-navy-500 mt-0.5">
                Soporte especializado para casos complejos
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-navy-400">
                <Clock className="w-3.5 h-3.5" /> Lun - Vie: 9:00 - 18:00
              </div>
            </div>
          </div>
          <button className="w-full border-2 border-navy-700 text-navy-700 hover:bg-navy-50 font-semibold py-2.5 rounded-xl mt-2 flex items-center justify-center gap-2">
            <Phone className="w-4 h-4" /> Solicitar llamada
          </button>
        </div>

        {/* Emergencia */}
        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5">
          <div className="font-bold text-brand-700 mb-1">¿Caíste en una estafa?</div>
          <p className="text-sm text-navy-700 mb-3">
            Acción inmediata en las primeras 24 horas mejora tus posibilidades de recuperar el
            dinero según la Ley N° 20.009.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 bg-brand-500 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              <span className="text-navy-700">Llama a tu banco para bloquear cuentas y tarjetas</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 bg-brand-500 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              <span className="text-navy-700">Cambia todas tus contraseñas</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 bg-brand-500 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
              <span className="text-navy-700">
                Denuncia en{" "}
                <a
                  href="https://cibercrimen.pdichile.cl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-500 font-medium underline"
                >
                  PDI Cibercrimen
                </a>
              </span>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="pt-2">
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

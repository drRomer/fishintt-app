"use client";

import Link from "next/link";
import { ArrowLeft, Flag, Link as LinkIcon, CheckCircle2 } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

function ReportarContent() {
  const params = useSearchParams();
  const [url, setUrl] = useState("");
  const [type, setType] = useState<string>("phishing");
  const [description, setDescription] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const urlParam = params.get("url");
    if (urlParam) setUrl(urlParam);
  }, [params]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from("reports").insert({ url, type, description });
      } catch (e) {
        console.warn("Supabase no configurado, modo demo activo");
      }
    }

    setTimeout(() => {
      setSent(true);
      setSending(false);
    }, 1000);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center fade-in">
        <div className="w-20 h-20 bg-safe-50 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-10 h-10 text-safe-500" />
        </div>
        <h2 className="text-2xl font-bold text-navy-700 mb-2">Reporte enviado</h2>
        <p className="text-navy-500 max-w-xs mb-6">
          Gracias por proteger a la comunidad. Analizaremos el enlace y alertaremos si
          confirmamos la amenaza.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => {
              setSent(false);
              setUrl("");
              setDescription("");
            }}
            className="w-full bg-navy-700 hover:bg-navy-800 text-white font-semibold py-3.5 rounded-2xl"
          >
            Reportar otro enlace
          </button>
          <Link
            href="/home"
            className="w-full text-navy-500 font-medium py-3 text-center"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="px-5 pt-6 pb-4 bg-white border-b border-navy-50">
        <Link href="/home" className="inline-flex items-center gap-2 text-navy-500 hover:text-navy-700 text-sm mb-3">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
        <h1 className="text-2xl font-bold text-navy-700">Reportar enlace</h1>
        <p className="text-sm text-navy-500 mt-1">
          Analiza enlaces sospechosos y ayuda a proteger a la comunidad
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
        {/* URL */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h3 className="font-semibold text-navy-700 mb-1">Información del enlace</h3>
          <p className="text-xs text-navy-500 mb-4">
            Ingresa la URL que deseas reportar
          </p>

          <label className="text-xs font-semibold text-navy-500 uppercase tracking-wide block mb-2">
            URL sospechosa
          </label>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://ejemplo-sospechoso.com"
              required
              className="w-full pl-10 pr-3 py-3 bg-surface-alt border border-navy-100 rounded-xl text-navy-700 placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300 text-sm"
            />
          </div>
        </div>

        {/* Type */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <label className="text-xs font-semibold text-navy-500 uppercase tracking-wide block mb-3">
            Tipo de amenaza
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "phishing", label: "Phishing" },
              { value: "smishing", label: "SMS falso" },
              { value: "vishing", label: "Llamada" },
              { value: "scam", label: "Otra estafa" },
            ].map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  type === t.value
                    ? "bg-navy-700 text-white"
                    : "bg-surface-alt text-navy-600 hover:bg-navy-100"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <label className="text-xs font-semibold text-navy-500 uppercase tracking-wide block mb-2">
            Descripción (opcional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="¿Cómo recibiste este enlace? ¿Qué te pareció sospechoso?"
            rows={4}
            className="w-full px-3 py-3 bg-surface-alt border border-navy-100 rounded-xl text-navy-700 placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300 text-sm resize-none"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!url.trim() || sending}
          className="w-full bg-navy-700 hover:bg-navy-800 disabled:opacity-50 text-white font-semibold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2"
        >
          <Flag className="w-5 h-5" />
          {sending ? "Enviando..." : "Analizar y reportar enlace"}
        </button>

        <p className="text-xs text-navy-400 text-center px-4">
          Tus reportes ayudan a proteger a miles de usuarios en Chile
        </p>
      </form>
    </div>
  );
}

export default function ReportarPage() {
  return (
    <Suspense fallback={<div className="px-5 py-10 text-center text-navy-500">Cargando...</div>}>
      <ReportarContent />
    </Suspense>
  );
}

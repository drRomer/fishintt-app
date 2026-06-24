"use client";

import Link from "next/link";
import { ArrowLeft, Flag, Link as LinkIcon, CheckCircle2, ShieldAlert } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { buildSignature, analyzeLocally, type AnalysisResult } from "@/lib/analysis";

interface Report {
  url: string;
  type: string;
  description: string;
  date: string;
}

function ReportarContent() {
  const params = useSearchParams();
  const [url, setUrl] = useState("");
  const [type, setType] = useState<string>("phishing");
  const [description, setDescription] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<"formulario" | "historial">("formulario");
  const [reports, setReports] = useState<Report[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    const urlParam = params.get("url");
    if (urlParam) setUrl(urlParam);
  }, [params]);

  useEffect(() => {
    const stored = localStorage.getItem("fishintt_reports");
    if (stored) {
      try {
        setReports(JSON.parse(stored));
      } catch {}
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);

    // Analizar el enlace para obtener su anatomía y firma (IA opcional en el server).
    let result: AnalysisResult;
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      result = res.ok ? await res.json() : analyzeLocally(url);
    } catch {
      result = analyzeLocally(url);
    }
    setAnalysis(result);

    const newReport: Report = {
      url,
      type,
      description,
      date: new Date().toLocaleDateString("es-CL"),
    };
    const updated = [newReport, ...reports];
    localStorage.setItem("fishintt_reports", JSON.stringify(updated));
    setReports(updated);

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from("reports").insert({ url, type, description });
        // Dar "peso" al reporte: registrar su firma en la base comunitaria, para
        // que el analizador marque como sospechosos los enlaces similares.
        await supabase.rpc("register_threat", {
          p_url: url,
          p_normalized: result.anatomy.normalizedUrl,
          p_host: result.anatomy.host,
          p_signature: buildSignature(result.anatomy),
          p_risk_level: result.riskLevel,
          p_score: result.score,
          p_anatomy: result.anatomy,
        });
      } catch (e) {
        console.warn("Supabase no configurado o RLS, modo demo activo");
      }
    }

    setSent(true);
    setSending(false);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center fade-in">
        <div className="w-20 h-20 bg-safe-50 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-10 h-10 text-safe-500" />
        </div>
        <h2 className="text-2xl font-bold text-navy-700 mb-2">Reporte enviado</h2>
        <p className="text-navy-500 max-w-xs mb-6">
          Gracias por proteger a la comunidad. Tu reporte ya alimenta la base de datos: alertaremos a quien analice enlaces similares.
        </p>

        {analysis && (
          <div className="w-full max-w-xs bg-white rounded-2xl shadow-card p-4 mb-6 text-left">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="w-4 h-4 text-brand-500" />
              <span className="text-xs font-semibold text-navy-700 uppercase tracking-wide">
                Anatomía detectada
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {analysis.anatomy.isShortener && (
                <span className="text-[11px] font-medium px-2 py-1 rounded-lg bg-brand-100 text-brand-700">
                  Acortador: {analysis.anatomy.shortenerService}
                </span>
              )}
              {analysis.anatomy.brandImpersonated && (
                <span className="text-[11px] font-medium px-2 py-1 rounded-lg bg-brand-100 text-brand-700">
                  Imita: {analysis.anatomy.brandImpersonated}
                </span>
              )}
              {analysis.anatomy.scamCategory && (
                <span className="text-[11px] font-medium px-2 py-1 rounded-lg bg-brand-100 text-brand-700">
                  {analysis.anatomy.scamCategory}
                </span>
              )}
              <span className="text-[11px] font-medium px-2 py-1 rounded-lg bg-navy-50 text-navy-600">
                Riesgo: {analysis.riskLevel === "dangerous" ? "Peligroso" : analysis.riskLevel === "suspicious" ? "Sospechoso" : "Seguro"}
              </span>
            </div>
          </div>
        )}
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
          <Link href="/home" className="w-full text-navy-500 font-medium py-3 text-center">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in pb-4">
      <div className="px-5 pt-6 pb-4 bg-white border-b border-navy-50">
        <Link href="/home" className="inline-flex items-center gap-2 text-navy-500 hover:text-navy-700 text-sm mb-3">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
        <h1 className="text-2xl font-bold text-navy-700">Reportes</h1>
        <p className="text-sm text-navy-500 mt-1">Reporta enlaces sospechosos y consulta tu historial</p>
      </div>

      <div className="px-5 pt-4 pb-2 border-b border-navy-50 flex gap-1">
        <button
          onClick={() => setActiveTab("formulario")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === "formulario" ? "bg-navy-700 text-white" : "text-navy-500 hover:text-navy-700"
          }`}
        >
          Reportar Enlace
        </button>
        <button
          onClick={() => setActiveTab("historial")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === "historial" ? "bg-navy-700 text-white" : "text-navy-500 hover:text-navy-700"
          }`}
        >
          Historial
          {reports.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-brand-500 text-white text-xs rounded-full">
              {reports.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "formulario" ? (
        <FormularioReporte
          url={url}
          setUrl={setUrl}
          type={type}
          setType={setType}
          description={description}
          setDescription={setDescription}
          sending={sending}
          handleSubmit={handleSubmit}
        />
      ) : (
        <HistorialReportes reports={reports} />
      )}
    </div>
  );
}

function FormularioReporte({
  url,
  setUrl,
  type,
  setType,
  description,
  setDescription,
  sending,
  handleSubmit,
}: {
  url: string;
  setUrl: (v: string) => void;
  type: string;
  setType: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  sending: boolean;
  handleSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
      <div className="bg-white rounded-2xl shadow-card p-5">
        <h3 className="font-semibold text-navy-700 mb-1">Información del enlace</h3>
        <p className="text-xs text-navy-500 mb-4">Ingresa la URL que deseas reportar</p>

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
                type === t.value ? "bg-navy-700 text-white" : "bg-surface-alt text-navy-600 hover:bg-navy-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

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
  );
}

function HistorialReportes({ reports }: { reports: Report[] }) {
  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center py-12 fade-in">
        <div className="w-16 h-16 bg-navy-50 rounded-full flex items-center justify-center mb-4">
          <Flag className="w-8 h-8 text-navy-300" />
        </div>
        <h3 className="text-lg font-semibold text-navy-700 mb-2">Sin reportes aún</h3>
        <p className="text-sm text-navy-500">Comienza reportando enlaces sospechosos para proteger a la comunidad</p>
      </div>
    );
  }

  return (
    <div className="px-5 py-4 space-y-3 fade-in">
      {reports.map((report, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-card p-4 border-l-4 border-brand-500">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <div className="font-mono text-sm text-navy-700 break-all mb-1">{report.url}</div>
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-block px-2 py-1 bg-navy-50 text-navy-700 rounded font-medium">
                  {report.type === "phishing"
                    ? "Phishing"
                    : report.type === "smishing"
                    ? "SMS falso"
                    : report.type === "vishing"
                    ? "Llamada"
                    : "Otra estafa"}
                </span>
                <span className="text-navy-400">{report.date}</span>
              </div>
            </div>
          </div>
          {report.description && (
            <p className="text-sm text-navy-600 italic mt-2 pt-2 border-t border-navy-50">
              "{report.description}"
            </p>
          )}
        </div>
      ))}
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

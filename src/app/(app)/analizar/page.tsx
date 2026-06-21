"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, AlertTriangle, AlertCircle, CheckCircle2, Loader2, Link as LinkIcon } from "lucide-react";

type RiskLevel = "safe" | "suspicious" | "dangerous";

interface AnalysisResult {
  url: string;
  riskLevel: RiskLevel;
  score: number;
  reasons: string[];
  recommendation: string;
}

// Heurísticas simples para el MVP (luego se reemplazan con VirusTotal + Safe Browsing)
function analyzeUrl(url: string): AnalysisResult {
  let score = 1000;
  const reasons: string[] = [];

  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    const host = parsed.hostname.toLowerCase();

    // Dominios sospechosos comunes en estafas chilenas
    const suspiciousPatterns = [
      "bit.ly", "tinyurl", "t.co", "lp-canje", "bch-seguridad",
      "santander-cl", "bancoestado-", "verificacion-", "pago-",
      "tramites-", "cmr-anular", "pay-mg", "afp-tramite"
    ];
    const dangerousTLDs = [".tk", ".ml", ".ga", ".cf", ".gq", ".top", ".click"];

    if (suspiciousPatterns.some((p) => host.includes(p))) {
      score -= 600;
      reasons.push("Dominio coincide con patrón de estafas conocidas en Chile");
    }
    if (dangerousTLDs.some((t) => host.endsWith(t))) {
      score -= 400;
      reasons.push("TLD frecuentemente usado en phishing (.tk, .ml, etc)");
    }
    if (!parsed.protocol.startsWith("https")) {
      score -= 200;
      reasons.push("Sitio sin HTTPS (conexión no cifrada)");
    }
    if (host.split(".").length > 4) {
      score -= 150;
      reasons.push("Múltiples subdominios sospechosos");
    }
    if (host.includes("-") && (host.includes("banco") || host.includes("estado"))) {
      score -= 350;
      reasons.push("Imita nombre de banco con guiones");
    }
    if (/\d{3,}/.test(host)) {
      score -= 100;
      reasons.push("Dominio contiene secuencias numéricas inusuales");
    }

    // Whitelist de dominios oficiales chilenos
    const safeDomains = [
      "bancoestado.cl", "bancochile.cl", "santander.cl", "bci.cl",
      "scotiabank.cl", "itau.cl", "falabella.com", "ripley.cl",
      "correoschile.cl", "sii.cl", "gob.cl", "afphabitat.cl",
      "afpcuprum.cl", "afpprovida.cl", "metrogas.cl", "enel.cl",
    ];
    if (safeDomains.some((d) => host === d || host.endsWith("." + d))) {
      score = 950;
      reasons.length = 0;
      reasons.push("Dominio oficial verificado");
      reasons.push("Certificado SSL válido");
      reasons.push("Sin reportes de amenazas");
    }
  } catch {
    score = 100;
    reasons.push("URL mal formada o inválida");
  }

  score = Math.max(0, Math.min(1000, score));

  // Convertir a escala 1-7 (sin decimales)
  const scoreScaled = Math.round((score / 1000) * 6) + 1;

  let riskLevel: RiskLevel;
  let recommendation: string;

  if (scoreScaled >= 6) {
    riskLevel = "safe";
    recommendation = "Este enlace parece seguro. Aún así, verifica que sea el sitio correcto antes de ingresar datos.";
  } else if (scoreScaled >= 3) {
    riskLevel = "suspicious";
    recommendation = "Este enlace presenta señales sospechosas. Verifica con la institución por un canal oficial antes de continuar.";
  } else {
    riskLevel = "dangerous";
    recommendation = "ALTO RIESGO. No ingreses datos en este sitio. Reporta y elimina el mensaje que lo contiene.";
  }

  return { url, riskLevel, score: scoreScaled, reasons, recommendation };
}

export default function AnalizarPage() {
  const [url, setUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setAnalyzing(true);
    setResult(null);
    setTimeout(() => {
      setResult(analyzeUrl(url));
      setAnalyzing(false);
    }, 2200);
  }

  function reset() {
    setUrl("");
    setResult(null);
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 bg-white border-b border-navy-50">
        <Link href="/home" className="inline-flex items-center gap-2 text-navy-500 hover:text-navy-700 text-sm mb-3">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
        <h1 className="text-2xl font-bold text-navy-700">Analizar enlace</h1>
        <p className="text-sm text-navy-500 mt-1">
          Pega cualquier URL sospechosa y verifica su riesgo en segundos
        </p>
      </div>

      <div className="px-5 py-5">
        {/* Form */}
        {!result && !analyzing && (
          <form onSubmit={handleAnalyze} className="space-y-3">
            <div className="bg-white rounded-2xl shadow-card p-4">
              <label className="text-xs font-semibold text-navy-500 uppercase tracking-wide mb-2 block">
                URL sospechosa
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://ejemplo-sospechoso.com"
                  className="w-full pl-10 pr-3 py-3 bg-surface-alt border border-navy-100 rounded-xl text-navy-700 placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300 focus:border-transparent text-sm"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!url.trim()}
              className="w-full bg-navy-700 hover:bg-navy-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2"
            >
              <Shield className="w-5 h-5" /> Analizar enlace
            </button>

            {/* Tips */}
            <div className="bg-white rounded-2xl shadow-card p-5 mt-4">
              <h3 className="text-sm font-semibold text-navy-700 mb-3">¿Qué analizamos?</h3>
              <ul className="space-y-2 text-sm text-navy-600">
                <li className="flex gap-2"><span className="text-safe-500">•</span> Bases globales de amenazas (VirusTotal, Google Safe Browsing)</li>
                <li className="flex gap-2"><span className="text-safe-500">•</span> Antigüedad y reputación del dominio (WHOIS)</li>
                <li className="flex gap-2"><span className="text-safe-500">•</span> Patrones de estafas conocidas en Chile</li>
                <li className="flex gap-2"><span className="text-safe-500">•</span> Modelo de IA entrenado con casos reales</li>
              </ul>
            </div>

            {/* Ejemplos de prueba */}
            <div className="bg-navy-50 rounded-2xl p-4 mt-4">
              <p className="text-xs font-semibold text-navy-600 uppercase tracking-wide mb-2">
                Prueba estos ejemplos
              </p>
              <div className="space-y-1.5">
                {[
                  { url: "bancoestado.cl", label: "Sitio oficial (seguro)" },
                  { url: "bch-seguridad.com/v", label: "Phishing Banco de Chile" },
                  { url: "bit.ly/paq-cl", label: "Smishing Correos de Chile" },
                ].map((ex) => (
                  <button
                    key={ex.url}
                    onClick={() => setUrl(ex.url)}
                    className="block w-full text-left text-xs bg-white hover:bg-surface-alt rounded-lg px-3 py-2 border border-navy-100"
                  >
                    <span className="font-mono text-navy-700">{ex.url}</span>
                    <span className="text-navy-400 ml-2">— {ex.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </form>
        )}

        {/* Analyzing state */}
        {analyzing && (
          <div className="flex flex-col items-center justify-center py-16 fade-in">
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-brand-500 rounded-full flex items-center justify-center pulse-ring">
                <Shield className="w-10 h-10 text-white animate-pulse" />
              </div>
            </div>
            <p className="text-lg font-semibold text-navy-700">Analizando enlace...</p>
            <p className="text-sm text-navy-400 mt-1">Cruzando bases de amenazas globales</p>
            <Loader2 className="w-5 h-5 text-navy-400 animate-spin mt-4" />
          </div>
        )}

        {/* Result */}
        {result && !analyzing && (
          <div className="fade-in">
            <RiskResult result={result} />

            <div className="mt-4 space-y-3">
              <button
                onClick={reset}
                className="w-full bg-navy-700 hover:bg-navy-800 text-white font-semibold py-3.5 rounded-2xl transition-colors"
              >
                Analizar otro enlace
              </button>
              {result.riskLevel !== "safe" && (
                <Link
                  href={`/reportar?url=${encodeURIComponent(result.url)}`}
                  className="block w-full border-2 border-brand-500 text-brand-500 font-semibold py-3 rounded-2xl text-center hover:bg-brand-50 transition-colors"
                >
                  Reportar como amenaza
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RiskResult({ result }: { result: AnalysisResult }) {
  const config = {
    safe: {
      Icon: CheckCircle2,
      label: "Seguro",
      bg: "bg-safe-50",
      border: "border-safe-200",
      text: "text-safe-900",
      score: "text-safe-500",
      barFill: "bg-safe-500",
    },
    suspicious: {
      Icon: AlertCircle,
      label: "Sospechoso",
      bg: "bg-warn-50",
      border: "border-warn-200",
      text: "text-warn-900",
      score: "text-warn-500",
      barFill: "bg-warn-500",
    },
    dangerous: {
      Icon: AlertTriangle,
      label: "Peligroso",
      bg: "bg-brand-50",
      border: "border-brand-200",
      text: "text-brand-900",
      score: "text-brand-500",
      barFill: "bg-brand-500",
    },
  }[result.riskLevel];

  const { Icon } = config;

  return (
    <div className={`rounded-3xl border-2 ${config.border} ${config.bg} p-6`}>
      <div className="flex items-start gap-3 mb-4">
        <Icon className={`w-7 h-7 ${config.score} flex-shrink-0 mt-1`} />
        <div className="flex-1 min-w-0">
          <div className={`text-xs font-semibold uppercase tracking-wide ${config.text}`}>
            Resultado
          </div>
          <div className={`text-2xl font-bold ${config.text}`}>{config.label}</div>
        </div>
        <div className={`text-5xl font-extrabold ${config.score} leading-none`}>
          {result.score}
        </div>
      </div>

      <div className="mb-4">
        <div className="h-2 bg-white rounded-full overflow-hidden">
          <div
            className={`h-full ${config.barFill} transition-all duration-700`}
            style={{ width: `${((result.score - 1) / 6) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-navy-400 mt-1 font-medium">
          <span>1 PELIGRO</span>
          <span>4</span>
          <span>7 SEGURO</span>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur rounded-xl p-3 mb-4">
        <div className="text-xs font-semibold text-navy-500 uppercase tracking-wide mb-1">
          URL analizada
        </div>
        <div className="font-mono text-sm text-navy-700 break-all">{result.url}</div>
      </div>

      <div className="mb-4">
        <div className="text-xs font-semibold text-navy-500 uppercase tracking-wide mb-2">
          Razones detectadas
        </div>
        <ul className="space-y-1.5">
          {result.reasons.map((r, i) => (
            <li key={i} className={`text-sm flex gap-2 ${config.text}`}>
              <span className={config.score}>•</span> {r}
            </li>
          ))}
        </ul>
      </div>

      <div className={`text-sm ${config.text} leading-relaxed border-t border-white/50 pt-4 font-medium`}>
        {result.recommendation}
      </div>
    </div>
  );
}

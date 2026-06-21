"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Mail, ArrowLeft, Check } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Por favor ingresa un correo válido");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Error al procesar la solicitud");
      }

      setSubmitted(true);
    } catch (err) {
      setError("Error al enviar. Por favor intenta de nuevo.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell flex flex-col">
      <div className="px-5 pt-6 pb-2">
        <Link href="/login" className="inline-flex items-center justify-center w-10 h-10 -ml-2 text-navy-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </div>

      <div className="flex justify-center mb-6">
        <Logo size={64} />
      </div>

      <div className="flex-1 px-6 pb-8">
        <div className="bg-white rounded-3xl p-7 shadow-card">
          {!submitted ? (
            <>
              <h1 className="text-3xl font-bold text-navy-700 mb-2 text-center">
                Recuperar Contraseña
              </h1>
              <p className="text-navy-400 text-sm text-center mb-7">
                Ingresa tu correo y te enviaremos un enlace para resetear tu contraseña
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="text-sm font-medium text-navy-600 mb-1.5 block">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.cl"
                      required
                      className="w-full pl-11 pr-3 py-3 bg-surface-alt border border-navy-100 rounded-xl text-navy-700 placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300 focus:border-transparent"
                    />
                  </div>
                </div>

                {error && (
                  <div className="text-sm text-brand-700 bg-brand-50 border border-brand-100 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.includes("@")}
                  className="w-full bg-navy-700 hover:bg-navy-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors"
                >
                  {loading ? "Enviando..." : "Enviar Enlace de Recuperación"}
                </button>
              </form>

              <p className="text-center text-sm text-navy-500 mt-6">
                ¿Recordaste tu contraseña?{" "}
                <Link href="/login" className="text-brand-500 font-semibold hover:underline">
                  Volver al login
                </Link>
              </p>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-safe-50 rounded-full flex items-center justify-center">
                  <Check className="w-8 h-8 text-safe-500" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-navy-700 mb-2">
                Correo Enviado
              </h2>
              <p className="text-navy-400 text-sm mb-6">
                Hemos enviado un enlace de recuperación a <br />
                <span className="font-semibold text-navy-600">{email}</span>
              </p>
              <p className="text-navy-400 text-sm mb-8">
                Revisa tu bandeja de entrada (y spam) en los próximos minutos.
                <br />
                El enlace expira en 24 horas.
              </p>

              <Link
                href="/login"
                className="inline-block bg-navy-700 hover:bg-navy-800 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                Volver al Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

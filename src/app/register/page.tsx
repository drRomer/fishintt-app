"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff, Check, X } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

interface PasswordRule {
  label: string;
  test: (s: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: "Al menos 8 caracteres", test: (s) => s.length >= 8 },
  { label: "Incluye una mayúscula", test: (s) => /[A-Z]/.test(s) },
  { label: "Incluye un número", test: (s) => /\d/.test(s) },
];

function getStrength(pw: string): { score: number; label: string; color: string } {
  const passed = PASSWORD_RULES.filter((r) => r.test(pw)).length;
  if (pw.length === 0) return { score: 0, label: "", color: "bg-navy-100" };
  if (passed <= 1) return { score: 33, label: "Débil", color: "bg-brand-500" };
  if (passed === 2) return { score: 66, label: "Aceptable", color: "bg-warn-500" };
  return { score: 100, label: "Segura", color: "bg-safe-500" };
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = getStrength(password);
  const passwordValid = PASSWORD_RULES.every((r) => r.test(password));
  const passwordsMatch = password.length > 0 && password === confirm;
  const formValid =
    name.trim().length >= 2 &&
    email.includes("@") &&
    passwordValid &&
    passwordsMatch &&
    acceptTerms;

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!formValid) return;
    setLoading(true);
    setError(null);

    const supabase = getSupabase();

    if (!supabase) {
      sessionStorage.setItem("fishintt_user", JSON.stringify({ email, name }));
      router.push("/home");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/home");
    }
  }

  return (
    <div className="app-shell flex flex-col">
      <div className="px-5 pt-6 pb-2">
        <Link href="/" className="inline-flex items-center justify-center w-10 h-10 -ml-2 text-navy-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </div>

      <div className="flex justify-center mb-6">
        <Logo size={64} />
      </div>

      <div className="flex-1 px-6 pb-8">
        <div className="bg-white rounded-3xl p-7 shadow-card">
          <h1 className="text-3xl font-bold text-navy-700 mb-2 text-center">
            Crear cuenta
          </h1>
          <p className="text-navy-400 text-sm text-center mb-7">
            Únete y protégete contra estafas digitales
          </p>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="text-sm font-medium text-navy-600 mb-1.5 block">
                Nombre completo
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Juan Pérez"
                  required
                  className="w-full pl-11 pr-3 py-3 bg-surface-alt border border-navy-100 rounded-xl text-navy-700 placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300 focus:border-transparent"
                />
              </div>
            </div>

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

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-navy-600 mb-1.5 block">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  className="w-full pl-11 pr-11 py-3 bg-surface-alt border border-navy-100 rounded-xl text-navy-700 placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-300 hover:text-navy-500"
                  aria-label={showPassword ? "Ocultar" : "Mostrar"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength bar */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex-1 h-1 bg-navy-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${strength.color} transition-all duration-300`}
                        style={{ width: `${strength.score}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-navy-500 min-w-[60px] text-right">
                      {strength.label}
                    </span>
                  </div>
                  <ul className="space-y-1 mt-2">
                    {PASSWORD_RULES.map((rule, i) => {
                      const ok = rule.test(password);
                      return (
                        <li
                          key={i}
                          className={`text-[11px] flex items-center gap-1.5 ${
                            ok ? "text-safe-500" : "text-navy-400"
                          }`}
                        >
                          {ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          {rule.label}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-sm font-medium text-navy-600 mb-1.5 block">
                Confirmar contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repite tu contraseña"
                  required
                  className={`w-full pl-11 pr-11 py-3 bg-surface-alt border rounded-xl text-navy-700 placeholder-navy-300 focus:outline-none focus:ring-2 focus:border-transparent ${
                    confirm.length === 0
                      ? "border-navy-100 focus:ring-navy-300"
                      : passwordsMatch
                      ? "border-safe-200 focus:ring-safe-200"
                      : "border-brand-200 focus:ring-brand-200"
                  }`}
                />
                {confirm.length > 0 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {passwordsMatch ? (
                      <Check className="w-4 h-4 text-safe-500" />
                    ) : (
                      <X className="w-4 h-4 text-brand-500" />
                    )}
                  </div>
                )}
              </div>
              {confirm.length > 0 && !passwordsMatch && (
                <p className="text-[11px] text-brand-500 mt-1.5 flex items-center gap-1">
                  <X className="w-3 h-3" /> Las contraseñas no coinciden
                </p>
              )}
            </div>

            {/* Términos */}
            <label className="flex items-start gap-3 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-navy-200 text-navy-700 focus:ring-navy-300 cursor-pointer"
              />
              <span className="text-xs text-navy-600 leading-relaxed">
                Acepto los{" "}
                <Link href="#" className="text-navy-700 font-semibold underline">
                  términos de uso
                </Link>{" "}
                y la{" "}
                <Link href="#" className="text-navy-700 font-semibold underline">
                  política de privacidad
                </Link>{" "}
                de Fishin&apos;t.
              </span>
            </label>

            {error && (
              <div className="text-sm text-brand-700 bg-brand-50 border border-brand-100 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!formValid || loading}
              className="w-full bg-navy-700 hover:bg-navy-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors"
            >
              {loading ? "Creando cuenta..." : "Crear mi cuenta"}
            </button>
          </form>

          <p className="text-center text-sm text-navy-500 mt-6">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-brand-500 font-semibold hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

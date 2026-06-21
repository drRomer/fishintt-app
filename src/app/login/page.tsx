"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Mail, Lock, ArrowLeft, Eye, EyeOff, TrendingUp } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { GLOBAL_STATS } from "@/lib/data/scams";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = getSupabase();

    // Modo demo (sin Supabase configurado): admin@admin.cl / admin
    if (!supabase) {
      if (email === "admin@admin.cl" && password === "admin") {
        // Cargar datos previos si existen, sino crear defaults
        const stored = sessionStorage.getItem("fishintt_user");
        let userData: any = { email, name: "Nombre", birthDate: "", phone: "" };
        
        if (stored) {
          try {
            userData = JSON.parse(stored);
          } catch {}
        }

        sessionStorage.setItem("fishintt_user", JSON.stringify({ ...userData, email }));
        router.push("/home");
        return;
      }
      setError("Configura Supabase para auth real, o usa admin@admin.cl / admin para demo");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Cargar datos previos si existen
      const stored = sessionStorage.getItem("fishintt_user");
      let userData: any = { email, name: "Nombre", birthDate: "", phone: "" };
      
      if (stored) {
        try {
          userData = JSON.parse(stored);
        } catch {}
      }

      sessionStorage.setItem("fishintt_user", JSON.stringify({ ...userData, email }));
      router.push("/home");
    }
  }

  return (
    <div className="app-shell flex flex-col">
      {/* Header con back */}
      <div className="px-5 pt-6 pb-2">
        <Link href="/" className="inline-flex items-center justify-center w-10 h-10 -ml-2 text-navy-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </div>

      {/* Logo small */}
      <div className="flex justify-center mb-6">
        <Logo size={64} />
      </div>

      {/* Alerta nacional */}
      <div className="px-5 mb-6">
        <div className="bg-gradient-to-br from-brand-50 to-brand-100/50 border border-brand-100 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-brand-700 font-medium uppercase tracking-wide">
              Alerta nacional
            </div>
            <div className="text-sm font-semibold text-navy-700 leading-tight mt-0.5">
              {GLOBAL_STATS.yearlyAttemptsChile} intentos de phishing en Chile el último año
            </div>
          </div>
        </div>
      </div>

      {/* Welcome card */}
      <div className="flex-1 px-6">
        <div className="bg-white rounded-3xl p-7 shadow-card">
          <h1 className="text-3xl font-bold text-navy-700 mb-2 text-center">
            Bienvenido
          </h1>
          <p className="text-navy-400 text-sm text-center mb-7">
            Ingresa tus credenciales para continuar
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
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
                  placeholder="admin@admin.cl"
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
                  placeholder="••••••"
                  required
                  className="w-full pl-11 pr-11 py-3 bg-surface-alt border border-navy-100 rounded-xl text-navy-700 placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-300 hover:text-navy-500"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-brand-700 bg-brand-50 border border-brand-100 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-navy-700 hover:bg-navy-800 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors"
            >
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </button>

            {/* Forgot Password Link */}
            <div className="text-center mt-3">
              <Link
                href="/reset-password"
                className="text-sm text-brand-500 hover:text-brand-600 font-medium"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-navy-100" />
            <span className="text-xs text-navy-400 font-medium">O CONTINUAR CON</span>
            <div className="flex-1 h-px bg-navy-100" />
          </div>

          {/* Social buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 border border-navy-100 rounded-xl py-3 text-navy-700 font-medium hover:bg-surface-alt transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
            <button className="flex items-center justify-center gap-2 border border-navy-100 rounded-xl py-3 text-navy-700 font-medium hover:bg-surface-alt transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Apple
            </button>
          </div>

          <p className="text-center text-sm text-navy-500 mt-6">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-brand-500 font-semibold hover:underline">
              Regístrate aquí
            </Link>
          </p>
        </div>

        {/* Demo credentials hint */}
        <div className="mt-4 mb-6 text-center text-xs text-navy-400">
          Demo: <code className="bg-white px-2 py-0.5 rounded">admin@admin.cl</code> / <code className="bg-white px-2 py-0.5 rounded">admin</code>
        </div>
      </div>
    </div>
  );
}

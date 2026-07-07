import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ShieldCheck, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="app-shell flex flex-col bg-surface-alt">
      {/* Hero section */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-12 pb-8">
        <div className="bg-white rounded-3xl p-8 mb-8 shadow-card">
          <Logo size={120} />
        </div>

        <h1 className="text-5xl font-extrabold text-navy-700 tracking-tight mb-3">
          Fishin&apos;t
        </h1>
        <p className="text-center text-navy-500 text-base max-w-xs leading-relaxed mb-12">
          Tu escudo contra el phishing y las estafas en línea
        </p>

        <div className="w-full max-w-xs space-y-3">
          {/* Entrada libre: la app es gratuita y sin cuenta obligatoria */}
          <Link
            href="/home"
            className="flex items-center justify-center gap-2 w-full bg-navy-700 hover:bg-navy-800 active:bg-navy-900 text-white font-semibold py-4 rounded-2xl text-center transition-colors"
          >
            Entrar gratis
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-center text-xs text-navy-400 px-2">
            Sin registro. Analiza, aprende y reporta al instante.
          </p>
        </div>
      </div>

      {/* Footer: cuenta opcional + educación */}
      <div className="pb-8 px-8 text-center safe-bottom space-y-3">
        <p className="text-sm text-navy-500">
          ¿Quieres soporte y guardar tu progreso?{" "}
          <Link href="/login" className="text-navy-700 font-semibold hover:underline">
            Inicia sesión
          </Link>
        </p>
        <Link
          href="/educacion"
          className="inline-flex items-center gap-1.5 text-sm text-navy-500 hover:text-navy-700"
        >
          <ShieldCheck className="w-4 h-4" />
          ¿Qué es el phishing?
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

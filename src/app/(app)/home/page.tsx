"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";
import {
  Shield,
  Flag,
  Link as LinkIcon,
  AlertTriangle,
  BookOpen,
  MessageCircle,
  Menu,
  TrendingUp,
  Moon,
  Sun,
} from "lucide-react";
import { GLOBAL_STATS } from "@/lib/data/scams";
import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";

export default function HomePage() {
  const [userName, setUserName] = useState("Juan Pérez");
  const [showMenu, setShowMenu] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const stored = sessionStorage.getItem("fishintt_user");
    if (stored) {
      try {
        const u = JSON.parse(stored);
        if (u.name) setUserName(u.name);
      } catch {}
    }
  }, []);

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="fade-in">
      {/* Header navy con perfil */}
      <div className="bg-navy-700 text-white pt-6 pb-12 px-5 rounded-b-3xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
              <Logo size={28} />
            </div>
            <span className="text-xl font-bold">Fishin&apos;t</span>
          </div>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-10 h-10 -mr-2 flex items-center justify-center text-white/90 hover:text-white"
            aria-label="Menú"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center font-bold text-lg">
            {initials}
          </div>
          <div>
            <div className="font-semibold text-lg leading-tight">{userName}</div>
            <div className="text-xs text-white/70 flex items-center gap-1 mt-0.5">
              <Shield className="w-3 h-3" /> Usuario Protegido
            </div>
          </div>
        </div>
      </div>

      {/* Menu dropdown (overlay) */}
      {showMenu && (
        <div className="absolute top-20 right-4 bg-white rounded-2xl shadow-card-hover w-64 py-2 z-50 border border-navy-100 max-h-[80vh] overflow-y-auto">
          {/* Resumen de Protección en el menú */}
          <div className="px-4 py-3 border-b border-navy-50">
            <div className="text-xs font-semibold text-navy-500 uppercase tracking-wide mb-2">Resumen de Protección</div>
            <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
              <div>
                <div className="font-bold text-navy-700">247</div>
                <div className="text-navy-400 mt-0.5">Bloqueados</div>
              </div>
              <div className="border-x border-navy-50">
                <div className="font-bold text-navy-700">12</div>
                <div className="text-navy-400 mt-0.5">Reportes</div>
              </div>
              <div>
                <div className="font-bold text-navy-700">1.4K</div>
                <div className="text-navy-400 mt-0.5">Análisis</div>
              </div>
            </div>
          </div>
          
          <Link href="/perfil" className="flex items-center gap-3 px-4 py-3 hover:bg-surface-alt text-navy-700">
            <Shield className="w-4 h-4" /> Mi Perfil
          </Link>
          <Link href="/reportar" className="flex items-center gap-3 px-4 py-3 hover:bg-surface-alt text-navy-700">
            <Flag className="w-4 h-4" /> Historial de Reportes
          </Link>
          <Link href="/operador" className="flex items-center gap-3 px-4 py-3 hover:bg-surface-alt text-navy-700">
            <MessageCircle className="w-4 h-4" /> Ayuda y Soporte
          </Link>
          <hr className="my-1 border-navy-100" />
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-alt text-navy-700 text-left"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {isDark ? "Modo Claro" : "Modo Oscuro"}
          </button>
          <hr className="my-1 border-navy-100" />
          <Link href="/" className="flex items-center gap-3 px-4 py-3 hover:bg-brand-50 text-brand-600">
            Cerrar Sesión
          </Link>
        </div>
      )}

      {/* Acciones Rápidas */}
      <div className="px-5 mt-6">
        <h2 className="text-sm font-semibold text-navy-700 mb-3 uppercase tracking-wide">
          Acciones Rápidas
        </h2>

        <div className="space-y-3">
          <ActionCard
            href="/analizar"
            icon={LinkIcon}
            iconColor="text-white"
            iconBg="bg-brand-500"
            title="Analizar Enlace"
            description="Verifica si una URL es segura"
            highlight
          />
          <ActionCard
            href="/reportar"
            icon={AlertTriangle}
            iconColor="text-brand-500"
            iconBg="bg-brand-50"
            title="Reportar Enlace Sospechoso"
            description="Analiza y reporta URLs peligrosas"
          />
          <ActionCard
            href="/educacion"
            icon={Shield}
            iconColor="text-navy-500"
            iconBg="bg-navy-50"
            title="Aprende a Identificar Phishing"
            description="Guías y ejemplos educativos"
          />
          <ActionCard
            href="/ejemplos"
            icon={BookOpen}
            iconColor="text-warn-500"
            iconBg="bg-warn-50"
            title="Estafas Más Comunes en Chile"
            description="BancoEstado, Correos de Chile, AFP y más"
          />
          <ActionCard
            href="/operador"
            icon={MessageCircle}
            iconColor="text-safe-500"
            iconBg="bg-safe-50"
            title="Contactar Operador"
            description="Asistencia humana y con IA"
          />
        </div>
      </div>
    </div>
  );
}

interface ActionCardProps {
  href: string;
  icon: typeof Shield;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  highlight?: boolean;
}

function ActionCard({ href, icon: Icon, iconColor, iconBg, title, description, highlight }: ActionCardProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-4 rounded-2xl p-4 shadow-card hover:shadow-card-hover transition-shadow ${
        highlight 
          ? "bg-gradient-to-br from-brand-500 to-brand-600 text-white" 
          : "bg-white"
      }`}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className={`font-bold text-[15px] leading-tight ${highlight ? "text-white" : "text-navy-700"}`}>
          {title}
        </div>
        <div className={`text-xs mt-1 ${highlight ? "text-white/80" : "text-navy-400"}`}>
          {description}
        </div>
      </div>
      <svg className={`w-4 h-4 flex-shrink-0 ${highlight ? "text-white/60" : "text-navy-300"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
}

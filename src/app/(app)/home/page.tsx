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
} from "lucide-react";
import { GLOBAL_STATS } from "@/lib/data/scams";
import { useState, useEffect } from "react";

export default function HomePage() {
  const [userName, setUserName] = useState("Juan Pérez");
  const [showMenu, setShowMenu] = useState(false);

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
          <div className="flex items-center gap-2">
            <Logo size={32} monochrome="white" />
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
        <div className="absolute top-20 right-4 bg-white rounded-2xl shadow-card-hover w-56 py-2 z-50 border border-navy-100">
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
          <Link href="/" className="flex items-center gap-3 px-4 py-3 hover:bg-brand-50 text-brand-600">
            Cerrar Sesión
          </Link>
        </div>
      )}

      {/* Resumen de Protección — overlap card */}
      <div className="px-5 -mt-7">
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h2 className="text-sm font-semibold text-navy-700 mb-4 uppercase tracking-wide">
            Resumen de Protección
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-safe-50 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-safe-500" />
                </div>
                <span className="text-navy-700">Enlaces Bloqueados</span>
              </div>
              <span className="text-2xl font-bold text-navy-700">247</span>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-navy-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center">
                  <Flag className="w-4 h-4 text-brand-500" />
                </div>
                <span className="text-navy-700">Reportes Enviados</span>
              </div>
              <span className="text-2xl font-bold text-navy-700">12</span>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-navy-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-navy-50 rounded-lg flex items-center justify-center">
                  <LinkIcon className="w-4 h-4 text-navy-500" />
                </div>
                <span className="text-navy-700">Enlaces Analizados</span>
              </div>
              <span className="text-2xl font-bold text-navy-700">1,453</span>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="px-5 mt-6">
        <h2 className="text-sm font-semibold text-navy-700 mb-3 uppercase tracking-wide">
          Acciones Rápidas
        </h2>

        <div className="space-y-3">
          <ActionCard
            href="/analizar"
            icon={LinkIcon}
            iconColor="text-navy-500"
            iconBg="bg-navy-50"
            title="Analizar Enlace"
            description="Verifica si una URL es segura"
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
}

function ActionCard({ href, icon: Icon, iconColor, iconBg, title, description }: ActionCardProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-card hover:shadow-card-hover transition-shadow"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-navy-700 text-[15px] leading-tight">{title}</div>
        <div className="text-xs text-navy-400 mt-1">{description}</div>
      </div>
      <svg className="w-4 h-4 text-navy-300 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
}

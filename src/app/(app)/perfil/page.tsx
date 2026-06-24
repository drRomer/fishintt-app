"use client";

import Link from "next/link";
import {
  ArrowLeft, User, Mail, Phone, Camera, LogOut, Shield, Award,
  Edit3, Save, X, Flag, BookOpen
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { getActivity, getReportsCount, computeBadges, type Activity } from "@/lib/activity";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
}

const DEFAULT_PROFILE: UserProfile = {
  name: "Nombre",
  email: "",
  phone: "",
};

const BADGE_ICONS: Record<string, typeof Shield> = {
  protector: Shield,
  reporter: Flag,
  educador: BookOpen,
  elite: Award,
};

export default function PerfilPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<UserProfile>(DEFAULT_PROFILE);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [activity, setActivity] = useState<Activity>({ analyses: 0, blocked: 0, educationViewed: false });
  const [reportsCount, setReportsCount] = useState(0);

  useEffect(() => {
    const stored = sessionStorage.getItem("fishintt_user");
    if (stored) {
      try {
        const u = JSON.parse(stored);
        const loaded: UserProfile = {
          name: u.name || DEFAULT_PROFILE.name,
          email: u.email || DEFAULT_PROFILE.email, // Email viene del login, no se puede cambiar
          phone: u.phone || DEFAULT_PROFILE.phone,
        };
        setProfile(loaded);
        setDraft(loaded);
      } catch {}
    }
    setActivity(getActivity());
    setReportsCount(getReportsCount());
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const badges = computeBadges(activity, reportsCount);

  function startEdit() {
    setDraft(profile);
    setEditing(true);
  }

  function cancelEdit() {
    setDraft(profile);
    setEditing(false);
  }

  async function handleSave() {
    setSaving(true);
    const supabase = getSupabase();

    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("profiles").update({
            name: draft.name,
            phone: draft.phone,
          }).eq("id", user.id);
        }
      } catch (e) {
        console.warn("Supabase no disponible, modo demo activo");
      }
    }

    sessionStorage.setItem("fishintt_user", JSON.stringify(draft));
    setProfile(draft);
    setEditing(false);
    setSaving(false);
    setToast("Perfil actualizado");
  }

  function handleLogout() {
    sessionStorage.removeItem("fishintt_user");
    const supabase = getSupabase();
    if (supabase) supabase.auth.signOut().catch(() => {});
    router.push("/");
  }

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="fade-in pb-4">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-safe-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-card-hover fade-in flex items-center gap-2">
          <Save className="w-4 h-4" /> {toast}
        </div>
      )}

      <div className="bg-navy-700 text-white pt-6 pb-16 px-5 rounded-b-3xl relative">
        <div className="flex items-center justify-between mb-3">
          <Link href="/home" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Link>
          {!editing && (
            <button
              onClick={startEdit}
              className="inline-flex items-center gap-1.5 text-sm font-medium bg-white/15 hover:bg-white/25 backdrop-blur px-3 py-1.5 rounded-full transition-colors"
              aria-label="Editar perfil"
            >
              <Edit3 className="w-3.5 h-3.5" /> Editar
            </button>
          )}
        </div>
        <h1 className="text-2xl font-bold">Mi Perfil</h1>
      </div>

      <div className="px-5 -mt-12">
        <div className="bg-white rounded-3xl shadow-card p-6 text-center">
          <div className="relative inline-block mb-3">
            <div className="w-24 h-24 bg-navy-700 text-white rounded-full flex items-center justify-center font-bold text-3xl mx-auto">
              {initials}
            </div>
            {editing && (
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-white border-2 border-navy-100 rounded-full flex items-center justify-center text-navy-700 shadow-card">
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>
          {editing && (
            <p className="text-xs text-navy-400">Toca el icono para cambiar foto</p>
          )}

          <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium bg-safe-50 text-safe-900 px-3 py-1.5 rounded-full">
            <Shield className="w-3.5 h-3.5" /> Usuario Protegido
          </div>
        </div>
      </div>

      {!editing && (
        <div className="px-5 mt-4">
          <div className="bg-white rounded-2xl shadow-card p-5">
            <h3 className="text-sm font-semibold text-navy-700 mb-3 uppercase tracking-wide">
              Tu actividad
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-2xl font-bold text-brand-500">{activity.blocked}</div>
                <div className="text-[10px] text-navy-400 uppercase tracking-wide mt-1">Bloqueados</div>
              </div>
              <div className="border-x border-navy-50">
                <div className="text-2xl font-bold text-navy-700">{reportsCount}</div>
                <div className="text-[10px] text-navy-400 uppercase tracking-wide mt-1">Reportes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-navy-700">{activity.analyses}</div>
                <div className="text-[10px] text-navy-400 uppercase tracking-wide mt-1">Análisis</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!editing && (
        <div className="px-5 mt-4">
          <div className="bg-white rounded-2xl shadow-card p-5">
            <h3 className="text-sm font-semibold text-navy-700 mb-3 uppercase tracking-wide">
              Insignias obtenidas
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {badges.map((badge) => {
                const Icon = BADGE_ICONS[badge.key] || Award;
                return (
                  <div key={badge.key} className="flex flex-col items-center gap-1.5" title={badge.hint}>
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                        badge.earned
                          ? "bg-brand-500 text-white shadow-card"
                          : "bg-surface-alt text-navy-300"
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className={`text-[10px] font-medium text-center ${badge.earned ? "text-navy-700" : "text-navy-300"}`}>
                      {badge.label}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-navy-400 mt-3 text-center">
              {badges.filter((b) => b.earned).length} de {badges.length} insignias obtenidas
            </p>
          </div>
        </div>
      )}

      <div className="px-5 mt-4">
        <h3 className="text-sm font-semibold text-navy-700 mb-3 uppercase tracking-wide px-1">
          Información Personal
        </h3>
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          {editing ? (
            <>
              <EditableRow icon={User} label="Nombre" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} placeholder="Ej: Tomás Romero" />
              <EditableRow icon={Mail} label="Correo" value={draft.email} onChange={(v) => setDraft({ ...draft, email: v })} placeholder="tu@email.cl" type="email" disabled />
              <EditableRow icon={Phone} label="Telefono" value={draft.phone} onChange={(v) => setDraft({ ...draft, phone: v })} placeholder="+56 9 1234 5678" type="tel" last />
            </>
          ) : (
            <>
              <InfoRow icon={User} label="Nombre" value={profile.name} />
              <InfoRow icon={Mail} label="Correo" value={profile.email} />
              <InfoRow icon={Phone} label="Telefono" value={profile.phone} last />
            </>
          )}
        </div>
      </div>

      {editing ? (
        <div className="px-5 mt-4 flex gap-3">
          <button
            onClick={cancelEdit}
            disabled={saving}
            className="flex-1 bg-white text-navy-700 font-semibold py-3.5 rounded-2xl shadow-card flex items-center justify-center gap-2 hover:bg-surface-alt transition-colors"
          >
            <X className="w-4 h-4" /> Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !draft.name.trim()}
            className="flex-1 bg-navy-700 hover:bg-navy-800 disabled:opacity-50 text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      ) : (
        <div className="px-5 mt-4">
          <button
            onClick={handleLogout}
            className="w-full bg-white text-brand-500 font-semibold py-4 rounded-2xl shadow-card flex items-center justify-center gap-2 hover:bg-brand-50 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Cerrar Sesion
          </button>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, last = false }: { icon: typeof User; label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${!last && "border-b border-navy-50"}`}>
      <div className="w-8 h-8 bg-navy-50 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-navy-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-navy-400 uppercase tracking-wide font-medium">{label}</div>
        <div className="text-sm font-medium text-navy-700 truncate">{value || "—"}</div>
      </div>
    </div>
  );
}

function EditableRow({ icon: Icon, label, value, onChange, placeholder, type = "text", last = false, disabled = false }: { icon: typeof User; label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; last?: boolean; disabled?: boolean; }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${!last && "border-b border-navy-50"}`}>
      <div className="w-8 h-8 bg-navy-50 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-navy-500" />
      </div>
      <div className="flex-1 min-w-0">
        <label className="text-[10px] text-navy-400 uppercase tracking-wide font-medium block">
          {label}{disabled && <span className="ml-1 text-navy-300 normal-case">(no editable)</span>}
        </label>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full text-sm font-medium text-navy-700 bg-transparent border-0 p-0 mt-0.5 focus:outline-none focus:ring-0 disabled:text-navy-400 placeholder-navy-300"
        />
      </div>
    </div>
  );
}

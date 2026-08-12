"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ArrowLeft, ShieldCheck, Users, Copy, Check, Phone, AlertTriangle,
  Plus, LogIn, Building2, Bell, CheckCircle2, Loader2,
} from "lucide-react";
import { isLoggedIn } from "@/lib/session";
import {
  networkAvailable, getMyNetwork, createNetwork, joinNetwork,
  getMembers, getAlerts, resolveAlert,
  type MyNetwork, type NetworkMember, type MemberAlert,
} from "@/lib/network";

export default function RedPage() {
  const [loading, setLoading] = useState(true);
  const [logged, setLogged] = useState(false);
  const [available, setAvailable] = useState(true);
  const [net, setNet] = useState<MyNetwork | null>(null);
  const [members, setMembers] = useState<NetworkMember[]>([]);
  const [alerts, setAlerts] = useState<MemberAlert[]>([]);

  const [mode, setMode] = useState<"crear" | "unirse" | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [joinName, setJoinName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const l = isLoggedIn();
    setLogged(l);
    setAvailable(networkAvailable());
    if (!l) {
      setLoading(false);
      return;
    }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    setLoading(true);
    const n = await getMyNetwork();
    setNet(n);
    if (n?.role === "admin") {
      setMembers(await getMembers(n.id));
      setAlerts(await getAlerts(n.id));
    }
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const created = await createNetwork(name);
    setBusy(false);
    if (!created) {
      setErr("No se pudo crear la red. Intenta de nuevo.");
      return;
    }
    setMode(null);
    setName("");
    await refresh();
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await joinNetwork(code, joinName);
    setBusy(false);
    if (!res.ok) {
      setErr(res.error || "No se pudo unir.");
      return;
    }
    setMode(null);
    setCode("");
    setJoinName("");
    await refresh();
  }

  async function handleResolve(id: string) {
    await resolveAlert(id);
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, resolved: true } : a)));
  }

  function copyCode() {
    if (!net?.invite_code) return;
    navigator.clipboard?.writeText(net.invite_code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div className="fade-in pb-4">
      {/* Header */}
      <div className="bg-navy-700 text-white pt-6 pb-8 px-5 rounded-b-3xl">
        <Link href="/home" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-3">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Red Empresa Protegida</h1>
        </div>
        <p className="text-sm text-white/70 mt-1">
          Protege a tu equipo o familia: recibe alertas cuando alguien abre un enlace peligroso.
        </p>
      </div>

      <div className="px-5 py-5">
        {/* Cargando */}
        {loading && (
          <div className="flex items-center justify-center gap-2 text-navy-500 py-12">
            <Loader2 className="w-5 h-5 animate-spin" /> Cargando…
          </div>
        )}

        {/* Invitado: requiere cuenta */}
        {!loading && !logged && (
          <div className="bg-navy-700 text-white rounded-2xl p-5">
            <div className="font-bold text-lg">Necesitas una cuenta</div>
            <p className="text-sm text-white/80 mt-1 mb-4">
              La Red Protegida vincula a las personas de tu círculo, por eso requiere una
              cuenta gratuita. El resto de Fishin&apos;t sigue siendo de entrada libre.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/register" className="bg-white text-navy-700 font-semibold py-3 rounded-xl text-center hover:bg-white/95">
                Crear cuenta
              </Link>
              <Link href="/login" className="border-2 border-white/40 text-white font-semibold py-3 rounded-xl text-center hover:bg-white/10">
                Iniciar sesión
              </Link>
            </div>
          </div>
        )}

        {/* Logueado pero sin Supabase (modo demo) */}
        {!loading && logged && !available && (
          <div className="bg-warn-50 border border-warn-200 rounded-2xl p-5">
            <div className="font-bold text-warn-900">No disponible en modo demo</div>
            <p className="text-sm text-navy-700 mt-1">
              La Red Protegida necesita Supabase configurado (cuenta real). Configura las
              variables de entorno para activarla.
            </p>
          </div>
        )}

        {/* Logueado, con backend, SIN red todavía */}
        {!loading && logged && available && !net && (
          <div className="space-y-4">
            <p className="text-sm text-navy-500">
              Aún no perteneces a ninguna red. Crea una para proteger a tu equipo, o únete con
              un código si te invitaron.
            </p>

            {/* Selector */}
            {mode === null && (
              <div className="space-y-3">
                <button
                  onClick={() => { setMode("crear"); setErr(null); }}
                  className="w-full flex items-center gap-4 bg-white rounded-2xl p-4 shadow-card hover:shadow-card-hover transition-shadow text-left"
                >
                  <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-brand-500" />
                  </div>
                  <div>
                    <div className="font-bold text-navy-700 text-[15px]">Crear una red</div>
                    <div className="text-xs text-navy-400 mt-0.5">Serás el administrador y proteges a los demás</div>
                  </div>
                </button>
                <button
                  onClick={() => { setMode("unirse"); setErr(null); }}
                  className="w-full flex items-center gap-4 bg-white rounded-2xl p-4 shadow-card hover:shadow-card-hover transition-shadow text-left"
                >
                  <div className="w-11 h-11 rounded-xl bg-navy-50 flex items-center justify-center flex-shrink-0">
                    <LogIn className="w-5 h-5 text-navy-500" />
                  </div>
                  <div>
                    <div className="font-bold text-navy-700 text-[15px]">Unirme con un código</div>
                    <div className="text-xs text-navy-400 mt-0.5">Te invitaron a una red existente</div>
                  </div>
                </button>
              </div>
            )}

            {/* Form crear */}
            {mode === "crear" && (
              <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-card p-5 space-y-3">
                <label className="text-xs font-semibold text-navy-500 uppercase tracking-wide block">
                  Nombre de la red
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: PyME Aura / Familia Romero"
                  required
                  className="w-full px-3 py-3 bg-surface-alt border border-navy-100 rounded-xl text-navy-700 placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300"
                />
                {err && <div className="text-sm text-brand-700 bg-brand-50 rounded-lg px-3 py-2">{err}</div>}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setMode(null)} className="flex-1 py-3 rounded-xl bg-surface-alt text-navy-700 font-semibold">
                    Cancelar
                  </button>
                  <button type="submit" disabled={busy} className="flex-1 py-3 rounded-xl bg-navy-700 text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                    {busy && <Loader2 className="w-4 h-4 animate-spin" />} Crear
                  </button>
                </div>
              </form>
            )}

            {/* Form unirse */}
            {mode === "unirse" && (
              <form onSubmit={handleJoin} className="bg-white rounded-2xl shadow-card p-5 space-y-3">
                <label className="text-xs font-semibold text-navy-500 uppercase tracking-wide block">
                  Código de invitación
                </label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Ej: A1B2C3"
                  maxLength={6}
                  required
                  className="w-full px-3 py-3 bg-surface-alt border border-navy-100 rounded-xl text-navy-700 tracking-widest font-mono placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300"
                />
                <label className="text-xs font-semibold text-navy-500 uppercase tracking-wide block pt-1">
                  Tu nombre (visible para el admin)
                </label>
                <input
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full px-3 py-3 bg-surface-alt border border-navy-100 rounded-xl text-navy-700 placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300"
                />
                {err && <div className="text-sm text-brand-700 bg-brand-50 rounded-lg px-3 py-2">{err}</div>}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setMode(null)} className="flex-1 py-3 rounded-xl bg-surface-alt text-navy-700 font-semibold">
                    Cancelar
                  </button>
                  <button type="submit" disabled={busy} className="flex-1 py-3 rounded-xl bg-navy-700 text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                    {busy && <Loader2 className="w-4 h-4 animate-spin" />} Unirme
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* PROTEGIDO: estado */}
        {!loading && net && net.role === "protegido" && (
          <div className="space-y-4">
            <div className="bg-safe-50 border border-safe-200 rounded-2xl p-5 flex items-start gap-3">
              <ShieldCheck className="w-6 h-6 text-safe-500 flex-shrink-0" />
              <div>
                <div className="font-bold text-safe-900">Estás protegido</div>
                <p className="text-sm text-navy-700 mt-1">
                  Perteneces a la red <span className="font-semibold">{net.name}</span>. Cuando
                  analices un enlace sospechoso o peligroso, el administrador recibe una alerta
                  para ayudarte a tiempo.
                </p>
              </div>
            </div>
            <Link href="/analizar" className="block bg-navy-700 text-white font-semibold py-3.5 rounded-2xl text-center">
              Analizar un enlace
            </Link>
          </div>
        )}

        {/* ADMIN: panel */}
        {!loading && net && net.role === "admin" && (
          <div className="space-y-5">
            {/* Código de invitación */}
            <div className="bg-white rounded-2xl shadow-card p-5">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-navy-500" />
                <h2 className="font-bold text-navy-700">{net.name}</h2>
              </div>
              <p className="text-xs text-navy-400 mb-3">
                Comparte este código para que se unan a tu red ({net.member_count}{" "}
                {net.member_count === 1 ? "miembro" : "miembros"})
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-surface-alt rounded-xl px-4 py-3 font-mono text-xl tracking-widest text-navy-700 text-center">
                  {net.invite_code}
                </div>
                <button
                  onClick={copyCode}
                  className="w-12 h-12 rounded-xl bg-navy-700 text-white flex items-center justify-center hover:bg-navy-800"
                  aria-label="Copiar código"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Alertas */}
            <div>
              <div className="flex items-center gap-2 mb-3 px-1">
                <Bell className="w-4 h-4 text-brand-500" />
                <h2 className="font-bold text-navy-700">Alertas recientes</h2>
              </div>
              {alerts.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-card p-6 text-center text-sm text-navy-400">
                  Sin alertas. Cuando un miembro analice un enlace de riesgo, aparecerá aquí.
                </div>
              ) : (
                <div className="space-y-2">
                  {alerts.map((a) => (
                    <AlertRow key={a.id} alert={a} onResolve={handleResolve} />
                  ))}
                </div>
              )}
            </div>

            {/* Miembros */}
            <div>
              <div className="flex items-center gap-2 mb-3 px-1">
                <Users className="w-4 h-4 text-navy-500" />
                <h2 className="font-bold text-navy-700">Miembros</h2>
              </div>
              <div className="bg-white rounded-2xl shadow-card overflow-hidden">
                {members.map((m, i) => (
                  <div key={m.user_id} className={`flex items-center gap-3 px-4 py-3 ${i < members.length - 1 && "border-b border-navy-50"}`}>
                    <div className="w-9 h-9 rounded-full bg-navy-700 text-white flex items-center justify-center text-sm font-bold">
                      {(m.display_name || "?").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-navy-700 truncate">{m.display_name || "Sin nombre"}</div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${m.role === "admin" ? "bg-navy-100 text-navy-700" : "bg-safe-50 text-safe-900"}`}>
                      {m.role === "admin" ? "Admin" : "Protegido"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AlertRow({ alert, onResolve }: { alert: MemberAlert; onResolve: (id: string) => void }) {
  const danger = alert.risk_level === "dangerous";
  const when = new Date(alert.created_at).toLocaleString("es-CL", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
  return (
    <div className={`bg-white rounded-2xl shadow-card p-4 ${alert.resolved ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${danger ? "bg-brand-50" : "bg-warn-50"}`}>
          <AlertTriangle className={`w-5 h-5 ${danger ? "text-brand-500" : "text-warn-500"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-navy-700 truncate">{alert.member_name || "Protegido"}</span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${danger ? "bg-brand-500 text-white" : "bg-warn-500 text-white"}`}>
              {danger ? "Peligroso" : "Sospechoso"}
            </span>
          </div>
          <div className="text-xs text-navy-500 truncate mt-0.5" title={alert.url}>{alert.url}</div>
          <div className="text-[11px] text-navy-400 mt-0.5">{when}</div>
        </div>
      </div>
      {!alert.resolved && (
        <div className="flex gap-2 mt-3">
          <a
            href="tel:"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border-2 border-navy-700 text-navy-700 text-sm font-semibold"
          >
            <Phone className="w-3.5 h-3.5" /> Llamar
          </a>
          <button
            onClick={() => onResolve(alert.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-navy-700 text-white text-sm font-semibold"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Resolver
          </button>
        </div>
      )}
    </div>
  );
}

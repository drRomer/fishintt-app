"use client";

// =============================================================================
// Fishin't — Red Empresa / Familia Protegida (§2.4.1.b)
// =============================================================================
// El admin ve las alertas de sus protegidos para intervenir a tiempo. Tres
// decisiones de diseño que conviene no deshacer:
//
// 1. El protegido VE SUS PROPIAS ALERTAS. Que el admin sepa lo que te pasó y tú
//    no, no se sostiene: ni como producto (la alerta también es formativa para
//    quien casi cae) ni frente a la Ley 19.628.
// 2. El teléfono es OPCIONAL y lo entrega el propio titular, nunca el admin por
//    él. La UI no muestra los dígitos: el botón marca, no exhibe.
// 3. El admin no puede "salir" de su red —dejaría a los protegidos creyéndose
//    vigilados por nadie—; tiene que eliminarla, y eso borra todo en cascada.
// =============================================================================

import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeft, ShieldCheck, Users, Copy, Check, Phone, AlertTriangle,
  LogIn, Building2, Bell, CheckCircle2, Loader2, RefreshCw, UserMinus,
  Trash2, LogOut, PhoneOff, X,
} from "lucide-react";
import { isLoggedIn } from "@/lib/session";
import {
  networkAvailable, getMyNetwork, createNetwork, joinNetwork,
  getMembers, getAlerts, resolveAlert, getMyAlerts, setMyPhone,
  normalizarTelefono, leaveNetwork, removeMember, deleteNetwork,
  type MyNetwork, type NetworkMember, type MemberAlert,
} from "@/lib/network";

/** Cada cuánto se vuelven a pedir las alertas mientras la pestaña está visible. */
const INTERVALO_REFRESCO_MS = 30_000;

type Confirmacion =
  | { tipo: "salir" }
  | { tipo: "eliminarRed" }
  | { tipo: "eliminarMiembro"; miembro: NetworkMember };

export default function RedPage() {
  const [loading, setLoading] = useState(true);
  const [logged, setLogged] = useState(false);
  const [available, setAvailable] = useState(true);
  const [net, setNet] = useState<MyNetwork | null>(null);
  const [members, setMembers] = useState<NetworkMember[]>([]);
  const [alerts, setAlerts] = useState<MemberAlert[]>([]);
  const [myAlerts, setMyAlerts] = useState<MemberAlert[]>([]);

  const [mode, setMode] = useState<"crear" | "unirse" | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joinPhone, setJoinPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [refrescando, setRefrescando] = useState(false);
  const [ultimaSync, setUltimaSync] = useState<Date | null>(null);
  const [confirmacion, setConfirmacion] = useState<Confirmacion | null>(null);
  const [accionErr, setAccionErr] = useState<string | null>(null);

  // Evita que un refresco automático pise a uno que ya está en vuelo.
  const enVuelo = useRef(false);

  const refresh = useCallback(async (silencioso = false) => {
    if (enVuelo.current) return;
    enVuelo.current = true;
    if (silencioso) setRefrescando(true);
    else setLoading(true);
    try {
      const n = await getMyNetwork();
      setNet(n);
      if (n?.role === "admin") {
        const [ms, as] = await Promise.all([getMembers(n.id), getAlerts(n.id)]);
        setMembers(ms);
        setAlerts(as);
      } else if (n) {
        setMyAlerts(await getMyAlerts());
      }
      setUltimaSync(new Date());
    } finally {
      enVuelo.current = false;
      setRefrescando(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const l = isLoggedIn();
    setLogged(l);
    setAvailable(networkAvailable());
    if (!l) {
      setLoading(false);
      return;
    }
    refresh();
  }, [refresh]);

  // Las alertas llegan mientras el panel está abierto: una alerta que aparece
  // media hora tarde no sirve para intervenir a tiempo. Solo se consulta con la
  // pestaña visible, para no gastar red en segundo plano.
  useEffect(() => {
    if (!net) return;
    const tick = () => {
      if (document.visibilityState === "visible") refresh(true);
    };
    const id = window.setInterval(tick, INTERVALO_REFRESCO_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [net, refresh]);

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
    if (!res.ok) {
      setBusy(false);
      setErr(res.error || "No se pudo unir.");
      return;
    }
    // El teléfono va aparte y es opcional: si no se puede guardar, igual quedó
    // dentro de la red. No vale la pena bloquear el ingreso por esto.
    if (joinPhone.trim()) {
      const normalizado = normalizarTelefono(joinPhone);
      if (normalizado) await setMyPhone(normalizado);
    }
    setBusy(false);
    setMode(null);
    setCode("");
    setJoinName("");
    setJoinPhone("");
    await refresh();
  }

  async function handleResolve(id: string) {
    await resolveAlert(id);
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, resolved: true } : a)));
  }

  async function confirmar() {
    if (!confirmacion || !net) return;
    setBusy(true);
    setAccionErr(null);
    let res: { ok: boolean; error?: string };
    if (confirmacion.tipo === "salir") res = await leaveNetwork(net.id);
    else if (confirmacion.tipo === "eliminarRed") res = await deleteNetwork(net.id);
    else res = await removeMember(net.id, confirmacion.miembro.user_id);
    setBusy(false);
    if (!res.ok) {
      setAccionErr(res.error ?? "No se pudo completar la acción.");
      return;
    }
    setConfirmacion(null);
    if (confirmacion.tipo !== "eliminarMiembro") {
      setMembers([]);
      setAlerts([]);
      setMyAlerts([]);
    }
    await refresh();
  }

  function copyCode() {
    if (!net?.invite_code) return;
    navigator.clipboard?.writeText(net.invite_code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  // El teléfono del miembro que generó cada alerta, para que "Llamar" marque.
  const telefonoPorMiembro = new Map(
    members.filter((m) => m.phone).map((m) => [m.user_id, m.phone as string])
  );

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
                <label className="text-xs font-semibold text-navy-500 uppercase tracking-wide block pt-1">
                  Teléfono <span className="text-navy-300 normal-case font-normal">— opcional</span>
                </label>
                <input
                  value={joinPhone}
                  onChange={(e) => setJoinPhone(e.target.value)}
                  type="tel"
                  inputMode="tel"
                  placeholder="Ej: 9 1234 5678"
                  className="w-full px-3 py-3 bg-surface-alt border border-navy-100 rounded-xl text-navy-700 placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300"
                />
                <p className="text-[11px] text-navy-400 leading-relaxed">
                  Sirve solo para que el administrador pueda llamarte si detecta que estás a
                  punto de caer en una estafa. Lo ve únicamente él y puedes borrarlo cuando
                  quieras. Puedes unirte sin darlo.
                </p>
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

        {/* PROTEGIDO ------------------------------------------------------ */}
        {!loading && net && net.role === "protegido" && (
          <div className="space-y-5">
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

            <Link href="/analizar" className="block bg-navy-700 text-white font-semibold py-3.5 rounded-2xl text-center hover:bg-navy-800 transition-colors">
              Analizar un enlace
            </Link>

            {/* Mis alertas: lo mismo que ve el admin sobre mí */}
            <div>
              <EncabezadoSeccion
                icono={<Bell className="w-4 h-4 text-brand-500" />}
                titulo="Tus alertas"
                ultimaSync={ultimaSync}
                refrescando={refrescando}
                onRefrescar={() => refresh(true)}
              />
              <p className="text-xs text-navy-400 mb-3 px-1">
                Esto es exactamente lo que el administrador ve sobre ti.
              </p>
              {myAlerts.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-card p-6 text-center text-sm text-navy-400">
                  Todavía no se ha registrado ninguna alerta tuya.
                </div>
              ) : (
                <div className="space-y-2">
                  {myAlerts.map((a) => (
                    <AlertRow key={a.id} alert={a} />
                  ))}
                </div>
              )}
            </div>

            <TelefonoPropio onGuardado={() => refresh(true)} />

            <button
              onClick={() => { setConfirmacion({ tipo: "salir" }); setAccionErr(null); }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-navy-100 text-navy-500 font-semibold text-sm hover:bg-surface-alt transition-colors"
            >
              <LogOut className="w-4 h-4" /> Salir de la red
            </button>
          </div>
        )}

        {/* ADMIN ---------------------------------------------------------- */}
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
              <EncabezadoSeccion
                icono={<Bell className="w-4 h-4 text-brand-500" />}
                titulo="Alertas recientes"
                ultimaSync={ultimaSync}
                refrescando={refrescando}
                onRefrescar={() => refresh(true)}
              />
              {alerts.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-card p-6 text-center text-sm text-navy-400">
                  Sin alertas. Cuando un miembro analice un enlace de riesgo, aparecerá aquí.
                </div>
              ) : (
                <div className="space-y-2">
                  {alerts.map((a) => (
                    <AlertRow
                      key={a.id}
                      alert={a}
                      onResolve={handleResolve}
                      telefono={a.member_id ? telefonoPorMiembro.get(a.member_id) ?? null : null}
                    />
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
                  <div
                    key={m.user_id}
                    className={`flex items-center gap-3 px-4 py-3 ${i < members.length - 1 ? "border-b border-navy-50" : ""}`}
                  >
                    <div className="w-9 h-9 rounded-full bg-navy-700 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {(m.display_name || "?").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-navy-700 truncate">
                        {m.display_name || "Sin nombre"}
                      </div>
                      <div className="text-[11px] text-navy-400 flex items-center gap-1 mt-0.5">
                        {m.phone ? (
                          <><Phone className="w-3 h-3" /> Con teléfono</>
                        ) : (
                          <><PhoneOff className="w-3 h-3" /> Sin teléfono</>
                        )}
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full flex-shrink-0 ${m.role === "admin" ? "bg-navy-100 text-navy-700" : "bg-safe-50 text-safe-900"}`}>
                      {m.role === "admin" ? "Admin" : "Protegido"}
                    </span>
                    {m.role !== "admin" && (
                      <button
                        onClick={() => { setConfirmacion({ tipo: "eliminarMiembro", miembro: m }); setAccionErr(null); }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-navy-300 hover:text-brand-500 hover:bg-brand-50 transition-colors flex-shrink-0"
                        aria-label={`Eliminar a ${m.display_name || "este miembro"}`}
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Zona de riesgo */}
            <div className="border-t border-navy-50 pt-4">
              <button
                onClick={() => { setConfirmacion({ tipo: "eliminarRed" }); setAccionErr(null); }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-brand-200 text-brand-700 font-semibold text-sm hover:bg-brand-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Eliminar la red
              </button>
              <p className="text-[11px] text-navy-400 text-center mt-2 leading-relaxed">
                Como administrador no puedes salir dejando la red sin responsable: eliminarla
                desvincula a todos y borra sus alertas y teléfonos.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Confirmaciones --------------------------------------------------- */}
      {confirmacion && (
        <DialogoConfirmacion
          confirmacion={confirmacion}
          busy={busy}
          error={accionErr}
          onCancelar={() => setConfirmacion(null)}
          onConfirmar={confirmar}
        />
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------

function EncabezadoSeccion({
  icono, titulo, ultimaSync, refrescando, onRefrescar,
}: {
  icono: React.ReactNode;
  titulo: string;
  ultimaSync: Date | null;
  refrescando: boolean;
  onRefrescar: () => void;
}) {
  return (
    <div className="flex items-center gap-2 mb-3 px-1">
      {icono}
      <h2 className="font-bold text-navy-700 flex-1">{titulo}</h2>
      {ultimaSync && (
        <span className="text-[11px] text-navy-400">
          {ultimaSync.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
        </span>
      )}
      <button
        onClick={onRefrescar}
        disabled={refrescando}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-navy-400 hover:text-navy-700 hover:bg-surface-alt transition-colors disabled:opacity-50"
        aria-label="Actualizar alertas"
      >
        <RefreshCw className={`w-4 h-4 ${refrescando ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
}

/** Gestión del teléfono propio: darlo, cambiarlo o borrarlo. */
function TelefonoPropio({ onGuardado }: { onGuardado: () => void }) {
  const [abierto, setAbierto] = useState(false);
  const [valor, setValor] = useState("");
  const [estado, setEstado] = useState<"idle" | "guardando" | "ok" | "error">("idle");

  async function guardar(borrar = false) {
    setEstado("guardando");
    const telefono = borrar ? null : normalizarTelefono(valor);
    if (!borrar && !telefono) {
      setEstado("error");
      return;
    }
    const ok = await setMyPhone(telefono);
    setEstado(ok ? "ok" : "error");
    if (ok) {
      setValor("");
      setAbierto(false);
      onGuardado();
    }
  }

  if (!abierto) {
    return (
      <button
        onClick={() => { setAbierto(true); setEstado("idle"); }}
        className="w-full flex items-center gap-3 bg-white rounded-2xl p-4 shadow-card hover:shadow-card-hover transition-shadow text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-navy-50 flex items-center justify-center flex-shrink-0">
          <Phone className="w-5 h-5 text-navy-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-navy-700 text-sm">Tu teléfono de contacto</div>
          <div className="text-xs text-navy-400 mt-0.5">
            Opcional. Permite que el administrador te llame ante una alerta.
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-navy-700 text-sm">Tu teléfono de contacto</h3>
        <button
          onClick={() => setAbierto(false)}
          className="w-8 h-8 flex items-center justify-center text-navy-400 hover:text-navy-700 rounded-lg hover:bg-surface-alt"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <input
        value={valor}
        onChange={(e) => { setValor(e.target.value); setEstado("idle"); }}
        type="tel"
        inputMode="tel"
        placeholder="Ej: 9 1234 5678"
        className="w-full px-3 py-3 bg-surface-alt border border-navy-100 rounded-xl text-navy-700 placeholder-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-300"
      />
      <p className="text-[11px] text-navy-400 leading-relaxed">
        Solo lo ve el administrador de tu red, y solo para llamarte si detecta que estás a
        punto de entregar tus datos. No se muestra en pantalla ni se comparte con nadie más.
      </p>
      {estado === "error" && (
        <div className="text-sm text-brand-700 bg-brand-50 rounded-lg px-3 py-2">
          Revisa el número: faltan dígitos o tiene caracteres que no corresponden.
        </div>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => guardar(true)}
          disabled={estado === "guardando"}
          className="flex-1 py-3 rounded-xl bg-surface-alt text-navy-700 font-semibold text-sm disabled:opacity-50"
        >
          Borrar el mío
        </button>
        <button
          onClick={() => guardar(false)}
          disabled={estado === "guardando" || !valor.trim()}
          className="flex-[2] py-3 rounded-xl bg-navy-700 text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {estado === "guardando" && <Loader2 className="w-4 h-4 animate-spin" />} Guardar
        </button>
      </div>
    </div>
  );
}

function DialogoConfirmacion({
  confirmacion, busy, error, onCancelar, onConfirmar,
}: {
  confirmacion: Confirmacion;
  busy: boolean;
  error: string | null;
  onCancelar: () => void;
  onConfirmar: () => void;
}) {
  const textos = {
    salir: {
      titulo: "¿Salir de la red?",
      cuerpo:
        "Dejarás de estar protegido: el administrador ya no recibirá alertas si analizas un enlace peligroso. También se borran tus alertas anteriores y tu teléfono, si lo diste.",
      boton: "Salir de la red",
    },
    eliminarRed: {
      titulo: "¿Eliminar la red?",
      cuerpo:
        "Se desvincula a todos los miembros y se borran sus alertas y teléfonos. El código de invitación deja de servir. No se puede deshacer.",
      boton: "Eliminar la red",
    },
    eliminarMiembro: {
      titulo: "¿Eliminar a este miembro?",
      cuerpo:
        "Dejará de estar protegido y se borran sus alertas y su teléfono. Puede volver a unirse con el código de invitación.",
      boton: "Eliminar",
    },
  }[confirmacion.tipo];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-card-hover w-full max-w-sm p-5 fade-in">
        <h2 className="text-lg font-bold text-navy-700">{textos.titulo}</h2>
        {confirmacion.tipo === "eliminarMiembro" && (
          <p className="text-sm font-semibold text-navy-700 mt-1">
            {confirmacion.miembro.display_name || "Sin nombre"}
          </p>
        )}
        <p className="text-sm text-navy-500 mt-2 leading-relaxed">{textos.cuerpo}</p>
        {error && (
          <div className="text-sm text-brand-700 bg-brand-50 rounded-lg px-3 py-2 mt-3">{error}</div>
        )}
        <div className="flex gap-2 mt-5">
          <button
            onClick={onCancelar}
            disabled={busy}
            className="flex-1 py-3 rounded-xl bg-surface-alt text-navy-700 font-semibold text-sm disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={busy}
            className="flex-1 py-3 rounded-xl bg-brand-500 text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} {textos.boton}
          </button>
        </div>
      </div>
    </div>
  );
}

function AlertRow({
  alert, onResolve, telefono,
}: {
  alert: MemberAlert;
  /** Solo el admin resuelve. Sin esta prop la fila es de solo lectura. */
  onResolve?: (id: string) => void;
  telefono?: string | null;
}) {
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
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${danger ? "bg-brand-500 text-white" : "bg-warn-500 text-white"}`}>
              {danger ? "Peligroso" : "Sospechoso"}
            </span>
          </div>
          <div className="text-xs text-navy-500 truncate mt-0.5" title={alert.url}>{alert.url}</div>
          <div className="text-[11px] text-navy-400 mt-0.5">
            {when}
            {alert.resolved && " · resuelta"}
          </div>
        </div>
      </div>

      {onResolve && !alert.resolved && (
        <div className="flex gap-2 mt-3">
          {telefono ? (
            // El número no se imprime en pantalla: el botón marca, no exhibe.
            <a
              href={`tel:${telefono}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border-2 border-navy-700 text-navy-700 text-sm font-semibold hover:bg-surface-alt transition-colors"
            >
              <Phone className="w-3.5 h-3.5" /> Llamar
            </a>
          ) : (
            <div
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border-2 border-navy-100 text-navy-300 text-sm font-semibold cursor-not-allowed"
              title="Esta persona no registró un teléfono"
            >
              <PhoneOff className="w-3.5 h-3.5" /> Sin teléfono
            </div>
          )}
          <button
            onClick={() => onResolve(alert.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-navy-700 text-white text-sm font-semibold hover:bg-navy-800 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Resolver
          </button>
        </div>
      )}
    </div>
  );
}

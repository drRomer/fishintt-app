// =============================================================================
// Fishin't — Red Empresa / Familia Protegida (cliente)
// =============================================================================
// Helpers sobre las RPCs SECURITY DEFINER de supabase/protected_networks.sql.
// Requiere cuenta real (Supabase). En modo demo (getSupabase() === null) las
// funciones devuelven null/estado no disponible: la UI muestra un aviso.
// =============================================================================

import { getSupabase } from "./supabase";
import { getStoredUser } from "./session";
import type { RiskLevel } from "./analysis";

export interface MyNetwork {
  id: string;
  name: string;
  invite_code: string | null; // solo visible para el admin
  role: "admin" | "protegido";
  admin_id: string;
  member_count: number;
}

export interface NetworkMember {
  user_id: string;
  role: "admin" | "protegido";
  display_name: string | null;
  /** Solo lo recibe el admin de la red, y solo si el titular lo dio. */
  phone: string | null;
  created_at: string;
}

export interface MemberAlert {
  id: string;
  network_id: string;
  member_id: string | null;
  member_name: string | null;
  url: string;
  risk_level: RiskLevel;
  resolved: boolean;
  created_at: string;
}

// ¿La función está disponible? (requiere Supabase real, no modo demo)
export function networkAvailable(): boolean {
  return getSupabase() !== null;
}

export async function getMyNetwork(): Promise<MyNetwork | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("get_my_network");
  const rows = (data as MyNetwork[] | null) ?? [];
  if (error || rows.length === 0) return null;
  return rows[0];
}

export async function createNetwork(name: string): Promise<MyNetwork | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { error } = await supabase.rpc("create_protected_network", { p_name: name });
  if (error) return null;
  return getMyNetwork(); // re-lee para traer rol, código y conteo
}

export async function joinNetwork(
  code: string,
  name: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "Necesitas una cuenta real para unirte." };
  const { error } = await supabase.rpc("join_protected_network", {
    p_code: code,
    p_name: name,
  });
  if (error) {
    const msg = error.message || "";
    return { ok: false, error: msg.includes("lido") ? "Código inválido" : msg };
  }
  return { ok: true };
}

export async function getMembers(networkId: string): Promise<NetworkMember[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("get_network_members", { p_network_id: networkId });
  if (error) return [];
  return (data as NetworkMember[] | null) ?? [];
}

export async function getAlerts(networkId: string): Promise<MemberAlert[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("get_network_alerts", { p_network_id: networkId });
  if (error) return [];
  return (data as MemberAlert[] | null) ?? [];
}

// Registra una alerta cuando un protegido analiza un enlace de riesgo.
// Best-effort: si falla o no hay red, no interrumpe el análisis.
export async function recordAlert(url: string, risk: RiskLevel): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    const name = getStoredUser()?.name ?? null;
    await supabase.rpc("record_member_alert", { p_url: url, p_risk: risk, p_name: name });
  } catch {
    /* silencioso */
  }
}

export async function resolveAlert(alertId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.rpc("resolve_member_alert", { p_alert_id: alertId });
}

// Las alertas del propio usuario. Si el admin ve lo que te pasó, tú también.
export async function getMyAlerts(): Promise<MemberAlert[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("get_my_alerts");
  if (error) return [];
  return (data as MemberAlert[] | null) ?? [];
}

// -----------------------------------------------------------------------------
// Teléfono de contacto (opcional)
// -----------------------------------------------------------------------------

/**
 * Normaliza un teléfono chileno a formato marcable. Deliberadamente conservador:
 * si no reconoce el patrón, devuelve lo escrito sin separadores en vez de
 * rechazarlo. Preferimos guardar un número raro pero correcto a bloquear a
 * alguien por un formato que no previmos.
 */
export function normalizarTelefono(raw: string): string | null {
  const limpio = raw.trim().replace(/[\s().-]/g, "");
  if (!limpio) return null;
  const masPrefijo = limpio.startsWith("+");
  const digitos = limpio.replace(/\D/g, "");
  if (digitos.length < 8) return null; // demasiado corto para ser un teléfono
  if (masPrefijo) return "+" + digitos;
  if (digitos.length === 11 && digitos.startsWith("56")) return "+" + digitos;
  if (digitos.length === 9) return "+56" + digitos; // móvil o fijo con código
  return digitos;
}

/** Guarda MI teléfono en todas mis membresías. `null` o vacío lo borra. */
export async function setMyPhone(phone: string | null): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase.rpc("set_my_phone", { p_phone: phone });
  return !error;
}

// -----------------------------------------------------------------------------
// Salir / eliminar
// -----------------------------------------------------------------------------

export async function leaveNetwork(
  networkId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "No disponible en modo demo." };
  const { error } = await supabase.rpc("leave_protected_network", {
    p_network_id: networkId,
  });
  if (error) return { ok: false, error: error.message || "No se pudo salir de la red." };
  return { ok: true };
}

export async function removeMember(
  networkId: string,
  userId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "No disponible en modo demo." };
  const { error } = await supabase.rpc("remove_network_member", {
    p_network_id: networkId,
    p_user_id: userId,
  });
  if (error) return { ok: false, error: error.message || "No se pudo eliminar al miembro." };
  return { ok: true };
}

export async function deleteNetwork(
  networkId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "No disponible en modo demo." };
  const { error } = await supabase.rpc("delete_protected_network", {
    p_network_id: networkId,
  });
  if (error) return { ok: false, error: error.message || "No se pudo eliminar la red." };
  return { ok: true };
}

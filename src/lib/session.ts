// =============================================================================
// Fishin't — Estado de sesión (cuenta opcional)
// =============================================================================
// La app es de "entrada libre": analizar, aprender y reportar funcionan sin
// cuenta. La cuenta es OPCIONAL y solo se exige para funciones ligadas a la
// identidad (soporte humano/telefónico y, a futuro, Wallet y Red Protegida).
//
// Fuente de verdad de "hay cuenta activa": sessionStorage "fishintt_user", que
// el login (real o demo) escribe y el logout borra. Un invitado que entra libre
// nunca lo escribe, por lo que isLoggedIn() es false.
// =============================================================================

export interface StoredUser {
  name?: string;
  email?: string;
  phone?: string;
}

const USER_KEY = "fishintt_user";

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw);
    return u && typeof u === "object" ? u : null;
  } catch {
    return null;
  }
}

// Hay cuenta activa cuando existe un usuario con correo (el invitado no lo tiene).
export function isLoggedIn(): boolean {
  const u = getStoredUser();
  return !!(u && u.email);
}

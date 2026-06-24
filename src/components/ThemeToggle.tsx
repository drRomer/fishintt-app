"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

// Botón flotante para cambiar de tema, visible en todas las pantallas.
// Se ancla al borde derecho del "marco" de 480px (no al borde del viewport).
export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <div className="fixed inset-x-0 bottom-20 z-50 pointer-events-none">
      <div className="max-w-[480px] mx-auto relative">
        <button
          onClick={toggleTheme}
          aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          className="pointer-events-auto absolute right-4 w-11 h-11 rounded-full bg-navy-700 text-white shadow-card-hover flex items-center justify-center hover:bg-navy-800 transition-colors"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Flag, User, Shield, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/home", icon: Home, label: "Inicio" },
  { href: "/analizar", icon: Shield, label: "Analizar" },
  { href: "/educacion", icon: BookOpen, label: "Aprende" },
  { href: "/reportar", icon: Flag, label: "Reportar" },
  { href: "/perfil", icon: User, label: "Perfil" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 bg-white border-t border-navy-100 shadow-nav safe-bottom z-40">
      <div className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/home" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-1.5 rounded-lg transition-colors",
                active ? "text-navy-700" : "text-navy-400 hover:text-navy-600"
              )}
            >
              <Icon className={cn("w-5 h-5", active && "stroke-[2.5]")} />
              <span className={cn("text-[10px] font-medium", active && "font-semibold")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

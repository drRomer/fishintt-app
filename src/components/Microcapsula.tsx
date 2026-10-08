"use client";

// =============================================================================
// Fishin't — Microcápsula formativa tras una alerta
// =============================================================================
// Se muestra bajo el resultado del analizador cuando el veredicto NO es seguro
// (paso 6 del flujo principal, §5.1). Desarrolla el indicador que se detectó en
// ESE enlace y cierra con un ejercicio que alimenta el componente C del CRD.
//
// La presentación vive en <CapsulaFormativa>, compartida con la Cyber-Academy:
// acá solo se elige la cápsula del indicador dominante, se saca la evidencia
// del enlace real y se ofrece el nivel de la Academy donde seguir.
// =============================================================================

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { AnalysisResult } from "@/lib/analysis";
import { seleccionarMicrocapsula } from "@/lib/data/microcapsulas";
import { nivelDeIndicador, getNivel } from "@/lib/data/academia";
import { idEjercicioCapsula } from "@/lib/academia";
import { registrarEjercicio, yaRespondido } from "@/lib/ejercicios";
import { CapsulaFormativa } from "@/components/Capsula";

export function Microcapsula({ result }: { result: AnalysisResult }) {
  const capsula = seleccionarMicrocapsula(result);
  if (!capsula) return null;

  const ejercicioId = idEjercicioCapsula(capsula.id);
  const nivel = getNivel(nivelDeIndicador(capsula.id));

  // Aquí NO se revela el estado previo: la intervención ocurre en el momento
  // crítico y volver a plantear la pregunta refuerza. Solo el primer intento
  // cuenta para el CRD, de eso se encarga registrarEjercicio.
  function alResponder(correcto: boolean) {
    if (!yaRespondido(ejercicioId)) {
      registrarEjercicio(ejercicioId, capsula!.pregunta.nivel, correcto);
    }
  }

  return (
    <div className="mt-4">
      <CapsulaFormativa
        capsula={capsula}
        evidencia={capsula.evidencia(result)}
        etiqueta="Aprende de este caso"
        onResponder={alResponder}
        pie={
          nivel && (
            <Link
              href={`/academia/${nivel.id}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 hover:underline"
            >
              Seguir aprendiendo: Nivel {nivel.numero}, {nivel.nombre}
              <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
            </Link>
          )
        }
      />
    </div>
  );
}

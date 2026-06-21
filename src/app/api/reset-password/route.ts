import { getSupabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Si no hay Supabase configurado (modo demo), retornar éxito simulado
    if (!supabase) {
      console.log(`[DEMO] Reset password email sent to: ${email}`);
      return NextResponse.json(
        { 
          success: true,
          message: "Email de recuperación enviado (modo demo)",
          email 
        },
        { status: 200 }
      );
    }

    // Enviar enlace de recuperación con Supabase
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password-confirm`,
    });

    if (error) {
      console.error("Supabase reset error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: true,
        message: "Email de recuperación enviado",
        email 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password API error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Fishin't — Tu escudo contra el phishing",
  description: "Protección en tiempo real contra estafas digitales y phishing en Chile. Detecta enlaces maliciosos, aprende a identificar fraudes y reporta amenazas.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Fishin't",
  },
  icons: {
    // El SVG primero para los navegadores que lo soportan; el PNG de 32 es el
    // respaldo. El apple-touch-icon va aparte y debe ser PNG opaco: iOS no
    // acepta SVG y rellena de negro cualquier transparencia.
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
};

export const viewport: Viewport = {
  themeColor: "#1A2657",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

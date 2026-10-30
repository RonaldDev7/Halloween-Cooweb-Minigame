import type { Metadata, Viewport } from "next";
import "./globals.css";
import { GameProvider } from "@/context/GameContext";

export const metadata: Metadata = {
  title: "COOWEB — THE LAST PROTOCOL [2041]",
  description:
    "Videojuego de terror y supervivencia en 2.5D. Escapa de las instalaciones subterráneas de CooWeb y sobrevive a Ronald antes de que E.V.A. selle el búnker.",
  keywords: ["CooWeb", "The Last Protocol", "Ronald", "E.V.A.", "Survival Horror", "Next.js", "GSAP", "Supabase"],
  authors: [{ name: "CooWeb Bio-Defense Network" }],
  icons: {
    icon: "/images/cooweb-logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#09080A",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark select-none">
      <body className="bg-[#09080A] text-[#F5F3F2] antialiased overflow-hidden">
        <GameProvider>{children}</GameProvider>
      </body>
    </html>
  );
}

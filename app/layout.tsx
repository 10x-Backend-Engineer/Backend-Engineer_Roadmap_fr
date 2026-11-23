import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { ProgressProvider } from "@/components/progress";
import { exerciseIds, lessonIds } from "@/data/domains";
import { systems } from "@/data/systems";
import { planFor } from "@/data/system-plans";
import { weekly } from "@/data/weekly";

export const metadata: Metadata = {
  title: "Backend Engineer — Roadmap 24 semaines",
  description:
    "Roadmap complète pour devenir Backend Engineer : 11 domaines, 44 modules, ressources, exercices pratiques et suivi de progression.",
};

export const viewport: Viewport = {
  themeColor: "#07080b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const total =
    lessonIds.length +
    exerciseIds.length +
    systems.reduce((acc, s) => acc + (planFor(s.slug)?.todos.length ?? s.steps.length), 0) +
    weekly.length;
  return (
    <html lang="fr">
      <body>
        <ProgressProvider total={total}>
          <div className="shell">
            <Sidebar />
            <main className="main">{children}</main>
          </div>
        </ProgressProvider>
      </body>
    </html>
  );
}

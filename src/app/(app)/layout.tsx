import { BottomNav } from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell flex flex-col bg-surface-alt min-h-screen">
      <main className="flex-1 pb-4">{children}</main>
      <BottomNav />
    </div>
  );
}

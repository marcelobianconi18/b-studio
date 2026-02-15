import LiquidShell from "@/components/LiquidShell";

export default function Dashboard() {
    return (
        <LiquidShell title="DASHBOARD" subtitle="COMANDO CENTRAL B-STUDIO">
            {/* Empty Content Area */}
            <div className="flex-1 flex items-center justify-center text-zinc-500/20 text-4xl font-black uppercase tracking-tighter mix-blend-overlay">
                B-Studio Central Command
            </div>
        </LiquidShell>
    );
}

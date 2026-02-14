import TrueRoiDashboard from "@/components/TrueRoiDashboard";
import GuardianTerminal from "@/components/GuardianTerminal";
import ConnectivityStatus from "@/components/ConnectivityStatus";
import UnifiedInboxPreview from "@/components/UnifiedInboxPreview";
import ActionCenter from "@/components/ActionCenter"; // Keeping it as an option or 3rd item

export default function Dashboard() {
    return (
        <div className="p-8 h-screen flex flex-col overflow-hidden bg-[#050505]">
            {/* Header / Top Bar */}
            <header className="flex justify-between items-center mb-8 shrink-0">
                <div>
                    <h1 className="text-3xl font-black italic tracking-tighter text-white">MISSION CONTROL</h1>
                    <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold">Comando Central B-Studio</p>
                </div>

                <div className="flex items-center gap-6">
                    <ConnectivityStatus />

                    {/* Date Picker Mock */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-xs font-bold text-zinc-400 cursor-pointer hover:bg-zinc-800 hover:text-white transition-colors">
                        Hoje vs Ontem
                    </div>
                </div>
            </header>

            {/* Main Grid: 2 Columns (2/3 Finance, 1/3 Action) */}
            <div className="flex-1 grid grid-cols-12 gap-8 min-h-0">

                {/* Left Column: Financial Intelligence (8 cols = 66%) */}
                <div className="col-span-8 flex flex-col gap-6">
                    <div className="flex-1 min-h-0">
                        <TrueRoiDashboard />
                    </div>
                </div>

                {/* Right Column: AI & Action (4 cols = 33%) */}
                <div className="col-span-4 flex flex-col gap-6 overflow-y-auto pr-2 scrollbar-hide">

                    {/* 1. Guardian Terminal (The "Live" feel) */}
                    <div className="shrink-0">
                        <GuardianTerminal />
                    </div>

                    {/* 2. Unified Inbox Preview (Quick Action) */}
                    <div className="shrink-0">
                        <UnifiedInboxPreview />
                    </div>

                    {/* 3. Action Center (Approvals - Keeping it accessible) */}
                    <div className="h-[250px] shrink-0">
                        <ActionCenter />
                    </div>
                </div>
            </div>
        </div>
    );
}

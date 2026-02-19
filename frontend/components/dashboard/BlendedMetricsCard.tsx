import { ArrowTrendingDownIcon, ArrowTrendingUpIcon, BanknotesIcon, CurrencyDollarIcon } from "@heroicons/react/24/solid";

export default function BlendedMetricsCard() {
    return (
        <div
            className="h-full w-full rounded-3xl p-6 shadow-sm border flex flex-col justify-between group hover:border-[#83A2DB]/30 transition-all duration-300"
            style={{ backgroundColor: "var(--shell-surface)", borderColor: "var(--shell-border)" }}
        >
            {/* Header / Blended Metric */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">Cofre (Blended)</h2>
                    <h1 className="text-xl font-black tracking-tighter" style={{ color: "var(--foreground)" }}>RESUMO DE TRÁFEGO</h1>
                </div>
                <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-500/20">
                    ROAS 3.4x
                </div>
            </div>

            {/* Sparkline (Simulated) */}
            <div className="relative h-16 w-full mb-6 overflow-hidden rounded-xl bg-gradient-to-b from-[#83A2DB]/5 to-transparent border border-[#83A2DB]/10">
                <svg className="absolute bottom-0 left-0 w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                    <path d="M0 15 L10 12 L20 16 L30 8 L40 10 L50 5 L60 8 L70 2 L80 6 L90 4 L100 0" fill="none" stroke="#83A2DB" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                    <path d="M0 15 L10 12 L20 16 L30 8 L40 10 L50 5 L60 8 L70 2 L80 6 L90 4 L100 0 V 20 H 0 Z" fill="#83A2DB" fillOpacity="0.1" />
                </svg>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 gap-4">
                <div
                    className="p-3 rounded-xl border space-y-1"
                    style={{ backgroundColor: "var(--shell-side)", borderColor: "var(--shell-border)" }}
                >
                    <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Gasto Hoje</p>
                    <p className="text-lg font-black text-rose-500">R$ 1.250</p>
                    <div className="flex gap-1 text-[8px] text-zinc-500">
                        <span className="text-blue-400">FB: 800</span> • <span className="text-orange-400">GG: 450</span>
                    </div>
                </div>

                <div
                    className="p-3 rounded-xl border space-y-1"
                    style={{ backgroundColor: "var(--shell-side)", borderColor: "var(--shell-border)" }}
                >
                    <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Receita Hoje</p>
                    <p className="text-lg font-black text-emerald-500">R$ 4.250</p>
                    <div className="flex items-center gap-1 text-[9px] text-emerald-500/70 font-bold">
                        <ArrowTrendingUpIcon className="w-3 h-3" />
                        <span>+15% vs Ontem</span>
                    </div>
                </div>
            </div>

            <div
                className="mt-4 pt-4 border-t flex justify-between items-center"
                style={{ borderColor: "var(--shell-border)" }}
            >
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Custo p/ Cliente (NC-CPA)</span>
                <span className="text-sm font-black" style={{ color: "var(--foreground)" }}>R$ 45,00</span>
            </div>
        </div>
    );
}

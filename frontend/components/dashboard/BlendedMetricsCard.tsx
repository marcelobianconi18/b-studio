import { ArrowTrendingDownIcon, ArrowTrendingUpIcon, BanknotesIcon, CurrencyDollarIcon } from "@heroicons/react/24/solid";

export default function BlendedMetricsCard() {
    return (
        <div className="h-full w-full p-6 flex flex-col justify-between group transition-all duration-300 bento-cell hover-spring">
            {/* Header / Blended Metric */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-[var(--muted)] text-xs font-bold uppercase tracking-widest mb-1">Cofre (Blended)</h2>
                    <h1 className="text-xl font-black tracking-tighter text-[var(--foreground)]">RESUMO DE TRÁFEGO</h1>
                </div>
                <div className="bg-[white]/10 text-[white] px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-[white]/20 shadow-sm">
                    ROAS 3.4x
                </div>
            </div>

            {/* Sparkline (Simulated) */}
            <div className="relative h-16 w-full mb-6 overflow-hidden rounded-xl bg-gradient-to-b from-[var(--muted)]/20 to-transparent border border-[var(--muted)]/10">
                <svg className="absolute bottom-0 left-0 w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                    <path d="M0 15 L10 12 L20 16 L30 8 L40 10 L50 5 L60 8 L70 2 L80 6 L90 4 L100 0" fill="none" stroke="var(--muted)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                    <path d="M0 15 L10 12 L20 16 L30 8 L40 10 L50 5 L60 8 L70 2 L80 6 L90 4 L100 0 V 20 H 0 Z" fill="var(--muted)" fillOpacity="0.1" />
                </svg>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 gap-4">
                <div
                    className="p-3 rounded-xl border space-y-1"
                    style={{ backgroundColor: "var(--shell-side)", borderColor: "var(--shell-border)" }}
                >
                    <p className="text-[10px] uppercase font-bold text-[var(--muted)] tracking-widest">Gasto Hoje</p>
                    <p className="text-lg font-black text-[white]">R$ 1.250</p>
                    <div className="flex gap-1 text-[8px] text-[var(--muted)]">
                        <span className="text-[var(--foreground)]">FB: 800</span> • <span className="text-orange-400">GG: 450</span>
                    </div>
                </div>

                <div
                    className="p-3 rounded-xl border space-y-1"
                    style={{ backgroundColor: "var(--shell-side)", borderColor: "var(--shell-border)" }}
                >
                    <p className="text-[10px] uppercase font-bold text-[var(--muted)] tracking-widest">Receita Hoje</p>
                    <p className="text-lg font-black text-[white]">R$ 4.250</p>
                    <div className="flex items-center gap-1 text-[9px] text-[white]/70 font-bold">
                        <ArrowTrendingUpIcon className="w-3 h-3" />
                        <span>+15% vs Ontem</span>
                    </div>
                </div>
            </div>

            <div
                className="mt-4 pt-4 border-t flex justify-between items-center"
                style={{ borderColor: "var(--shell-border)" }}
            >
                <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest">Custo p/ Cliente (NC-CPA)</span>
                <span className="text-sm font-black text-[var(--foreground)]">R$ 45,00</span>
            </div>
        </div>
    );
}

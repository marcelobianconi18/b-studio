import { ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon, StarIcon } from "@heroicons/react/24/solid";

export default function PlanStatusCard() {
    return (
        <div
            className="h-full w-full rounded-3xl p-6 shadow-sm border flex flex-col justify-between group hover:border-[#83A2DB]/30 transition-all duration-300 relative overflow-hidden"
            style={{ backgroundColor: "var(--shell-surface)", borderColor: "var(--shell-border)" }}
        >
            {/* Header / Plan Title & Price */}
            <div>
                <div className="flex justify-between items-start mb-1">
                    <h2 className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Status do Plano</h2>
                    <div className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border border-emerald-500/20 flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_currentColor]"></span>
                        Ativo
                    </div>
                </div>
                <div className="flex flex-col">
                    <h1 className="text-3xl font-black tracking-tighter leading-none" style={{ color: "var(--foreground)" }}>ENTERPRISE</h1>
                    <div className="flex items-baseline gap-1 mt-1 opacity-60">
                        <span className="text-sm font-medium tracking-tight" style={{ color: "var(--foreground)" }}>R$ 278,90</span>
                        <span className="text-[10px] uppercase font-bold text-zinc-400">/ mês</span>
                    </div>
                </div>
            </div>

            {/* Progress Bar (Renovation) */}
            <div className="space-y-1.5 my-1">
                <div className="flex justify-between text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                    <span>Renovação</span>
                    <span className="font-bold flex items-center gap-1" style={{ color: "var(--foreground)" }}>
                        <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                        12 dias
                    </span>
                </div>
                <div className="h-1 w-full bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[70%] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)] relative">
                        <div className="absolute inset-0 bg-white/20"></div>
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid gap-3">
                <div
                    className="p-3.5 rounded-2xl backdrop-blur-sm border-0 ring-1 ring-inset ring-[var(--shell-border)] space-y-2 relative overflow-hidden"
                    style={{ backgroundColor: "var(--shell-side)" }}
                >
                    <div className="relative z-10 flex items-center gap-2 mb-1">
                        <div className="p-1 rounded-md bg-[#83A2DB]/10">
                            <StarIcon className="w-3 h-3 text-[#83A2DB]" />
                        </div>
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Total Gerido</span>
                    </div>
                    <p className="relative z-10 text-xl font-black tracking-tight" style={{ color: "var(--foreground)" }}>R$ 450k</p>
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#83A2DB]/5 rounded-full blur-2xl pointer-events-none"></div>
                </div>

                <div className="p-3.5 bg-emerald-500/5 rounded-2xl ring-1 ring-inset ring-emerald-500/10 space-y-1 relative overflow-hidden group/eco">
                    <div className="flex justify-between items-center relative z-10">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Economia Guardião</span>
                    </div>
                    <p className="relative z-10 text-2xl font-black text-emerald-500 tracking-tight">R$ 4.300</p>
                    <p className="relative z-10 text-[9px] text-emerald-600/60 dark:text-emerald-400/60 font-medium">Poupados este mês</p>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover/eco:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none"></div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
                <button
                    className="flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl shadow-black/5 dark:shadow-white/5 relative overflow-hidden group/btn"
                    style={{ backgroundColor: "var(--foreground)", color: "var(--background)" }}
                >
                    <span className="relative z-10">Gerar Pagamento</span>
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                </button>
                <button
                    className="px-5 py-3.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--shell-border)] active:scale-95 transition-all text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                    Faturas
                </button>
            </div>
        </div>
    );
}

import { ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon, StarIcon } from "@heroicons/react/24/solid";

export default function PlanStatusCard() {
    return (
        <div className="h-full w-full p-6 flex flex-col justify-between group transition-all duration-300 bento-cell hover-spring overflow-hidden">
            {/* Header / Plan Title & Price */}
            <div>
                <div className="flex justify-between items-start mb-1">
                    <h2 className="text-[var(--muted)] text-[10px] font-bold uppercase tracking-widest">Status do Plano</h2>
                    <div className="bg-[white]/10 text-[white] px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border border-[white]/20 flex items-center gap-1.5 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-[white] animate-pulse shadow-[0_0_5px_currentColor]"></span>
                        Ativo
                    </div>
                </div>
                <div className="flex flex-col">
                    <h1 className="text-3xl font-black tracking-tighter leading-none" style={{ color: "var(--foreground)" }}>ENTERPRISE</h1>
                    <div className="flex items-baseline gap-1 mt-1 opacity-60">
                        <span className="text-sm font-medium tracking-tight" style={{ color: "var(--foreground)" }}>R$ 278,90</span>
                        <span className="text-[10px] uppercase font-bold text-[var(--muted)]">/ mês</span>
                    </div>
                </div>
            </div>

            {/* Progress Bar (Renovation) */}
            <div className="space-y-1.5 my-1">
                <div className="flex justify-between text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">
                    <span>Renovação</span>
                    <span className="font-bold flex items-center gap-1 text-[var(--foreground)]">
                        <span className="w-1 h-1 rounded-full bg-[white]"></span>
                        12 dias
                    </span>
                </div>
                <div className="h-1 w-full bg-[var(--accent-primary)] dark:bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-[white] w-[70%] rounded-full shadow-sm relative">
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
                        <div className="p-1 rounded-md bg-[var(--muted)]/10">
                            <StarIcon className="w-3 h-3 text-[var(--muted)]" />
                        </div>
                        <span className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest">Total Gerido</span>
                    </div>
                    <p className="relative z-10 text-xl font-black tracking-tight text-[var(--foreground)]">R$ 450k</p>
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[var(--muted)]/20 rounded-full blur-2xl pointer-events-none"></div>
                </div>

                <div className="p-3.5 bg-[white]/5 rounded-2xl ring-1 ring-inset ring-[white]/20 space-y-1 relative overflow-hidden group/eco">
                    <div className="flex justify-between items-center relative z-10">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[white]">Economia Guardião</span>
                    </div>
                    <p className="relative z-10 text-2xl font-black text-[white] tracking-tight">R$ 4.300</p>
                    <p className="relative z-10 text-[9px] text-[white]/60 font-medium">Poupados este mês</p>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover/eco:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none"></div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
                <button
                    className="flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl shadow-[var(--muted)]/20 relative overflow-hidden group/btn text-[var(--foreground)]"
                    style={{ backgroundColor: "var(--muted)" }}
                >
                    <span className="relative z-10">Gerar Pagamento</span>
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                </button>
                <button
                    className="px-5 py-3.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--shell-border)] active:scale-95 transition-all text-[var(--muted)] hover:text-[var(--foreground)] dark:hover:text-[var(--foreground)]"
                >
                    Faturas
                </button>
            </div>
        </div>
    );
}

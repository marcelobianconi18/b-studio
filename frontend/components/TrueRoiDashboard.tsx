"use client";

import { useState, useEffect } from "react";
import {
    BanknotesIcon,
    CalculatorIcon,
    ArrowTrendingUpIcon,
    ExclamationTriangleIcon,
    CurrencyDollarIcon,
    ChartBarIcon
} from "@heroicons/react/24/outline";

export default function TrueRoiDashboard() {
    const [metrics, setMetrics] = useState<any>(null);
    const [fixedCost, setFixedCost] = useState(2000); // Default fixed cost
    const [loading, setLoading] = useState(false);

    const fetchFinancials = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8001/api/intelligence/financial-health?fixed_costs=${fixedCost}`);
            const data = await res.json();
            setMetrics(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFinancials();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 h-full flex flex-col backdrop-blur-md">
            <header className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-xl font-black tracking-tighter flex items-center gap-2 text-[var(--foreground)]">
                        <BanknotesIcon className="w-5 h-5 text-[var(--foreground)]" />
                        FINANCIAL WAR ROOM
                    </h2>
                    <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mt-1">
                        Verdade Financeira (Ads + Custos Fixos)
                    </p>
                </div>

                <div className="flex items-end gap-2 bg-black/40 p-1.5 rounded-xl border border-zinc-800">
                    <div>
                        <label className="text-[9px] uppercase font-bold text-zinc-600 block pl-1 mb-0.5">Custos Fixos (R$)</label>
                        <input
                            type="number"
                            value={fixedCost}
                            onChange={(e) => setFixedCost(Number(e.target.value))}
                            className="bg-transparent text-[var(--foreground)] text-xs font-bold w-20 px-2 py-1 outline-none text-right"
                        />
                    </div>
                    <button
                        onClick={fetchFinancials}
                        disabled={loading}
                        className="bg-white/10 hover:bg-white/10 text-[var(--foreground)] p-1.5 rounded-lg transition-colors"
                    >
                        <CalculatorIcon className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {!metrics ? (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 animate-pulse gap-2">
                    <CurrencyDollarIcon className="w-8 h-8 opacity-20" />
                    <span className="text-xs font-mono">CALCULATING_PROFIT_MARGINS...</span>
                </div>
            ) : (
                <div className="grid grid-cols-4 gap-4 flex-1">

                    {/* BIG NUMBER 1: Blended ROAS */}
                    <div className="col-span-1 bg-gradient-to-br from-emerald-900/40 to-black p-5 rounded-2xl border border-white/20/30 flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-30 group-hover:opacity-100 transition-opacity">
                            <ArrowTrendingUpIcon className="w-12 h-12 text-[var(--foreground)] transform rotate-12 translate-x-4 -translate-y-4" />
                        </div>

                        <p className="text-[10px] text-[var(--foreground)] uppercase font-bold tracking-widest">Blended ROAS</p>

                        <div>
                            <p className="text-4xl font-black text-[var(--foreground)] tracking-tight">{metrics.blended_roas}x</p>
                            <p className="text-[10px] text-[var(--foreground)]/60 mt-1 font-medium">Retorno Real sobre Investimento Total</p>
                        </div>
                    </div>

                    {/* BIG NUMBER 2: Net Profit */}
                    <div className="col-span-1 bg-zinc-900/50 p-5 rounded-2xl border border-zinc-700/50 flex flex-col justify-between relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-1 h-full ${metrics.profit > 0 ? 'bg-white/10' : 'bg-white/10'}`} />
                        <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest pl-2">Lucro Líquido</p>

                        <div>
                            <p className={`text-3xl font-black tracking-tight ${metrics.profit > 0 ? 'text-[var(--foreground)]' : 'text-[var(--foreground)]'}`}>
                                R$ {metrics.profit?.toLocaleString()}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${metrics.profit_margin > 15 ? 'bg-white/10/50 text-[var(--foreground)]' : 'bg-white/10/50 text-[var(--foreground)]'}`}>
                                    {metrics.profit_margin}% Margem
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Investment Breakdown */}
                    <div className="col-span-1 bg-black/40 p-5 rounded-2xl border border-zinc-800 flex flex-col justify-between">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Investimento Total</p>
                        <div>
                            <p className="text-2xl font-bold text-[var(--foreground)]">R$ {metrics.total_investment?.toLocaleString()}</p>
                            <div className="w-full bg-zinc-800 h-1 mt-3 rounded-full overflow-hidden flex">
                                <div className="bg-white/10 h-full" style={{ width: `${(metrics.ad_spend / metrics.total_investment) * 100}%` }} />
                                <div className="bg-zinc-600 h-full flex-1" />
                            </div>
                            <div className="flex justify-between mt-1 text-[9px] text-zinc-500">
                                <span>Ads: {(metrics.ad_spend / metrics.total_investment * 100).toFixed(0)}%</span>
                                <span>Fixo: {(metrics.fixed_costs / metrics.total_investment * 100).toFixed(0)}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Card 4: Hidden Cost / Reality Check */}
                    <div className="col-span-1 bg-white/10/10 p-5 rounded-2xl border border-white/20/20 flex flex-col justify-between">
                        <p className="text-[10px] text-[var(--foreground)] uppercase font-bold tracking-widest flex items-center gap-1">
                            <ExclamationTriangleIcon className="w-3 h-3" /> Custo Oculto
                        </p>
                        <div>
                            <p className="text-3xl font-black text-[var(--foreground)]">+{metrics.hidden_cost_percentage}%</p>
                            <p className="text-[10px] text-[var(--foreground)]/60 mt-1 font-medium">True CAC vs Platform CAC</p>
                            <p className="text-[10px] text-zinc-500 mt-2">R$ {metrics.true_cac} real vs R$ {metrics.platform_cac} painel</p>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}

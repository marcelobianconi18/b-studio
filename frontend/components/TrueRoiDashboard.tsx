
"use client";

import { useState, useEffect } from "react";
import {
    BanknotesIcon,
    CalculatorIcon,
    ArrowTrendingUpIcon,
    ExclamationTriangleIcon
} from "@heroicons/react/24/outline";

export default function TrueRoiDashboard() {
    const [metrics, setMetrics] = useState<any>(null);
    const [fixedCost, setFixedCost] = useState(2000);
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
    }, []); // Initial load

    return (
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-8 mb-8">
            <header className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-2xl font-black italic tracking-tighter flex items-center gap-2">
                        <BanknotesIcon className="w-6 h-6 text-emerald-500" />
                        DASHBOARD ROI REAL
                    </h2>
                    <p className="text-zinc-500 text-xs">Checagem de Realidade Financeira (Custos Mistos)</p>
                </div>

                <div className="flex items-end gap-2">
                    <div>
                        <label className="text-[10px] uppercase font-bold text-zinc-600 block mb-1">Custos Fixos Mensais (R$)</label>
                        <input
                            type="number"
                            value={fixedCost}
                            onChange={(e) => setFixedCost(Number(e.target.value))}
                            className="bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm w-32 focus:border-emerald-500 outline-none transition-colors"
                        />
                    </div>
                    <button
                        onClick={fetchFinancials}
                        disabled={loading}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-lg transition-colors"
                    >
                        <CalculatorIcon className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {!metrics ? (
                <div className="text-center py-10 text-zinc-600 animate-pulse">Calculando Finanças...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                    {/* Card 1: Total Investment */}
                    <div className="bg-black/40 p-6 rounded-2xl border border-zinc-800">
                        <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Investimento Total</p>
                        <p className="text-2xl font-bold text-white">R$ {metrics.total_investment?.toLocaleString()}</p>
                        <p className="text-[10px] text-zinc-600 mt-1">Anúncios (R$ {metrics.ad_spend}) + Fixos (R$ {metrics.fixed_costs})</p>
                    </div>

                    {/* Card 2: Platform CAC (Fake) */}
                    <div className="bg-black/40 p-6 rounded-2xl border border-zinc-800 relative overflow-hidden group">
                        <p className="text-xs text-zinc-500 uppercase font-bold mb-1">CAC da Plataforma</p>
                        <p className="text-2xl font-bold text-zinc-400">R$ {metrics.platform_cac}</p>
                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-zinc-800 text-[9px] text-zinc-500 rounded uppercase">Métrica de Vaidade</div>
                    </div>

                    {/* Card 3: TRUE CAC (Real) */}
                    <div className="bg-gradient-to-br from-emerald-900/20 to-black p-6 rounded-2xl border border-emerald-500/30 relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500 blur-2xl opacity-20" />
                        <p className="text-xs text-emerald-500 uppercase font-bold mb-1 flex items-center gap-1">
                            <ArrowTrendingUpIcon className="w-3 h-3" /> CAC Real
                        </p>
                        <p className="text-3xl font-black text-white">R$ {metrics.true_cac}</p>
                        <p className="text-[10px] text-emerald-400/60 mt-1">O custo real por venda</p>
                    </div>

                    {/* Card 4: Hidden Cost */}
                    <div className="bg-red-900/10 p-6 rounded-2xl border border-red-500/20">
                        <p className="text-xs text-red-500 uppercase font-bold mb-1 flex items-center gap-1">
                            <ExclamationTriangleIcon className="w-3 h-3" /> Custo Oculto
                        </p>
                        <p className="text-2xl font-bold text-red-400">+{metrics.hidden_cost_percentage}%</p>
                        <p className="text-[10px] text-red-400/60 mt-1">vs Métricas da Plataforma</p>
                    </div>

                </div>
            )}
        </div>
    );
}

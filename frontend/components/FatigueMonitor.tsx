"use client";

import { useState, useEffect } from "react";
import {
    ExclamationTriangleIcon,
    ArrowPathIcon,
    ChartBarIcon,
    SwatchIcon
} from "@heroicons/react/24/solid";
import { apiUrl } from "@/lib/api";

export default function FatigueMonitor() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const checkFatigue = async () => {
        setLoading(true);
        try {
            const res = await fetch(apiUrl("/api/intelligence/fatigue-monitor"));
            const json = await res.json();
            setData(json);
        } catch (e) {
            console.error("Fatigue check failed", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkFatigue();
    }, []);

    if (loading) return (
        <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-3xl animate-pulse h-64 flex items-center justify-center">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Escaneando Performance de Anúncios...</p>
        </div>
    );

    if (!data || !data.fatigued_ads || data.fatigued_ads.length === 0) return (
        <div className="p-6 bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-3xl h-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold uppercase text-zinc-500 tracking-widest flex items-center gap-2">
                    <ChartBarIcon className="w-4 h-4" /> Central de Liquidez de Ativos
                </h2>
                <button onClick={checkFatigue} className="text-zinc-600 hover:text-[var(--foreground)] transition-colors">
                    <ArrowPathIcon className="w-4 h-4" />
                </button>
            </div>
            <div className="flex flex-col items-center justify-center h-48 text-center">
                <div className="w-12 h-12 bg-white/10/10 rounded-full flex items-center justify-center mb-3">
                    <CheckBadgeIcon className="w-6 h-6 text-[var(--foreground)]" />
                </div>
                <h3 className="text-[var(--foreground)] font-bold">Todos os Criativos Saudáveis</h3>
                <p className="text-zinc-500 text-xs mt-1">Escaneados {data?.checked_count || 0} anúncios ativos. Nenhuma fadiga detectada.</p>
            </div>
        </div>
    );

    return (
        <div className="p-6 bg-gradient-to-br from-red-900/10 to-black border border-white/20/20 rounded-3xl h-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold uppercase text-[var(--foreground)] tracking-widest flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-4 h-4" /> Alerta de Fadiga Criativa
                </h2>
                <span className="bg-white/10 text-[var(--foreground)] text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">
                    {data.fatigued_ads.length} Anúncios Morrendo
                </span>
            </div>

            <div className="space-y-4">
                {data.fatigued_ads.map((ad: any) => (
                    <div key={ad.ad_id} className="bg-black/50 border border-white/20/30 p-4 rounded-xl">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-[var(--foreground)] text-sm truncate w-2/3">{ad.ad_name}</h3>
                            <span className="text-[10px] text-[var(--foreground)] font-mono">{ad.severity} RISCO</span>
                        </div>
                        <p className="text-xs text-zinc-500 mb-2">{ad.reason}</p>
                        <div className="bg-white/10/10 rounded px-2 py-1 text-[10px] font-mono text-[var(--foreground)] inline-block mb-3">
                            {ad.metrics}
                        </div>

                        {/* Replacement Suggestion */}
                        {data.replacements && data.replacements.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-zinc-800/50">
                                <p className="text-[10px] text-zinc-500 uppercase font-bold mb-2 flex items-center gap-1">
                                    <ArrowPathIcon className="w-3 h-3" /> Substituição Sugerida
                                </p>
                                <div className="flex items-center gap-3 bg-zinc-900 p-2 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer group">
                                    <div className="w-8 h-8 bg-zinc-700 rounded overflow-hidden shrink-0">
                                        {data.replacements[0].thumbnail ? (
                                            <img src={data.replacements[0].thumbnail} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[8px] text-zinc-400">IMG</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-[var(--foreground)] truncate">{data.replacements[0].message}</p>
                                    </div>
                                    <button className="bg-white text-black text-[10px] font-bold px-2 py-1 rounded hover:bg-[var(--accent-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                                        USAR
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function CheckBadgeIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
        </svg>
    );
}

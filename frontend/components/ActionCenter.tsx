"use client";

import { BoltIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { useState, useEffect } from "react";

export default function ActionCenter() {
    const [recommendations, setRecommendations] = useState<any[]>([]);

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const res = await fetch("http://localhost:8001/api/intelligence/recommendations");
                if (res.ok) {
                    const data = await res.json();
                    // Transform for UI
                    const formatted = data.map((rec: any) => ({
                        id: rec.id,
                        type: "OPPORTUNITY", // Default for now, backend could provide classification
                        title: rec.title,
                        impact: "HIGH", // Default
                        description: rec.content
                    }));
                    setRecommendations(formatted);
                }
            } catch (e) {
                console.error("Failed to fetch recommendations", e);
            }
        };

        fetchRecommendations();
    }, []);

    const handleApprove = (id: number) => {
        setRecommendations(prev => prev.filter(r => r.id !== id));
        // In production: Call API to execute action
    };

    const handleDismiss = (id: number) => {
        setRecommendations(prev => prev.filter(r => r.id !== id));
    };

    return (
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-6 h-full flex flex-col relative overflow-hidden">
            <h2 className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                <BoltIcon className="w-4 h-4 text-yellow-500" /> Centro de Ação (Aprovações)
            </h2>

            {recommendations.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                    <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                        <BoltIcon className="w-8 h-8 text-zinc-600" />
                    </div>
                    <p className="text-zinc-500 text-sm font-medium">Tudo tranquilo por aqui.</p>
                    <p className="text-zinc-600 text-xs mt-1">Nenhuma ação pendente de aprovação.</p>
                </div>
            ) : (
                <div className="space-y-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
                    {recommendations.map(rec => (
                        <div key={rec.id} className="bg-black/40 border border-zinc-800 p-4 rounded-xl flex justify-between items-start hover:border-zinc-700 transition-colors group">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${rec.type === 'OPPORTUNITY' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
                                        {rec.type}
                                    </span>
                                    <h3 className="text-sm font-bold text-zinc-200">{rec.title}</h3>
                                </div>
                                <p className="text-xs text-zinc-500 leading-relaxed mb-1">{rec.description}</p>
                                <p className="text-[10px] text-zinc-600 font-mono">Impacto: {rec.impact}</p>
                            </div>

                            <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleDismiss(rec.id)}
                                    className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-red-400 transition-colors"
                                    title="Dispensar"
                                >
                                    <XCircleIcon className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={() => handleApprove(rec.id)}
                                    className="p-2 hover:bg-emerald-900/30 rounded-lg text-zinc-500 hover:text-emerald-400 transition-colors"
                                    title="Aprovar e Executar"
                                >
                                    <CheckCircleIcon className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

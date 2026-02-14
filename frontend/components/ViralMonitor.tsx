"use client";

import { useState, useEffect } from "react";
import {
    SparklesIcon,
    ArrowPathIcon,
    RocketLaunchIcon,
    MegaphoneIcon
} from "@heroicons/react/24/solid";

export default function ViralMonitor() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const checkViral = async () => {
        setLoading(true);
        try {
            const res = await fetch("http://localhost:8001/api/intelligence/viral-monitor");
            const json = await res.json();
            setData(json);
        } catch (e) {
            console.error("Viral check failed", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkViral();
    }, []);

    if (loading) return (
        <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-3xl animate-pulse h-64 flex items-center justify-center">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Caçando Posts Virais...</p>
        </div>
    );

    if (!data || !data.candidates || data.candidates.length === 0) return (
        <div className="p-6 bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-3xl h-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold uppercase text-zinc-500 tracking-widest flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4" /> Organic-to-Paid Engine
                </h2>
                <button onClick={checkViral} className="text-zinc-600 hover:text-white transition-colors">
                    <ArrowPathIcon className="w-4 h-4" />
                </button>
            </div>
            <div className="flex flex-col items-center justify-center h-48 text-center">
                <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mb-3">
                    <MegaphoneIcon className="w-6 h-6 text-zinc-500" />
                </div>
                <h3 className="text-zinc-300 font-bold">Sem Novidades no Front</h3>
                <p className="text-zinc-500 text-xs mt-1">
                    Taxa de Engajamento Média: <span className="text-white font-mono">{(data?.avg_er * 100).toFixed(2)}%</span>
                    <br />Nenhuma anomalia detectada hoje.
                </p>
            </div>
        </div>
    );

    const topCandidate = data.candidates[0];

    return (
        <div className="p-6 bg-gradient-to-br from-indigo-900/10 to-black border border-indigo-500/20 rounded-3xl h-full relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none" />

            <div className="flex justify-between items-center mb-4 relative z-10">
                <h2 className="text-sm font-bold uppercase text-indigo-400 tracking-widest flex items-center gap-2">
                    <RocketLaunchIcon className="w-4 h-4" /> Alerta Viral
                </h2>
                <span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">
                    {data.candidates.length} Oportunidades
                </span>
            </div>

            <div className="relative z-10">
                <p className="text-xs text-zinc-400 mb-3">
                    Este post está performando <span className="text-white font-bold">{topCandidate.lift.toFixed(1)}x</span> melhor que sua média.
                </p>

                <div className="bg-zinc-900/80 border border-indigo-500/30 p-3 rounded-xl flex gap-3 mb-3">
                    <div className="w-16 h-16 bg-zinc-800 rounded-lg overflow-hidden shrink-0">
                        {topCandidate.thumbnail ? (
                            <img src={topCandidate.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] text-zinc-400">IMG</div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-zinc-200 line-clamp-2 font-medium leading-relaxed">
                            {topCandidate.message}
                        </p>
                        <div className="flex gap-2 mt-2">
                            <span className="text-[10px] bg-black/50 px-1.5 py-0.5 rounded text-indigo-300 font-mono">
                                ER: {(topCandidate.metrics.er * 100).toFixed(1)}%
                            </span>
                            <span className="text-[10px] bg-black/50 px-1.5 py-0.5 rounded text-zinc-400 font-mono">
                                {topCandidate.metrics.engagement} Eng.
                            </span>
                        </div>
                    </div>
                </div>

                <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all flex items-center justify-center gap-2">
                    <RocketLaunchIcon className="w-3 h-3" />
                    IMPULSIONAR AGORA (Um Clique)
                </button>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import Dashboard from "./page"; // This is effectively the Traffic Manager for now
import UnifiedInbox from "@/components/UnifiedInbox";
import Sidebar from "@/components/Sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
    const [activeTab, setActiveTab] = useState("home");

    return (
        <div className="flex min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30">
            {/* New Sidebar Component */}
            <Sidebar activeTab={activeTab} onNavigate={setActiveTab} />

            {/* Main Content Area */}
            <main className="flex-1 ml-64 min-h-screen bg-[#050505]">
                {activeTab === "home" && <CommandCenter onNavigate={setActiveTab} />}
                {activeTab === "ads" && <Dashboard />}
                {activeTab === "social" && <SocialStudio />}
                {activeTab === "inbox" && <UnifiedInbox />}
                {activeTab === "settings" && <div className="p-20 text-center text-zinc-500">Módulo de Configurações em Breve</div>}
            </main>
        </div>
    );
}

// -- Internal Components (To be extracted) --

function CommandCenter({ onNavigate }: { onNavigate: (tab: string) => void }) {
    return (
        <div className="p-10">
            <header className="mb-12">
                <h1 className="text-4xl font-black italic tracking-tighter mb-2">CENTRO DE COMANDO</h1>
                <p className="text-zinc-500 text-sm">Visão Geral B-Studio Enterprise</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Traffic Card */}
                <div
                    onClick={() => onNavigate("ads")}
                    className="group bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 p-8 rounded-3xl cursor-pointer hover:border-blue-500/50 transition-all relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-2xl">
                            🚀
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-white">Gestor de Tráfego</h2>
                        <p className="text-zinc-400 text-sm mb-6">Gerencie campanhas, monitore ROI e escale anúncios vencedores usando estratégias de IA.</p>

                        <div className="flex gap-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                            <span className="bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full">Monitor ROAS</span>
                            <span className="bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full">Alerta de Fadiga</span>
                        </div>
                    </div>
                </div>

                {/* Social Card */}
                <div
                    onClick={() => onNavigate("social")}
                    className="group bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 p-8 rounded-3xl cursor-pointer hover:border-pink-500/50 transition-all relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-2xl">
                            🎨
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-white">Estúdio Social</h2>
                        <p className="text-zinc-400 text-sm mb-6">Analise crescimento orgânico, gerencie leads no inbox e descubra conteúdo viral.</p>

                        <div className="flex gap-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                            <span className="bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full">Alertas Virais</span>
                            <span className="bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full">Inbox AI</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function SocialStudio() {
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        const fetchSocial = async () => {
            try {
                const res = await fetch("http://localhost:8001/api/intelligence/social-analysis");
                setStats(await res.json());
            } catch (e) {
                console.error("Failed to fetch social stats", e);
            }
        }
        fetchSocial();
    }, []);

    if (!stats) return <div className="p-20 text-center animate-pulse text-zinc-600">Carregando Inteligência Social...</div>

    return (
        <div className="p-8">
            <header className="mb-12">
                <h1 className="text-3xl font-black italic tracking-tighter mb-2">ESTÚDIO SOCIAL</h1>
                <p className="text-zinc-500 text-sm">Crescimento Orgânico e Análise "The Bridge"</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-3xl flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden group hover:border-blue-500/50 transition-all">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 blur-[80px] opacity-20 absolute" />
                    <h3 className="text-xl font-bold relative z-10">Alcance Híbrido</h3>
                    <p className="text-5xl font-black text-white relative z-10">{stats.blended_reach?.toLocaleString() || "--"}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest relative z-10 border border-zinc-800 px-3 py-1 rounded-full">Orgânico + Pago (28d)</p>
                </div>

                <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-3xl flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden group hover:border-emerald-500/50 transition-all">
                    <div className="w-32 h-32 rounded-full bg-emerald-500 blur-[80px] opacity-10 absolute" />
                    <h3 className="text-xl font-bold relative z-10">Crescimento Orgânico</h3>
                    <p className="text-5xl font-black text-emerald-400 relative z-10">{stats.organic_growth_rate || "0%"}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest relative z-10 border border-zinc-800 px-3 py-1 rounded-full">vs Período Anterior</p>
                </div>
            </div>

            <section className="bg-zinc-900/20 border border-zinc-800/50 rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-black text-xs">AI</div>
                    <h2 className="text-lg font-bold">Insight do Estrategista de Crescimento</h2>
                </div>

                <div className="space-y-6">
                    <div className="prose prose-invert">
                        <p className="text-lg leading-relaxed text-zinc-300">"{stats.insight}"</p>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl">
                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-2">Ação Recomendada</p>
                        <p className="text-blue-100 font-medium">{stats.suggestion}</p>
                        <div className="flex gap-4 mt-4">
                            <button className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors">
                                Impulsionar Campanha
                            </button>
                            <button className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg transition-colors">
                                Criar Novo Post
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

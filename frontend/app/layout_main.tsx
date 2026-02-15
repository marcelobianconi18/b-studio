"use client";

import { useEffect, useState } from "react";
import {
    BellAlertIcon,
    EnvelopeIcon,
    UserCircleIcon
} from "@heroicons/react/24/outline";
import Dashboard from "./page";
import UnifiedInbox from "@/components/UnifiedInbox";
import Sidebar from "@/components/Sidebar";

const TOP_MENU_ITEMS = [
    "Institucional",
    "Produtos",
    "Servicos",
    "Cases",
    "Relatorios"
];

export default function Layout({ children }: { children: React.ReactNode }) {
    const [activeTab, setActiveTab] = useState("home");
    const [collapsed, setCollapsed] = useState(false);
    const [theme, setTheme] = useState<"light" | "dark">("light");

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        window.localStorage.setItem("bstudio-theme", theme);
    }, [theme]);

    return (
        <div className="min-h-screen" style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}>
            <Sidebar
                activeTab={activeTab}
                onNavigate={setActiveTab}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed((prev) => !prev)}
                theme={theme}
                onThemeChange={setTheme}
            />

            <div className={`min-h-screen transition-all duration-300 ${collapsed ? "ml-[88px]" : "ml-64"}`}>
                <header
                    className="h-24 border-b px-5 md:px-8 flex items-center justify-between relative"
                    style={{
                        backgroundColor: "var(--shell-top)",
                        borderColor: "var(--shell-border)"
                    }}
                >
                    <div className="hidden md:flex items-center gap-6 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: "var(--muted)" }}>B-Studio Enterprise</p>
                    </div>

                    <nav className="hidden md:flex items-center gap-2 overflow-x-auto absolute left-1/2 -translate-x-1/2">
                        {TOP_MENU_ITEMS.map((item, idx) => (
                            <button
                                key={item}
                                className="px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors"
                                style={{
                                    backgroundColor: idx === 0 ? "var(--ink)" : "var(--shell-surface)",
                                    color: idx === 0 ? "#ffffff" : "var(--foreground)"
                                }}
                            >
                                {item}
                            </button>
                        ))}
                    </nav>

                    <div className="flex items-center gap-2 md:gap-3 ml-auto">
                        <TopCircleButton label="Mensagens do sistema" badge>
                            <EnvelopeIcon className="w-5 h-5" />
                        </TopCircleButton>
                        <TopCircleButton label="Avisos do sistema" badge>
                            <BellAlertIcon className="w-5 h-5" />
                        </TopCircleButton>
                        <TopCircleButton label="Perfil do usuario">
                            <UserCircleIcon className="w-5 h-5" />
                        </TopCircleButton>
                    </div>
                </header>

                <main className="p-4 md:p-6 min-h-[calc(100vh-96px)]">
                    {activeTab === "home" && <Dashboard />}
                    {activeTab === "ads" && <div className="p-20 text-center" style={{ color: "var(--muted)" }}>Modulo de Trafego Pago em breve.</div>}
                    {activeTab === "social" && <SocialStudio />}
                    {activeTab === "inbox" && <UnifiedInbox />}
                    {activeTab === "settings" && <div className="p-20 text-center" style={{ color: "var(--muted)" }}>Modulo de Configuracoes em breve.</div>}
                    {activeTab === "profile" && <div className="p-20 text-center" style={{ color: "var(--muted)" }}>Modulo de Perfil em breve.</div>}
                    {!(["home", "ads", "social", "inbox", "settings", "profile"] as string[]).includes(activeTab) && children}
                </main>
            </div>
        </div>
    );
}

function TopCircleButton({
    children,
    label,
    badge = false
}: {
    children: React.ReactNode;
    label: string;
    badge?: boolean;
}) {
    return (
        <button
            title={label}
            className="w-11 h-11 rounded-full flex items-center justify-center relative transition-colors"
            style={{
                backgroundColor: "var(--shell-surface)",
                color: "var(--foreground)"
            }}
        >
            {children}
            {badge && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />
            )}
        </button>
    );
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
        };
        fetchSocial();
    }, []);

    if (!stats) return <div className="p-20 text-center animate-pulse text-zinc-600">Carregando Inteligencia Social...</div>;

    return (
        <div className="p-8">
            <header className="mb-12">
                <h1 className="text-3xl font-black italic tracking-tighter mb-2">ESTUDIO SOCIAL</h1>
                <p className="text-zinc-500 text-sm">Crescimento Organico e Analise "The Bridge"</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-3xl flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden group hover:border-blue-500/50 transition-all">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 blur-[80px] opacity-20 absolute" />
                    <h3 className="text-xl font-bold relative z-10">Alcance Hibrido</h3>
                    <p className="text-5xl font-black text-white relative z-10">{stats.blended_reach?.toLocaleString() || "--"}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest relative z-10 border border-zinc-800 px-3 py-1 rounded-full">Organico + Pago (28d)</p>
                </div>

                <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-3xl flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden group hover:border-emerald-500/50 transition-all">
                    <div className="w-32 h-32 rounded-full bg-emerald-500 blur-[80px] opacity-10 absolute" />
                    <h3 className="text-xl font-bold relative z-10">Crescimento Organico</h3>
                    <p className="text-5xl font-black text-emerald-400 relative z-10">{stats.organic_growth_rate || "0%"}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest relative z-10 border border-zinc-800 px-3 py-1 rounded-full">vs Periodo Anterior</p>
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
                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-2">Acao Recomendada</p>
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
    );
}

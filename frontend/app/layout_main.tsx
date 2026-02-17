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
import LiquidShell from "@/components/LiquidShell";
import FacebookInsightsAnalysis from "@/components/social/FacebookInsightsAnalysis";
import InstagramInsightsAnalysis from "@/components/social/InstagramInsightsAnalysis";
import ProfileSelector, { type InsightProfile } from "@/components/ProfileSelector";
import PeriodSelector, { type PeriodValue } from "@/components/PeriodSelector";

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
    const [selectedPeriod, setSelectedPeriod] = useState<PeriodValue>("30d");
    const [selectedInsightProfile, setSelectedInsightProfile] = useState<InsightProfile>({
        id: "facebook-client-1",
        name: "clientedeteste1",
        role: "Facebook Insight",
        platform: "facebook",
    });

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        window.localStorage.setItem("bstudio-theme", theme);
    }, [theme]);

    const getContextLabel = () => {
        if (activeTab === "social") return "Insight";
        if (activeTab === "ads_metrics") return "Ads Insight";
        if (activeTab === "ads") return "Ads";
        return "Insight";
    };

    const renderSystemSelectors = (
        <div className="pointer-events-auto w-full max-w-[720px] ml-auto h-full py-2 flex items-end justify-between gap-4">
            <div className="hidden md:flex items-center gap-2 pr-1 min-w-0 self-end translate-x-[-10px]">
                {selectedInsightProfile.platform === "facebook" ? (
                    <div className="w-9 h-9 rounded-lg bg-[#1877F2] flex items-center justify-center shadow-sm shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                    </div>
                ) : (
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#515BD4] flex items-center justify-center shadow-sm shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <rect x="4.5" y="4.5" width="15" height="15" rx="4.5" stroke="#fff" strokeWidth="2" />
                            <circle cx="12" cy="12" r="3.4" stroke="#fff" strokeWidth="2" />
                            <circle cx="17.5" cy="6.7" r="1.2" fill="#fff" />
                        </svg>
                    </div>
                )}
                <div className="flex flex-col leading-none min-w-0">
                    <span className="text-[32px] font-black tracking-tight text-[var(--foreground)] truncate">
                        {selectedInsightProfile.platform === "facebook" ? "Facebook" : "Instagram"}
                    </span>
                    <span className="text-[21px] font-normal -mt-1 text-[var(--foreground)]">
                        {getContextLabel()}
                    </span>
                </div>
            </div>

            <div className="flex flex-col gap-1 self-end translate-y-12 md:translate-y-12">
                <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] leading-none font-normal uppercase text-[var(--foreground)]">Cliente:</span>
                    <ProfileSelector variant="shell-brand" selectedProfile={selectedInsightProfile} onChange={setSelectedInsightProfile} />
                </div>
                <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] leading-none font-normal uppercase text-[var(--foreground)]">Período:</span>
                    <PeriodSelector variant="shell-brand" value={selectedPeriod} onChange={(value) => setSelectedPeriod(value)} />
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}>
            <header
                className="fixed top-0 left-0 w-full h-20 px-5 md:px-8 flex items-center justify-between z-[60] pointer-events-none"
                style={{
                    backgroundColor: "transparent",
                    border: "none"
                }}
            >
                <div className="flex items-center gap-4 min-w-[240px] pointer-events-auto">
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-lg shadow-lg"
                        style={{ backgroundColor: "var(--ink)" }}
                    >
                        B
                    </div>
                    <div className="flex flex-col">
                        <p className="text-sm font-black italic tracking-tighter" style={{ color: "var(--foreground)" }}>B-Studio</p>
                        <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Enterprise</p>
                    </div>
                </div>

                <nav className="hidden md:flex items-center justify-center gap-12 absolute left-1/2 -translate-x-1/2 pointer-events-auto w-full max-w-5xl">
                    {TOP_MENU_ITEMS.map((item, idx) => (
                        <button
                            key={item}
                            className="px-5 py-2 rounded-full text-[13px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border border-transparent hover:border-white/10"
                            style={{
                                backgroundColor: idx === 0
                                    ? (theme === "dark" ? "#ffffff" : "var(--ink)")
                                    : "transparent",
                                color: idx === 0
                                    ? (theme === "dark" ? "#000000" : "#ffffff")
                                    : "var(--muted)"
                            }}
                        >
                            {item}
                        </button>
                    ))}
                </nav>

                <div className="flex items-center gap-2 md:gap-3 ml-auto pointer-events-auto">
                    <TopCircleButton label="Mensagens do sistema" badge>
                        <EnvelopeIcon className="w-5 h-5" />
                    </TopCircleButton>
                    <TopCircleButton label="Avisos do sistema" badge>
                        <BellAlertIcon className="w-5 h-5" />
                    </TopCircleButton>
                    <TopCircleButton label="Perfil do usuario" onClick={() => setActiveTab("profile")}>
                        <UserCircleIcon className="w-5 h-5" />
                    </TopCircleButton>
                </div>
            </header>

            <Sidebar
                activeTab={activeTab}
                onNavigate={setActiveTab}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed((prev) => !prev)}
                theme={theme}
                onThemeChange={setTheme}
            />

            <div className={`flex-1 transition-all duration-300 pt-24 ${collapsed ? "ml-16" : "ml-60"}`}>
                <main className="p-1 md:p-2 min-h-[calc(100vh-96px)] flex flex-col">
                    {activeTab === "home" && <Dashboard />}
                    {activeTab === "ads_metrics" && (
                        <LiquidShell title="MÉTRICA ADS" subtitle="ANÁLISE DE PERFORMANCE" action={renderSystemSelectors}>
                            <div className="flex-1 flex items-center justify-center p-20 text-center" style={{ color: "var(--muted)" }}>
                                Módulo de Métrica Ads em breve.
                            </div>
                        </LiquidShell>
                    )}
                    {activeTab === "ads" && (
                        <LiquidShell title="TRÁFEGO PAGO" subtitle="GESTÃO DE CAMPANHAS E ROI" action={renderSystemSelectors}>
                            <div className="flex-1 flex items-center justify-center p-20 text-center" style={{ color: "var(--muted)" }}>
                                Módulo de Tráfego Pago em breve.
                            </div>
                        </LiquidShell>
                    )}
                    {activeTab === "social" && (
                        <LiquidShell
                            title="MÉTRICA SOCIAL"
                            subtitle={selectedInsightProfile.platform === "facebook" ? "Facebook Insights & Crescimento" : "Instagram Insights & Crescimento"}
                            action={renderSystemSelectors}
                        >
                            {selectedInsightProfile.platform === "facebook" ? <FacebookInsightsAnalysis /> : <InstagramInsightsAnalysis />}
                        </LiquidShell>
                    )}
                    {activeTab === "inbox" && (
                        <LiquidShell title="MESA DE VENDAS" subtitle="INBOX PRIORITÁRIO" action={renderSystemSelectors}>
                            <UnifiedInbox />
                        </LiquidShell>
                    )}
                    {activeTab === "profile" && (
                        <LiquidShell title="PERFIL" subtitle="GERENCIAMENTO DE CONTA" action={renderSystemSelectors}>
                            <div className="flex-1 flex items-center justify-center p-20 text-center" style={{ color: "var(--muted)" }}>
                                Módulo de Perfil em breve.
                            </div>
                        </LiquidShell>
                    )}
                    {!(["home", "ads", "social", "inbox", "settings", "profile"] as string[]).includes(activeTab) && children}
                </main>
            </div>
        </div>
    );
}

function TopCircleButton({
    children,
    label,
    badge = false,
    onClick
}: {
    children: React.ReactNode;
    label: string;
    badge?: boolean;
    onClick?: () => void;
}) {
    return (
        <button
            title={label}
            onClick={onClick}
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

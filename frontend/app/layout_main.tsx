"use client";

import { useEffect, useState, useCallback } from "react";
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
import CompetitorsAnalysis from "@/components/social/CompetitorsAnalysis";
import ProfileSelector, { type InsightProfile } from "@/components/ProfileSelector";
import PeriodSelector, { type PeriodValue } from "@/components/PeriodSelector";
import CampaignAnalysisPanel from "@/components/ads/CampaignAnalysisPanel";
import ProfilePage from "@/components/ProfilePage";

// ─── Route Mapping ───────────────────────────────────────────────────────
const ROUTE_TO_TAB: Record<string, string> = {
    "/dashboard": "home",
    "/social": "social",
    "/concorrentes": "concorrentes",
    "/ads-metrics": "ads_metrics",
    "/ads": "ads",
    "/inbox": "inbox",
    "/settings": "settings",
    "/profile": "profile",
    "/profile/exclusao": "profile",
};

const TAB_TO_ROUTE: Record<string, string> = {
    home: "/dashboard",
    social: "/social",
    concorrentes: "/concorrentes",
    ads_metrics: "/ads-metrics",
    ads: "/ads",
    inbox: "/inbox",
    settings: "/settings",
    profile: "/profile",
};

function getTabFromHash(): string {
    if (typeof window === "undefined") return "home";
    const hash = window.location.hash.replace("#", "") || "/dashboard";
    return ROUTE_TO_TAB[hash] || "home";
}

const TOP_MENU_ITEMS = [
    "Institucional",
    "Produtos",
    "Servicos",
    "Cases",
    "Relatorios"
];

export default function Layout({ children }: { children: React.ReactNode }) {
    const [activeTab, setActiveTab] = useState(() => getTabFromHash());
    const [collapsed, setCollapsed] = useState(false);
    const [theme, setTheme] = useState<"light" | "dark">("light");
    const [selectedPeriod, setSelectedPeriod] = useState<PeriodValue>("30d");
    const [selectedInsightProfile, setSelectedInsightProfile] = useState<InsightProfile>({
        id: "metaads-client-1",
        name: "clienteteste1",
        role: "Meta Ads",
        platform: "meta_ads",
    });
    const isMetaAdsProfile = selectedInsightProfile.platform === "meta_ads";

    // Navigate and update URL
    const navigateTo = useCallback((tab: string) => {
        setActiveTab(tab);
        const route = TAB_TO_ROUTE[tab] || "/dashboard";
        window.history.pushState(null, "", `#${route}`);
    }, []);

    // Sync URL → tab on load & browser back/forward
    useEffect(() => {
        const onHashChange = () => setActiveTab(getTabFromHash());
        window.addEventListener("hashchange", onHashChange);
        window.addEventListener("popstate", onHashChange);
        return () => {
            window.removeEventListener("hashchange", onHashChange);
            window.removeEventListener("popstate", onHashChange);
        };
    }, []);

    // Set initial hash if none
    useEffect(() => {
        if (!window.location.hash) {
            window.history.replaceState(null, "", "#/dashboard");
        }
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        window.localStorage.setItem("bstudio-theme", theme);
    }, [theme]);

    const getContextLabel = () => {
        if (activeTab === "social") return "Insight";
        if (activeTab === "concorrentes") return "Insight";
        if (activeTab === "ads_metrics") return "Meta Ads";
        if (activeTab === "ads") return "Ads";
        return "Insight";
    };

    const platformLogo = (
        <div className="hidden md:flex items-center gap-2 md:gap-3">
            {(activeTab === "ads_metrics" || activeTab === "ads") && isMetaAdsProfile ? (
                <div className="w-8 h-8 rounded-full bg-[#0a66e8] flex items-center justify-center shadow-md shrink-0">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 16.5C4.9 10.2 7.3 7 9.2 7c2.2 0 3.8 4.6 5 7 1.2-2.4 2.7-6.9 4.8-6.9 1.2 0 2.3 1.2 2.9 3.6" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            ) : selectedInsightProfile.platform === "facebook" ? (
                <div className="w-8 h-8 rounded-full bg-[#1877F2] flex items-center justify-center shadow-md shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                </div>
            ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#515BD4] flex items-center justify-center shadow-md shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <rect x="4.5" y="4.5" width="15" height="15" rx="4.5" stroke="#fff" strokeWidth="2" />
                        <circle cx="12" cy="12" r="3.4" stroke="#fff" strokeWidth="2" />
                        <circle cx="17.5" cy="6.7" r="1.2" fill="#fff" />
                    </svg>
                </div>
            )}
            <div className="flex flex-col leading-none">
                <span className="hidden md:inline text-xl font-black tracking-widest text-white uppercase drop-shadow-md">
                    {(activeTab === "ads_metrics" || activeTab === "ads") && isMetaAdsProfile
                        ? "Meta Ads"
                        : selectedInsightProfile.platform === "facebook"
                            ? "Facebook"
                            : "Instagram"
                    } <span className="font-light opacity-80">{getContextLabel()}</span>
                </span>
                <span className="md:hidden text-sm font-black tracking-wider text-white uppercase">
                    {(activeTab === "ads_metrics" || activeTab === "ads") && isMetaAdsProfile
                        ? "META ADS"
                        : selectedInsightProfile.platform === "facebook"
                            ? "FB"
                            : "IG"
                    } <span className="font-light opacity-80">{getContextLabel()}</span>
                </span>
            </div>
        </div>
    );

    const actionsBar = (
        <div className="flex items-center gap-3">
            <div className="hidden lg:flex bg-[var(--shell-surface)] backdrop-blur-md rounded-full px-5 h-12 border border-[var(--shell-border)] items-center mr-2 shadow-lg">
                <ProfileSelector variant="shell-brand" selectedProfile={selectedInsightProfile} onChange={setSelectedInsightProfile} />
                <div className="w-[2px] h-5 bg-[var(--shell-border)] mx-4" />
                <PeriodSelector variant="shell-brand" value={selectedPeriod} onChange={(value) => setSelectedPeriod(value)} />
            </div>

            <TopCircleButton label="Notificações" badge>
                <BellAlertIcon className="w-5 h-5" strokeWidth={1.5} />
            </TopCircleButton>

            <button
                onClick={() => navigateTo("profile")}
                className="w-11 h-11 rounded-full ml-1 overflow-hidden border-[3px] border-[var(--shell-border)] hover:border-[var(--muted)] transition-colors shadow-lg"
                title="Perfil"
            >
                <img src="https://i.pravatar.cc/150?img=47" alt="User Avatar" className="w-full h-full object-cover" />
            </button>
        </div>
    );

    return (
        <div className="h-screen w-full flex flex-col relative overflow-hidden" style={{ color: "var(--foreground)" }}>
            {/* Liquid Background */}
            <div className="liquid-bg-container">
                <div className="liquid-blob blob-1" />
                <div className="liquid-blob blob-2" />
            </div>

            <Sidebar
                activeTab={activeTab}
                onNavigate={navigateTo}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed((prev) => !prev)}
                theme={theme}
                onThemeChange={setTheme}
            />

            <div className="flex-1 flex flex-col min-h-0 pl-[72px] md:pl-[116px] pr-3 md:pr-6 py-4 md:py-6 w-full">
                <main className="h-full flex flex-col min-h-0 overflow-x-hidden">
                    {activeTab === "home" && <Dashboard headerCenter={platformLogo} action={actionsBar} />}
                    {activeTab === "ads_metrics" && (
                        <LiquidShell title="MÉTRICA ADS" subtitle="ANÁLISE DE PERFORMANCE" headerCenter={platformLogo} action={actionsBar}>
                            <CampaignAnalysisPanel
                                adsProfileEnabled={isMetaAdsProfile}
                                selectedProfileName={selectedInsightProfile.name}
                            />
                        </LiquidShell>
                    )}
                    {activeTab === "ads" && (
                        <LiquidShell title="TRÁFEGO PAGO" subtitle="GESTÃO DE CAMPANHAS E ROI" headerCenter={platformLogo} action={actionsBar}>
                            <div className="flex-1 flex items-center justify-center p-20 text-center" style={{ color: "var(--muted)" }}>
                                Módulo de Tráfego Pago em breve.
                            </div>
                        </LiquidShell>
                    )}
                    {activeTab === "social" && (
                        <LiquidShell
                            title="MÉTRICA SOCIAL"
                            subtitle={
                                selectedInsightProfile.platform === "facebook"
                                    ? "Facebook Insights & Crescimento"
                                    : selectedInsightProfile.platform === "instagram"
                                        ? "Instagram Insights & Crescimento"
                                        : "Selecione um perfil Facebook ou Instagram"
                            }
                            headerCenter={platformLogo}
                            action={actionsBar}
                        >
                            {selectedInsightProfile.platform === "facebook" && <FacebookInsightsAnalysis />}
                            {selectedInsightProfile.platform === "instagram" && <InstagramInsightsAnalysis />}
                            {selectedInsightProfile.platform === "meta_ads" && (
                                <div className="flex-1 flex items-center justify-center p-20 text-center" style={{ color: "var(--muted)" }}>
                                    Perfil Meta Ads ativo. Para Métrica Social, selecione um perfil Facebook ou Instagram.
                                </div>
                            )}
                        </LiquidShell>
                    )}
                    {activeTab === "concorrentes" && (
                        <LiquidShell title="CONCORRENTES" subtitle="ANÁLISE DE MERCADO" headerCenter={platformLogo} action={actionsBar}>
                            <CompetitorsAnalysis />
                        </LiquidShell>
                    )}
                    {activeTab === "inbox" && (
                        <LiquidShell title="MESA DE VENDAS" subtitle="INBOX PRIORITÁRIO" headerCenter={platformLogo} action={actionsBar}>
                            <UnifiedInbox />
                        </LiquidShell>
                    )}
                    {activeTab === "profile" && (
                        <LiquidShell title="PERFIL" subtitle="GERENCIAMENTO DE CONTA" headerCenter={platformLogo} action={actionsBar}>
                            <ProfilePage />
                        </LiquidShell>
                    )}
                    {!(["home", "ads", "ads_metrics", "social", "concorrentes", "inbox", "settings", "profile"] as string[]).includes(activeTab) && children}
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
            className="w-8 h-8 rounded-full flex items-center justify-center relative transition-all text-white/50 hover:text-white hover:bg-white/10"
        >
            <div className="relative z-10">
                {children}
            </div>
            {badge && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500 z-20" />
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

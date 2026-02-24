"use client";

import { useMemo, useState } from "react";
import { formatNumber, type Competitor } from "./SocialInsights";
import { generateMockCompetitors } from "./mockInsightsData";

export default function CompetitorsAnalysis() {
    // In a real scenario, this would fetch data from an API
    // For now, we use the mock data generator
    const competitors = useMemo(() => generateMockCompetitors(), []);

    const [activeTab, setActiveTab] = useState("analise");
    const [selectedSwotCompetitor, setSelectedSwotCompetitor] = useState<Competitor | null>(null);
    const [selectedAudienceCompetitor, setSelectedAudienceCompetitor] = useState<Competitor | null>(null);

    // State for Top Posts Table
    const [showClient, setShowClient] = useState(true);
    const [selectedCompetitorIds, setSelectedCompetitorIds] = useState<string[]>([]);

    // Initialize/Sync selected competitors
    useMemo(() => {
        if (competitors && competitors.length > 0 && selectedCompetitorIds.length === 0) {
            setSelectedCompetitorIds(competitors.map(c => c.id));
        }
    }, [competitors]);

    useMemo(() => {
        if (competitors && competitors.length > 0) {
            if (!selectedSwotCompetitor) setSelectedSwotCompetitor(competitors[0]);
            if (!selectedAudienceCompetitor) setSelectedAudienceCompetitor(competitors[0]);
        }
    }, [competitors, selectedSwotCompetitor, selectedAudienceCompetitor]);

    const { clientPosts, competitorPosts, allPosts } = useMemo(() => {
        // 1. Client Posts (Mocked for context)
        const cPosts = [
            {
                id: 'client-1',
                image: "https://placehold.co/400x400/png?text=Client+1",
                message: "Nossa estratégia de inbound marketing gerou 3x mais leads qualificados este mês...",
                date: "14/02/2026",
                likes: 1250,
                comments: 45,
                shares: 32,
                reach: 15400,
                impressions: 18200,
                video_views: 0,
                link_clicks: 120,
                reactions: 1350,
                type: "photo",
                author: { name: "Você (bia)", avatar: "https://placehold.co/100x100/3b82f6/white?text=YOU" },
                isClient: true
            },
            {
                id: 'client-2',
                image: "https://placehold.co/400x400/png?text=Client+2",
                message: "Bastidores da nossa nova campanha! O que acharam do conceito?",
                date: "10/02/2026",
                likes: 850,
                comments: 120,
                shares: 15,
                reach: 9800,
                impressions: 11200,
                video_views: 0,
                link_clicks: 45,
                reactions: 920,
                type: "carousel",
                author: { name: "Você (bia)", avatar: "https://placehold.co/100x100/3b82f6/white?text=YOU" },
                isClient: true
            },
            {
                id: 'client-3',
                image: "https://placehold.co/400x400/png?text=Client+3",
                message: "Tutorial rápido: Como aumentar o engajamento nos stories em 3 passos.",
                date: "08/02/2026",
                likes: 2100,
                comments: 340,
                shares: 512,
                reach: 45000,
                impressions: 52000,
                video_views: 38000,
                link_clicks: 890,
                reactions: 2300,
                type: "video",
                author: { name: "Você (bia)", avatar: "https://placehold.co/100x100/3b82f6/white?text=YOU" },
                isClient: true
            }
        ];

        // 2. Competitor Posts - Get TOP 3 for each
        const compPosts = competitors.flatMap(comp => {
            if (!selectedCompetitorIds.includes(comp.id)) return [];

            // Sort by engagement (likes + comments) and take top 3
            const top3 = (comp.topPosts || [])
                .sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments))
                .slice(0, 3)
                .map(post => ({
                    ...post,
                    author: { name: comp.name, avatar: comp.avatar },
                    isClient: false
                }));
            return top3;
        });

        // 3. Filter Client Posts
        const filteredClientPosts = showClient
            ? cPosts.sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments)).slice(0, 3)
            : [];

        // 4. Merge & Sort Global List
        const merged = [...filteredClientPosts, ...compPosts]
            .sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments))
            .slice(0, 30); // Cap at 30

        return { clientPosts: cPosts, competitorPosts: compPosts, allPosts: merged };
    }, [competitors, showClient, selectedCompetitorIds]);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'video': return <span className="text-[var(--foreground)]" title="Reels">🎥</span>;
            case 'carousel': return <span className="text-[var(--foreground)]" title="Carrossel">🎠</span>;
            default: return <span className="text-[var(--muted)]" title="Foto">📷</span>;
        }
    };
    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'video': return 'Reels';
            case 'carousel': return 'Carrossel';
            default: return 'Foto';
        }
    };


    const TABS = [
        { id: "analise", label: "Análise" },
        { id: "swot", label: "Matriz SWOT" },
        { id: "publicacoes", label: "Publicações" },
        { id: "publico", label: "Público" },
    ];

    if (!competitors || competitors.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center p-20 text-center text-[var(--muted)]">
                Nenhum dado de concorrente disponível.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* TABS NAVIGATION */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex items-center p-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full shadow-inner overflow-x-auto hide-scrollbar">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    relative px-5 py-2 text-sm font-semibold transition-all duration-300 rounded-full flex items-center justify-center whitespace-nowrap
                                    ${isActive
                                        ? "bg-white/20 text-[var(--foreground)] shadow-[0_2px_10px_rgba(0,0,0,0.1),inset_0_1px_rgba(255,255,255,0.4)]"
                                        : "text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-white/10"
                                    }
                                `}
                            >
                                <span className="relative z-10">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* TAB CONTENT: ANÁLISE (Existing Dashboard) */}
            {activeTab === "analise" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
                    {/* 1. TOP METRICS CARDS (AVERAGES) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="liquid-glass p-5 flex flex-col justify-between hover:border-white/20/20 transition-all group">
                            <h3 className="text-[var(--muted)] text-[10px] font-bold uppercase tracking-widest mb-4">Média de Seguidores</h3>
                            <div>
                                <div className="text-3xl font-black text-[var(--foreground)] tracking-tighter leading-none mb-2">
                                    {formatNumber(Math.round(competitors.reduce((acc: number, c: Competitor) => acc + c.followers, 0) / competitors.length))}
                                </div>
                                <div className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wide">Benchmarking do setor</div>
                            </div>
                        </div>
                        <div className="liquid-glass p-5 flex flex-col justify-between hover:border-white/20/20 transition-all group">
                            <h3 className="text-[var(--muted)] text-[10px] font-bold uppercase tracking-widest mb-4">Engajamento Médio</h3>
                            <div>
                                <div className="text-3xl font-black text-[var(--foreground)] tracking-tighter leading-none mb-2">
                                    {(competitors.reduce((acc: number, c: Competitor) => acc + c.engagementRate, 0) / competitors.length).toFixed(2)}%
                                </div>
                                <div className="text-[10px] text-[var(--foreground)] font-bold uppercase tracking-wide">Performance de conteúdo</div>
                            </div>
                        </div>
                        <div className="liquid-glass p-5 flex flex-col justify-between hover:border-white/20/20 transition-all group">
                            <h3 className="text-[var(--muted)] text-[10px] font-bold uppercase tracking-widest mb-4">Freq. de Postagem</h3>
                            <div>
                                <div className="text-3xl font-black text-[var(--foreground)] tracking-tighter leading-none mb-2">
                                    {Math.round(competitors.reduce((acc: number, c: Competitor) => acc + c.totalPosts, 0) / competitors.length)}
                                </div>
                                <div className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wide">Posts por mês</div>
                            </div>
                        </div>
                        <div className="liquid-glass p-5 flex flex-col justify-between hover:border-white/20/20 transition-all group">
                            <h3 className="text-[var(--muted)] text-[10px] font-bold uppercase tracking-widest mb-4">Crescimento Médio</h3>
                            <div>
                                <div className="text-3xl font-black text-[var(--foreground)] tracking-tighter leading-none mb-2">
                                    +{(competitors.reduce((acc: number, c: Competitor) => acc + c.followersChange, 0) / competitors.length).toFixed(1)}%
                                </div>
                                <div className="text-[10px] text-[var(--foreground)] font-bold uppercase tracking-wide">Aquisição de novos usuários</div>
                            </div>
                        </div>
                    </div>

                    {/* 2. COMPETITOR COMPARISON TABLE */}
                    <div className="liquid-glass overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-[var(--shell-border)] bg-[var(--shell-side)]">
                            <h3 className="text-3xl font-black text-[var(--foreground)] tracking-tighter leading-none mb-2">Análise Comparativa</h3>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]">Detalhamento de performance por concorrente.</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs whitespace-nowrap">
                                <thead className="bg-[var(--shell-surface)] border-b border-[var(--shell-border)]">
                                    <tr className="text-[var(--muted)] font-bold uppercase tracking-wider">
                                        <th className="px-6 py-4">Concorrente</th>
                                        <th className="px-6 py-4 text-right">Seguidores</th>
                                        <th className="px-6 py-4 text-right">Cresc. (%)</th>
                                        <th className="px-6 py-4 text-right">Engaj. (%)</th>
                                        <th className="px-6 py-4 text-right">Total Posts</th>
                                        <th className="px-6 py-4 text-right">Posts Semanais</th>
                                        <th className="px-6 py-4 text-right">Total Curtidas</th>
                                        <th className="px-6 py-4 text-right">Total Comentários</th>
                                        <th className="px-6 py-4 text-right">Média Interações/Post</th>
                                        <th className="px-6 py-4 text-right">Saldo Absoluto</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--shell-border)]">
                                    {competitors.map((competitor: Competitor) => (
                                        <tr key={competitor.id} className="hover:bg-[var(--shell-side)] transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <img src={competitor.avatar} alt={competitor.name} className="w-8 h-8 rounded-full border border-[var(--shell-border)] shadow-sm" />
                                                    <span className="font-bold text-[var(--foreground)]">{competitor.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-bold text-[var(--foreground)]">
                                                {formatNumber(competitor.followers)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono">
                                                <span className={competitor.followersChange >= 0 ? "text-[var(--foreground)]" : "text-[var(--foreground)]"}>
                                                    {competitor.followersChange > 0 ? "+" : ""}{competitor.followersChange.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-[var(--foreground)]">
                                                {competitor.engagementRate.toFixed(2)}%
                                                <div className={`text-[10px] ${competitor.engagementChange >= 0 ? "text-[var(--foreground)]" : "text-[var(--foreground)]"}`}>
                                                    {competitor.engagementChange > 0 ? "↑" : "↓"} {Math.abs(competitor.engagementChange).toFixed(1)}%
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-[var(--muted)]">
                                                {competitor.totalPosts}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-[var(--muted)]">
                                                {competitor.weeklyPosts}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-[var(--muted)]">
                                                {formatNumber(competitor.totalLikes)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-[var(--muted)]">
                                                {formatNumber(competitor.totalComments)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-[var(--muted)]">
                                                {competitor.avgInteractions}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono">
                                                <span className="text-[var(--foreground)] font-bold">
                                                    +{formatNumber(competitor.recentGrowth)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            )}

            {/* TAB CONTENT: MATRIZ SWOT */}
            {activeTab === "swot" && selectedSwotCompetitor && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
                    {/* COMPETITOR SELECTOR */}
                    <div className="flex items-center p-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full shadow-inner overflow-x-auto hide-scrollbar w-fit mb-4">
                        {competitors.map((competitor) => {
                            const isSelected = selectedSwotCompetitor.id === competitor.id;
                            return (
                                <button
                                    key={competitor.id}
                                    onClick={() => setSelectedSwotCompetitor(competitor)}
                                    className={`
                                        relative px-4 py-2 text-xs font-bold transition-all duration-300 rounded-full flex items-center gap-2 whitespace-nowrap
                                        ${isSelected
                                            ? "bg-white/20 text-[var(--foreground)] shadow-[0_2px_10px_rgba(0,0,0,0.1),inset_0_1px_rgba(255,255,255,0.4)]"
                                            : "text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-white/10"
                                        }
                                    `}
                                >
                                    <img src={competitor.avatar} alt="" className={`w-4 h-4 rounded-full ${!isSelected ? 'grayscale opacity-50' : ''}`} />
                                    <span>{competitor.name}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* STRATEGIC INSIGHT CARD */}
                    <div className="liquid-glass p-6 border border-white/20/30 bg-white/10/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-24 h-24 text-[var(--foreground)]">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                            </svg>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--foreground)] mb-2 flex items-center gap-2">
                                <span className="bg-white/10 text-[var(--foreground)] text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                                    </svg>
                                    BIA INTELLIGENCE
                                </span>
                                Recomendação Estratégica
                            </h3>
                            <div className="text-lg text-[var(--foreground)] font-medium leading-relaxed whitespace-pre-line">
                                {selectedSwotCompetitor.strategicInsight}
                            </div>
                        </div>
                    </div>

                    {/* SWOT MATRIX GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* FORÇAS (Internal / Positive) */}
                        <div className="liquid-glass p-6 border-t-4 border-t-emerald-500 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-black text-[var(--foreground)] tracking-tighter">FORÇAS</h3>
                                <span className="text-[10px] uppercase font-bold text-[var(--foreground)] bg-white/10/10 px-2 py-1 rounded">Interno • Positivo</span>
                            </div>
                            <ul className="space-y-3 flex-1">
                                {selectedSwotCompetitor.swot.strengths.map((item, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-[var(--foreground)] bg-[var(--shell-side)] p-3 rounded-lg border border-[var(--shell-border)]">
                                        <span className="text-[var(--foreground)] font-bold">✓</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* FRAQUEZAS (Internal / Negative) */}
                        <div className="liquid-glass p-6 border-t-4 border-t-amber-500 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-black text-[var(--foreground)] tracking-tighter">FRAQUEZAS</h3>
                                <span className="text-[10px] uppercase font-bold text-[var(--foreground)] bg-[var(--shell-border)]/10 px-2 py-1 rounded">Interno • Negativo</span>
                            </div>
                            <ul className="space-y-3 flex-1">
                                {selectedSwotCompetitor.swot.weaknesses.map((item, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-[var(--foreground)] bg-[var(--shell-side)] p-3 rounded-lg border border-[var(--shell-border)]">
                                        <span className="text-[var(--foreground)] font-bold">!</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* OPORTUNIDADES (External / Positive) */}
                        <div className="liquid-glass p-6 border-t-4 border-t-blue-500 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-black text-[var(--foreground)] tracking-tighter">OPORTUNIDADES</h3>
                                <span className="text-[10px] uppercase font-bold text-[var(--foreground)] bg-white/10/10 px-2 py-1 rounded">Externo • Positivo</span>
                            </div>
                            <ul className="space-y-3 flex-1">
                                {selectedSwotCompetitor.swot.opportunities.map((item, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-[var(--foreground)] bg-[var(--shell-side)] p-3 rounded-lg border border-[var(--shell-border)]">
                                        <span className="text-[var(--foreground)] font-bold">★</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* AMEAÇAS (External / Negative) */}
                        <div className="liquid-glass p-6 border-t-4 border-t-purple-500 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-black text-[var(--foreground)] tracking-tighter">AMEAÇAS</h3>
                                <span className="text-[10px] uppercase font-bold text-[var(--foreground)] bg-[var(--shell-border)]/10 px-2 py-1 rounded">Externo • Negativo</span>
                            </div>
                            <ul className="space-y-3 flex-1">
                                {selectedSwotCompetitor.swot.threats.map((item, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-[var(--foreground)] bg-[var(--shell-side)] p-3 rounded-lg border border-[var(--shell-border)]">
                                        <span className="text-[var(--foreground)] font-bold">⚠</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "publicacoes" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex flex-col gap-6">
                        <div className="liquid-glass p-6 rounded-3xl">
                            <h3 className="text-lg font-black tracking-tight mb-4 text-[var(--foreground)]">Ranking de Melhores Posts</h3>

                            {/* FILTERS TOOLBAR */}
                            <div className="flex flex-wrap gap-2 mb-6 items-center">
                                <span className="text-xs font-bold text-[var(--muted)] uppercase mr-2">Comparar:</span>

                                {/* Client Toggle */}
                                <button
                                    onClick={() => setShowClient(!showClient)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${showClient
                                        ? 'bg-white/10/20 text-[var(--foreground)] border-white/20/50 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                                        : 'bg-[var(--shell-side)] text-[var(--muted)] border-[var(--shell-border)] hover:bg-[var(--shell-side)]'
                                        }`}
                                >
                                    Você (bia)
                                </button>

                                <div className="flex items-center p-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full shadow-inner overflow-x-auto hide-scrollbar w-fit mb-4">
                                    {/* Competitor Toggles */}
                                    {competitors.map(comp => {
                                        const isSelected = selectedCompetitorIds.includes(comp.id);
                                        return (
                                            <button
                                                key={comp.id}
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setSelectedCompetitorIds(selectedCompetitorIds.filter(id => id !== comp.id));
                                                    } else {
                                                        setSelectedCompetitorIds([...selectedCompetitorIds, comp.id]);
                                                    }
                                                }}
                                                className={`
                                                relative px-4 py-2 text-xs font-bold transition-all duration-300 rounded-full flex items-center gap-2 whitespace-nowrap
                                                ${isSelected
                                                        ? "bg-white/20 text-[var(--foreground)] shadow-[0_2px_10px_rgba(0,0,0,0.1),inset_0_1px_rgba(255,255,255,0.4)]"
                                                        : "text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-white/10"
                                                    }
                                            `}
                                            >
                                                <img src={comp.avatar} className={`w-4 h-4 rounded-full ${!isSelected ? 'grayscale opacity-50' : ''}`} alt="" />
                                                {comp.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* TABLE */}
                            <div className="overflow-x-auto rounded-xl border border-[var(--shell-border)]">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-[var(--shell-surface)]">
                                        <tr className="border-b border-[var(--shell-border)] font-bold uppercase tracking-wider text-[var(--muted)] text-[10px]">
                                            <th className="py-3 pl-4">#</th>
                                            <th className="py-3 px-2">Autor</th>
                                            <th className="py-3 px-2">Post</th>
                                            <th className="py-3 px-2 text-center">Tipo</th>
                                            <th className="py-3 px-2">Conteúdo</th>
                                            <th className="py-3 px-2">Data</th>
                                            <th className="py-3 text-right px-2">Alcance</th>
                                            <th className="py-3 text-right px-2">Reações</th>
                                            <th className="py-3 text-right px-2">Coment.</th>
                                            <th className="py-3 text-right px-2">Compart.</th>
                                            <th className="py-3 text-right px-2">Views</th>
                                            <th className="py-3 text-right px-2">Cliques</th>
                                            <th className="py-3 text-right pr-4">Engajamento</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--shell-border)] bg-[var(--shell-side)]">
                                        {allPosts.map((post, index) => {
                                            const engagementRate = post.reach > 0 ? ((post.reactions + post.comments + post.shares) / post.reach) * 100 : 0;
                                            const isTop3 = index < 3;

                                            return (
                                                <tr
                                                    key={post.id}
                                                    className={`
                                                        group transition-colors hover:bg-[var(--shell-surface)]
                                                        ${post.isClient ? 'bg-white/10/5 hover:bg-white/10/10' : ''}
                                                    `}
                                                >
                                                    <td className="py-3 pl-4 text-xs font-black text-[var(--muted)]">
                                                        {isTop3 ? <span className="text-[var(--foreground)]">#{index + 1}</span> : `#${index + 1}`}
                                                    </td>
                                                    <td className="py-3 px-2">
                                                        <div className="flex items-center gap-2">
                                                            <img src={post.author.avatar} alt="" className="w-6 h-6 rounded-full border border-[var(--shell-border)]" />
                                                            <span className={`text-xs font-bold truncate max-w-[120px] ${post.isClient ? 'text-[var(--foreground)]' : 'text-[var(--muted)]'}`}>
                                                                {post.author.name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-2">
                                                        <div className="w-10 h-10 rounded-lg bg-[var(--shell-side)] overflow-hidden relative shrink-0 border border-[var(--shell-border)]">
                                                            <img src={post.image} alt="" className="w-full h-full object-cover" />
                                                            {post.type === 'video' && (
                                                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                                    <div className="w-0 h-0 border-t-[3px] border-t-transparent border-l-[6px] border-l-white border-b-[3px] border-b-transparent ml-0.5"></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-2 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-base">{getTypeIcon(post.type)}</span>
                                                            <span className="text-[9px] text-[var(--muted)] uppercase font-bold mt-0.5">{getTypeLabel(post.type)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-2">
                                                        <p className="font-medium truncate max-w-[180px] text-[var(--foreground)] text-xs" title={post.message}>
                                                            {post.message}
                                                        </p>
                                                    </td>
                                                    <td className="py-3 px-2 text-[10px] text-[var(--muted)] font-mono">{post.date}</td>
                                                    <td className="py-3 text-right px-2 font-mono text-xs text-[var(--foreground)]">{formatNumber(post.reach || 0)}</td>
                                                    <td className="py-3 text-right px-2 font-mono text-xs text-[var(--foreground)]">{formatNumber(post.likes || post.reactions || 0)}</td>
                                                    <td className="py-3 text-right px-2 font-mono text-xs text-[var(--muted)]">{formatNumber(post.comments || 0)}</td>
                                                    <td className="py-3 text-right px-2 font-mono text-xs text-[var(--muted)]">{formatNumber(post.shares || 0)}</td>
                                                    <td className="py-3 text-right px-2 font-mono text-xs text-[var(--foreground)]">{post.video_views ? formatNumber(post.video_views) : '-'}</td>
                                                    <td className="py-3 text-right px-2 font-mono text-xs text-[var(--muted)]">{post.link_clicks ? formatNumber(post.link_clicks) : '-'}</td>
                                                    <td className="py-3 text-right pr-4">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <span className="text-xs font-black text-[var(--foreground)]">{engagementRate.toFixed(1)}%</span>
                                                            <div className="w-12 h-1.5 bg-[var(--shell-side-btn)] rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full ${engagementRate > 5 ? 'bg-white/10' : 'bg-white/10'}`}
                                                                    style={{ width: `${Math.min(100, engagementRate * 10)}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: PÚBLICO */}
            {activeTab === "publico" && selectedAudienceCompetitor && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
                    {/* COMPETITOR SELECTOR */}
                    <div className="flex items-center p-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full shadow-inner overflow-x-auto hide-scrollbar w-fit mb-4">
                        {competitors.map((competitor) => {
                            const isSelected = selectedAudienceCompetitor.id === competitor.id;
                            return (
                                <button
                                    key={competitor.id}
                                    onClick={() => setSelectedAudienceCompetitor(competitor)}
                                    className={`
                                        relative px-4 py-2 text-xs font-bold transition-all duration-300 rounded-full flex items-center gap-2 whitespace-nowrap
                                        ${isSelected
                                            ? "bg-white/20 text-[var(--foreground)] shadow-[0_2px_10px_rgba(0,0,0,0.1),inset_0_1px_rgba(255,255,255,0.4)]"
                                            : "text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-white/10"
                                        }
                                    `}
                                >
                                    <img src={competitor.avatar} alt="" className={`w-4 h-4 rounded-full ${!isSelected ? 'grayscale opacity-50' : ''}`} />
                                    <span>{competitor.name}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* DEMOGRAPHICS SECTION */}

                    {/* OVERVIEW CARDS ROW */}
                    <div className="flex overflow-x-auto pb-4 gap-6 snap-x">
                        {/* 1. NOVOS SEGUIDORES */}
                        <div className="min-w-[220px] bg-[var(--shell-surface)] border border-white/5 p-5 rounded-2xl flex flex-col justify-between snap-start">
                            <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Novos Seguidores</span>
                            <div>
                                <div className="text-4xl font-black text-[var(--foreground)] tracking-tighter">+{formatNumber(selectedAudienceCompetitor.audience?.newFollowers || 0)}</div>
                                <div className="text-[10px] font-bold text-[var(--foreground)] uppercase mt-1">+{selectedAudienceCompetitor.audience?.newFollowersGrowth?.toFixed(1)}% no período</div>
                            </div>
                        </div>

                        {/* 2. TOTAL DE SEGUIDORES */}
                        <div className="min-w-[220px] bg-[var(--shell-surface)] border border-white/5 p-5 rounded-2xl flex flex-col justify-between snap-start">
                            <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Total de Seguidores</span>
                            <div>
                                <div className="text-4xl font-black text-[var(--foreground)] tracking-tighter">{formatNumber(selectedAudienceCompetitor.followers)}</div>
                                <div className="text-[10px] font-bold text-[var(--foreground)] uppercase mt-1">Base ativa da conta</div>
                            </div>
                        </div>

                        {/* 3. BOTÔMETRO */}
                        <div className="min-w-[340px] bg-[var(--shell-surface)] border border-white/5 p-5 rounded-2xl flex flex-col justify-between snap-start">
                            <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Botômetro</span>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-bold uppercase">
                                    <span className="text-[var(--foreground)]">Reais</span>
                                    <span className="text-[var(--muted)]">{(selectedAudienceCompetitor.audience?.botometer?.real! * 100).toFixed(0)}%</span>
                                </div>
                                <div className="flex justify-between text-[10px] font-bold uppercase">
                                    <span className="text-[var(--foreground)]">Fantasmas</span>
                                    <span className="text-[var(--muted)]">{(selectedAudienceCompetitor.audience?.botometer?.ghosts! * 100).toFixed(0)}%</span>
                                </div>
                                <div className="flex justify-between text-[10px] font-bold uppercase">
                                    <span className="text-[var(--foreground)]">Bots</span>
                                    <span className="text-[var(--muted)]">{(selectedAudienceCompetitor.audience?.botometer?.bots! * 100).toFixed(0)}%</span>
                                </div>
                                {/* Progress Bar */}
                                <div className="w-full h-2 rounded-full overflow-hidden flex mt-2 bg-[var(--shell-surface)]">
                                    <div className="h-full bg-white/10" style={{ width: `${selectedAudienceCompetitor.audience?.botometer?.real! * 100}%` }}></div>
                                    <div className="h-full bg-[var(--shell-border)]" style={{ width: `${selectedAudienceCompetitor.audience?.botometer?.ghosts! * 100}%` }}></div>
                                    <div className="h-full bg-[var(--shell-border)]" style={{ width: `${selectedAudienceCompetitor.audience?.botometer?.bots! * 100}%` }}></div>
                                </div>
                            </div>
                        </div>

                        {/* 4. CLUSTER PRINCIPAL */}
                        <div className="min-w-[260px] bg-[var(--shell-surface)] border border-white/5 p-5 rounded-2xl flex flex-col justify-between snap-start">
                            <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Cluster Principal</span>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-[var(--shell-border)]/10 flex items-center justify-center border border-[var(--shell-border)]/20">
                                    <span className="text-[var(--foreground)] text-xl">♀</span>
                                </div>
                                <div className="flex flex-col justify-center">
                                    <div className="text-2xl font-black text-[var(--foreground)] tracking-tight leading-none">{selectedAudienceCompetitor.audience?.mainCluster}</div>
                                    <div className="text-[10px] font-bold text-[var(--muted)] uppercase mt-1">25-34</div>
                                </div>
                            </div>
                        </div>

                        {/* 5. FAIXA ETÁRIA PRINCIPAL */}
                        <div className="min-w-[220px] bg-[var(--shell-surface)] border border-white/5 p-5 rounded-2xl flex flex-col justify-between snap-start">
                            <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Faixa Etária Principal</span>
                            <div>
                                <div className="text-4xl font-black text-[var(--foreground)] tracking-tighter">{selectedAudienceCompetitor.audience?.mainAge}</div>
                                <div className="text-[10px] font-bold text-[var(--foreground)] uppercase mt-1">Millennials / Decisores</div>
                            </div>
                        </div>

                        {/* 6. CIDADE PRINCIPAL */}
                        <div className="min-w-[220px] bg-[var(--shell-surface)] border border-white/5 p-5 rounded-2xl flex flex-col justify-between snap-start">
                            <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Cidade Principal</span>
                            <div className="text-2xl font-black text-[var(--foreground)] tracking-tight leading-tight mt-2">{selectedAudienceCompetitor.audience?.mainCity}</div>
                        </div>

                        {/* 7. PAÍS PRINCIPAL */}
                        <div className="min-w-[220px] bg-[var(--shell-surface)] border border-white/5 p-5 rounded-2xl flex flex-col justify-between snap-start">
                            <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">País Principal</span>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-4xl">🇧🇷</span>
                                <div className="text-3xl font-black text-[var(--foreground)] tracking-tight">Brasil</div>
                            </div>
                        </div>

                        {/* 8. IDIOMA PRINCIPAL */}
                        <div className="min-w-[220px] bg-[var(--shell-surface)] border border-white/5 p-5 rounded-2xl flex flex-col justify-between snap-start">
                            <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Idioma Principal</span>
                            <div>
                                <div className="text-4xl font-black text-[var(--foreground)] tracking-tighter">{selectedAudienceCompetitor.audience?.mainLanguage}</div>
                                <div className="text-[10px] font-bold text-[var(--foreground)] uppercase mt-1">Português (BR)</div>
                            </div>
                        </div>
                    </div>

                    <div className="liquid-glass p-8 rounded-3xl border border-[var(--shell-border)]">
                        <div className="mb-8">
                            <h3 className="text-2xl font-black text-[var(--foreground)] tracking-tighter">Faixa Etária & Gênero</h3>
                            <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest mt-1">Resumo da distribuição demográfica da base.</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                            {/* CARD 1: TOTAL POR FAIXA ETÁRIA (Donut) */}
                            <div className="bg-[var(--shell-surface)] rounded-2xl p-6 border border-[var(--shell-border)] flex flex-col">
                                <h4 className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-1">Total por Faixa Etária</h4>
                                <div className="text-xl font-bold text-[var(--foreground)] mb-6">
                                    {selectedAudienceCompetitor.audience?.age.reduce((a, b) => a.value > b.value ? a : b).label} anos
                                    <span className="block text-[10px] font-normal text-[var(--muted)] mt-1">
                                        são a maioria, representando {(selectedAudienceCompetitor.audience?.age.reduce((a, b) => a.value > b.value ? a : b).value * 100).toFixed(0)}% da leitura atual.
                                    </span>
                                </div>

                                <div className="flex flex-col items-center gap-6 flex-1 justify-center">
                                    {/* Donut */}
                                    <div className="relative w-32 h-32 shrink-0">
                                        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                                            {selectedAudienceCompetitor.audience?.age.map((a, i) => {
                                                const total = 1;
                                                const value = a.value;
                                                const circumference = 2 * Math.PI * 40;
                                                const strokeDasharray = `${value * circumference} ${circumference}`;
                                                // Calculate offset based on previous segments
                                                const offsetVal = selectedAudienceCompetitor.audience?.age.slice(0, i).reduce((acc, curr) => acc + curr.value, 0) || 0;
                                                const strokeDashoffset = -offsetVal * circumference;

                                                const colors = ["#AAB3C0", "#AAB3C0", "#AAB3C0", "#AAB3C0", "#AAB3C0", "#AAB3C0", "#AAB3C0"];

                                                return (
                                                    <circle
                                                        key={a.label}
                                                        cx="50"
                                                        cy="50"
                                                        r="40"
                                                        fill="transparent"
                                                        stroke={colors[i % colors.length]}
                                                        strokeWidth="16"
                                                        strokeDasharray={strokeDasharray}
                                                        strokeDashoffset={strokeDashoffset}
                                                    />
                                                );
                                            })}
                                            {/* Inner Text */}
                                            <foreignObject x="25" y="25" width="50" height="50">
                                                <div className="w-full h-full flex items-center justify-center transform rotate-90">
                                                    <span className="text-lg font-black text-[var(--foreground)]">
                                                        {(selectedAudienceCompetitor.audience?.age.reduce((a, b) => a.value > b.value ? a : b).value * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                            </foreignObject>
                                        </svg>
                                    </div>

                                    {/* Legend */}
                                    <div className="grid grid-cols-2 gap-x-4 w-full">
                                        <div className="space-y-1.5">
                                            {selectedAudienceCompetitor.audience?.age.slice(0, 4).map((a, i) => {
                                                const colors = ['bg-white/10', 'bg-white/10', 'bg-[var(--shell-border)]', 'bg-[var(--shell-border)]', 'bg-[var(--shell-border)]', 'bg-white/10', 'bg-[var(--shell-border)]'];
                                                return (
                                                    <div key={a.label} className="flex items-center gap-3 text-[10px]">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className={`w-1.5 h-1.5 rounded-full ${colors[i % colors.length]}`}></span>
                                                            <span className="text-[var(--muted)] font-medium">{a.label}</span>
                                                        </div>
                                                        <span className="text-[var(--foreground)]/50 font-bold">{(a.value * 100).toFixed(0)}%</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="space-y-1.5">
                                            {selectedAudienceCompetitor.audience?.age.slice(4).map((a, i) => {
                                                const originalIndex = i + 4;
                                                const colors = ['bg-white/10', 'bg-white/10', 'bg-[var(--shell-border)]', 'bg-[var(--shell-border)]', 'bg-[var(--shell-border)]', 'bg-white/10', 'bg-[var(--shell-border)]'];
                                                return (
                                                    <div key={a.label} className="flex items-center gap-3 text-[10px]">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className={`w-1.5 h-1.5 rounded-full ${colors[originalIndex % colors.length]}`}></span>
                                                            <span className="text-[var(--muted)] font-medium">{a.label}</span>
                                                        </div>
                                                        <span className="text-[var(--foreground)]/50 font-bold">{(a.value * 100).toFixed(0)}%</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* CARD 2: PYRAMID CHART (Idade x Gênero) */}
                            <div className="bg-[var(--shell-surface)] rounded-2xl p-6 border border-[var(--shell-border)] lg:col-span-2 flex flex-col">
                                <h4 className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-6">Distribuição Demográfica (Idade x Gênero)</h4>

                                <div className="flex items-center justify-center gap-6 mb-4 text-[10px] font-bold uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 bg-white/10 rounded-sm"></span> Masculino
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 bg-[var(--shell-border)] rounded-sm"></span> Feminino
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col justify-center gap-3">
                                    {/* Rows */}
                                    {[...selectedAudienceCompetitor.audience?.age || []].reverse().map((ageGroup, i) => {
                                        // Simulation of split based on overall gender mock data
                                        const overallFemalePct = selectedAudienceCompetitor.audience?.gender.find(g => g.label === 'Mulheres')?.value || 0.5;
                                        // Add some randomness per age group for realism
                                        const groupFemalePct = Math.max(0.2, Math.min(0.8, overallFemalePct + (Math.random() * 0.1 - 0.05)));

                                        const maleVal = ageGroup.value * (1 - groupFemalePct);
                                        const femaleVal = ageGroup.value * groupFemalePct;

                                        // Normalize for bar width visualization (relative to max possible single-side share, e.g., 0.25)
                                        const maxBar = 0.25;

                                        return (
                                            <div key={ageGroup.label} className="flex items-center text-[10px] font-medium text-[var(--muted)]">
                                                {/* Male Side (Right Aligned) */}
                                                <div className="flex-1 flex items-center justify-end gap-2">
                                                    <span className="text-[var(--foreground)]">{(maleVal * 100).toFixed(1)}%</span>
                                                    <div className="h-4 bg-white/10 rounded-l-sm" style={{ width: `${(maleVal / maxBar) * 100}%` }}></div>
                                                </div>

                                                {/* Center Label */}
                                                <div className="w-12 text-center font-bold text-[var(--foreground)] shrink-0">
                                                    {ageGroup.label}
                                                </div>

                                                {/* Female Side (Left Aligned) */}
                                                <div className="flex-1 flex items-center justify-start gap-2">
                                                    <div className="h-4 bg-[var(--shell-border)] rounded-r-sm" style={{ width: `${(femaleVal / maxBar) * 100}%` }}></div>
                                                    <span className="text-[var(--foreground)]">{(femaleVal * 100).toFixed(1)}%</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* CARD 3: RESUMO DE GÊNERO */}
                            <div className="bg-[var(--shell-surface)] rounded-2xl p-6 border border-[var(--shell-border)] flex flex-col">
                                <h4 className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest mb-1">Resumo de Gênero</h4>
                                <div className="text-xl font-bold text-[var(--foreground)] mb-6">
                                    Mulheres
                                    <span className="block text-[10px] font-normal text-[var(--muted)] mt-1">
                                        são a maioria, representando {(selectedAudienceCompetitor.audience?.gender.find(g => g.label === 'Mulheres')?.value! * 100).toFixed(0)}% da leitura atual.
                                    </span>
                                </div>

                                <div className="flex flex-col items-center gap-6 flex-1 justify-center">
                                    {/* Big Donut */}
                                    <div className="relative w-32 h-32">
                                        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--foreground)" strokeWidth="12" />
                                            {selectedAudienceCompetitor.audience?.gender.map((g, i) => {
                                                const value = g.value;
                                                const circumference = 2 * Math.PI * 40;
                                                const strokeDasharray = `${value * circumference} ${circumference}`;
                                                const offsetVal = selectedAudienceCompetitor.audience?.gender.slice(0, i).reduce((acc, curr) => acc + curr.value, 0) || 0;
                                                const strokeDashoffset = -offsetVal * circumference;
                                                return (
                                                    <circle
                                                        key={g.label}
                                                        cx="50"
                                                        cy="50"
                                                        r="40"
                                                        fill="transparent"
                                                        stroke={g.label === 'Mulheres' ? "#AAB3C0" : "#AAB3C0"}
                                                        strokeWidth="12"
                                                        strokeDasharray={strokeDasharray}
                                                        strokeDashoffset={strokeDashoffset}
                                                    />
                                                );
                                            })}
                                            <foreignObject x="25" y="25" width="50" height="50">
                                                <div className="w-full h-full flex items-center justify-center transform rotate-90">
                                                    <span className="text-xl font-black text-[var(--foreground)]">
                                                        {(selectedAudienceCompetitor.audience?.gender.find(g => g.label === 'Mulheres')?.value! * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                            </foreignObject>
                                        </svg>
                                    </div>

                                    {/* Progress Bar & Legend */}
                                    <div className="w-full space-y-3">
                                        <div className="flex justify-between items-center text-[10px] font-bold">
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--shell-border)]"></span>
                                                <span className="text-[var(--muted)]">MULHERES</span>
                                            </div>
                                            <span className="text-[var(--foreground)]">{(selectedAudienceCompetitor.audience?.gender.find(g => g.label === 'Mulheres')?.value! * 100).toFixed(0)}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-[var(--shell-side)] rounded-full overflow-hidden flex">
                                            {selectedAudienceCompetitor.audience?.gender.map(g => (
                                                <div
                                                    key={g.label}
                                                    className={`h-full ${g.label === 'Mulheres' ? 'bg-[var(--shell-border)]' : 'bg-white/10'}`}
                                                    style={{ width: `${g.value * 100}%` }}
                                                ></div>
                                            ))}
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-bold">
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-white/10"></span>
                                                <span className="text-[var(--muted)]">HOMENS</span>
                                            </div>
                                            <span className="text-[var(--foreground)]">{(selectedAudienceCompetitor.audience?.gender.find(g => g.label === 'Homens')?.value! * 100).toFixed(0)}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Top Locations (Existing - Moved down) */}
                        <div className="mt-8 pt-8 border-t border-[var(--shell-border)]">


                            {/* TOP LOCATIONS */}
                            <div className="liquid-glass p-6 rounded-3xl md:col-span-2">
                                <h3 className="text-lg font-black tracking-tight mb-6 text-[var(--foreground)] flex items-center gap-2">
                                    <span className="w-1 h-6 bg-[var(--shell-border)] rounded-full"></span>
                                    Principais Localizações
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {selectedAudienceCompetitor.audience?.locations.map((loc, i) => (
                                        <div key={i} className="bento-cell bg-[var(--shell-side)] p-4 rounded-xl flex items-center justify-between">
                                            <span className="text-sm font-bold text-[var(--foreground)]">{loc.label}</span>
                                            <span className="text-sm font-black text-[var(--foreground)]">{(loc.value * 100).toFixed(1)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

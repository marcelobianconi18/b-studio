"use client";

import { useEffect, useState, useMemo } from "react";
import PeriodSelector from "@/components/PeriodSelector";
import {
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    UserGroupIcon,
    HandThumbUpIcon,
    ChatBubbleLeftEllipsisIcon,
    VideoCameraIcon,
    DocumentTextIcon,
    EyeIcon
} from "@heroicons/react/24/solid";

interface InsightsData {
    page_followers: { value: number; change: number };
    total_reactions: { value: number; change: number };
    organic_video_views: { value: number; change: number };
    engagements: { value: number; change: number };
    number_of_posts: { value: number; change: number };
    organic_impressions: { value: number; change: number };
    actions_split: { reactions: number; comments: number; shares: number };
    top_posts: Array<{
        id: string;
        image: string;
        message: string;
        date: string;
        timestamp: number;
        impressions: number;
        reach: number;
        reactions: number;
        comments: number;
        shares: number;
        video_views: number;
        link_clicks: number;
        link: string;
        reaction_breakdown: {
            like: number;
            love: number;
            haha: number;
            thankful: number;
            wow: number;
            pride: number;
            sad: number;
            angry: number;
        };
    }>;
    demographics?: {
        age: Array<{ range: string; male: number; female: number }>;
        top_cities: Array<{ city: string; count: number }>;
    };
    reactions_by_type?: { [key: string]: number };
    actions_split_changes?: { reactions: number; comments: number; shares: number; };
}

const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(0) + " mil";
    return num.toString();
};

const KPICard = ({ title, value, change, icon: Icon }: any) => (
    <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-2xl p-5 flex flex-col justify-between hover:border-blue-500/20 transition-all group">
        <div className="flex justify-between items-start mb-2">
            <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{title}</h3>
            <div className="p-2 rounded-lg bg-[var(--shell-side)] text-zinc-400 group-hover:text-blue-500 group-hover:bg-blue-500/10 transition-colors">
                <Icon className="w-4 h-4" />
            </div>
        </div>
        <div>
            <div className="text-3xl font-black text-[var(--foreground)] tracking-tight">{formatNumber(value)}</div>
            {change !== 0 && (
                <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide mt-1 ${change > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                    {change > 0 ? <ArrowTrendingUpIcon className="w-3 h-3" /> : <ArrowTrendingDownIcon className="w-3 h-3" />}
                    <span>{Math.abs(change)}% vs Período Anterior</span>
                </div>
            )}
        </div>
    </div>
);

// Population Pyramid Component
const PopulationPyramid = ({ data }: { data: Array<{ range: string; male: number; female: number }> }) => {
    const maxVal = Math.max(...data.map(d => Math.max(d.male, d.female)));

    return (
        <div className="flex flex-col w-full h-full px-4 justify-center">
            {/* Legend */}
            <div className="flex justify-center gap-6 mb-8">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-[10px] font-bold uppercase text-zinc-500">Feminino</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-[10px] font-bold uppercase text-zinc-500">Masculino</span>
                </div>
            </div>

            {/* Pyramid */}
            <div className="space-y-4 w-full max-w-lg mx-auto">
                {[...data].reverse().map((item) => (
                    <div key={item.range} className="flex items-center w-full h-8 group hover:scale-[1.02] transition-transform">

                        {/* Female Side (Left) */}
                        <div className="flex-1 flex justify-end items-center pr-4 relative">
                            <span className="mr-3 text-xs text-zinc-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">{item.female}%</span>
                            <div
                                className="h-full bg-red-500 rounded-l-md transition-all duration-500"
                                style={{ width: `${(item.female / maxVal) * 100}%`, minWidth: '4px' }}
                            />
                        </div>

                        {/* Central Axis (Age Range) */}
                        <div className="w-20 text-center text-xs font-black text-[var(--foreground)] shrink-0 z-10 bg-[var(--shell-side)] py-1 rounded-md border border-[var(--shell-border)]">
                            {item.range}
                        </div>

                        {/* Male Side (Right) */}
                        <div className="flex-1 flex justify-start items-center pl-4 relative">
                            <div
                                className="h-full bg-blue-500 rounded-r-md transition-all duration-500"
                                style={{ width: `${(item.male / maxVal) * 100}%`, minWidth: '4px' }}
                            />
                            <span className="ml-3 text-xs text-zinc-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">{item.male}%</span>
                        </div>

                    </div>
                ))}
            </div>
        </div>
    )
}

const getPostType = (post: any) => {
    // Deterministic type assignment based on ID chars sum
    const sum = post.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const types = ['video', 'photo', 'album'];
    return types[sum % 3];
};

const SpeedometerChart = ({ title, data }: { title: string, data: { label: string, value: number, color: string }[] }) => {
    const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
    const radius = 60;
    const center = 70;
    const stroke = 12;

    const pol2cart = (x: number, y: number, r: number, deg: number) => {
        const rad = (deg * Math.PI) / 180.0;
        return { x: x + r * Math.cos(rad), y: y + r * Math.sin(rad) };
    };

    let currentAngle = 180;

    const segments = data.map(d => {
        const percent = d.value / total;
        const deg = percent * 180;
        const start = currentAngle;
        const end = currentAngle + deg;
        currentAngle += deg;
        return { ...d, start, end, percent };
    });

    const winner = segments.reduce((p, c) => (p.value > c.value ? p : c));
    const needleAngle = winner.start + (winner.end - winner.start) / 2;

    return (
        <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-2xl p-4 flex flex-col items-center justify-between h-full relative overflow-hidden group hover:border-blue-500/20 transition-all">
            <h5 className="text-[10px] uppercase font-bold text-zinc-500 mb-4 text-center tracking-wider">{title}</h5>

            <div className="relative h-[70px] w-[140px] flex justify-center mb-2">
                <svg width="140" height="70" className="overflow-visible">
                    <path d={`M ${pol2cart(center, center, radius, 180).x} ${pol2cart(center, center, radius, 180).y} A ${radius} ${radius} 0 0 1 ${pol2cart(center, center, radius, 360).x} ${pol2cart(center, center, radius, 360).y}`} fill="none" stroke="var(--shell-border)" strokeWidth={stroke} opacity={0.3} />

                    {segments.map((s, i) => {
                        const startPt = pol2cart(center, center, radius, s.start);
                        const endPt = pol2cart(center, center, radius, s.end);
                        const largeArc = s.end - s.start <= 180 ? 0 : 1;
                        return (
                            <path
                                key={i}
                                d={`M ${startPt.x} ${startPt.y} A ${radius} ${radius} 0 ${largeArc} 1 ${endPt.x} ${endPt.y}`}
                                fill="none"
                                stroke={s.color}
                                strokeWidth={stroke}
                                className="transition-all duration-500 hover:opacity-80"
                            />
                        );
                    })}

                    <g transform={`translate(${center}, ${center}) rotate(${needleAngle})`} className="transition-transform duration-1000 ease-out">
                        <line x1="0" y1="0" x2="0" y2={-(radius + 5)} stroke="var(--foreground)" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="0" cy="0" r="3" fill="var(--foreground)" />
                    </g>
                </svg>
            </div>

            <div className="flex flex-col items-center mt-auto">
                <div className="text-[9px] text-zinc-500 uppercase font-medium">Dominante</div>
                <div className="text-sm font-black mt-0.5 flex items-center gap-1.5" style={{ color: winner.color }}>
                    {winner.label}
                    <span className="text-[10px] bg-zinc-800 px-1 rounded opacity-80 text-white">{(winner.percent * 100).toFixed(0)}%</span>
                </div>
            </div>

            <div className="flex gap-2 mt-3 pt-3 border-t border-[var(--shell-border)] w-full justify-center">
                {data.map((d, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: d.color }} title={d.label}></div>
                ))}
            </div>
        </div>
    );
};

const TAB_ITEMS = [
    { id: "geral", label: "Geral" },
    { id: "publicacoes", label: "Publicações" },
    { id: "publico", label: "Público" },
];

export default function SocialInsights() {
    const [data, setData] = useState<InsightsData | null>(null);

    const speedData = useMemo(() => {
        if (!data || !data.top_posts) return null;

        const stats: any = {
            video: { count: 0, reach: 0, engagement: 0, clicks: 0, label: 'Vídeo', color: '#facc15' },
            photo: { count: 0, reach: 0, engagement: 0, clicks: 0, label: 'Foto', color: '#ef4444' },
            album: { count: 0, reach: 0, engagement: 0, clicks: 0, label: 'Álbum', color: '#22c55e' }
        };

        data.top_posts.forEach((p: any) => {
            const type = getPostType(p) as 'video' | 'photo' | 'album';
            const s = stats[type];
            if (s) {
                s.count++;
                s.reach += p.reach;
                s.engagement += (p.reactions + p.comments + p.shares);
                s.clicks += p.link_clicks || 0;
            }
        });

        const getAvg = (s: any) => s.count ? s.reach / s.count : 0;

        return {
            reach: [
                { label: 'Vídeo', value: getAvg(stats.video), color: stats.video.color },
                { label: 'Foto', value: getAvg(stats.photo), color: stats.photo.color },
                { label: 'Álbum', value: getAvg(stats.album), color: stats.album.color }
            ],
            engagement: [
                { label: 'Vídeo', value: stats.video.engagement, color: stats.video.color },
                { label: 'Foto', value: stats.photo.engagement, color: stats.photo.color },
                { label: 'Álbum', value: stats.album.engagement, color: stats.album.color }
            ],
            clicks: [
                { label: 'Vídeo', value: stats.video.clicks, color: stats.video.color },
                { label: 'Foto', value: stats.photo.clicks, color: stats.photo.color },
                { label: 'Álbum', value: stats.album.clicks, color: stats.album.color }
            ]
        };
    }, [data]);
    const [activeTab, setActiveTab] = useState("geral");
    const [reactionsPage, setReactionsPage] = useState(0);
    const [performancePage, setPerformancePage] = useState(0);
    const [visibleMetrics, setVisibleMetrics] = useState({
        reach: true,
        reactions: true,
        comments: true,
        shares: true
    });
    const [visibleReactions, setVisibleReactions] = useState({
        total: true,
        like: true,
        love: true,
        haha: true,
        wow: true,
        sad: true,
        angry: true
    });
    const ITEMS_PER_PAGE = 5;

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Mock data generation for demo purposes if fetch fails or for dev
                const generateMockPosts = () => {
                    return Array.from({ length: 15 }).map((_, i) => ({
                        id: (i + 1).toString(),
                        image: "https://placehold.co/100x100/png",
                        message: i === 0 ? "Para de andar na BR e vai trabalhar, Nikolas! ..." : i === 1 ? "2026 tá aí já! ..." : `Postagem Exemplo ${i + 1} sobre um tema irrelevante...`,
                        date: (() => {
                            const d = new Date(2026, 0, 21 - i);
                            return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                        })(),
                        timestamp: new Date(2026, 0, 21 - i, [8, 10, 14, 16, 20][i % 5], 0).getTime(),
                        impressions: 0,
                        reach: 38000 - (i * 2000) + Math.floor(Math.random() * 2000),
                        reactions: 2578 - (i * 100),
                        comments: 16680 - (i * 500),
                        shares: 1657 - (i * 50),
                        video_views: 250328,
                        link_clicks: Math.floor(Math.random() * 50),
                        link: "#",
                        reaction_breakdown: {
                            like: 2139 - (i * 80),
                            love: 174 - (i * 5),
                            haha: 227 - (i * 8),
                            thankful: 0,
                            wow: 4,
                            pride: 0,
                            sad: 0,
                            angry: 34 + i
                        }
                    }));
                };

                // Simulate fetch or use expanded mock
                setData({
                    page_followers: { value: 344000, change: 0.9 },
                    total_reactions: { value: 73000, change: 0 },
                    organic_video_views: { value: 433000, change: 9.7 },
                    engagements: { value: 134000, change: 108.5 },
                    number_of_posts: { value: 157, change: -53.4 },
                    organic_impressions: { value: 0, change: 0 },
                    actions_split: { reactions: 72756, comments: 55941, shares: 5672 },
                    actions_split_changes: { reactions: -7.4, comments: 144.7, shares: -42.5 },
                    top_posts: generateMockPosts(),
                    demographics: {
                        age: [
                            { range: "13-17", male: 5, female: 6 },
                            { range: "18-24", male: 15, female: 18 },
                            { range: "25-34", male: 22, female: 25 },
                            { range: "35-44", male: 18, female: 20 },
                            { range: "45-54", male: 12, female: 14 },
                            { range: "55-64", male: 8, female: 9 },
                            { range: "65+", male: 4, female: 6 }
                        ],
                        top_cities: []
                    },
                    reactions_by_type: { photo: 9642, album: 6086, video_inline: 4508, video: 9 }
                });

            } catch (e) {
                console.error("Error fetching insights", e);
            }
        };
        fetchData();
    }, []);

    if (!data) return <div className="p-20 text-center animate-pulse text-zinc-500">Carregando Insights do Facebook...</div>;

    const maxAction = Math.max(data.actions_split.reactions, data.actions_split.comments, data.actions_split.shares);

    return (
        <div className="space-y-6 pb-20">
            {/* Tabs Navigation & Period Selector */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[var(--shell-border)] pb-1 mb-6 gap-4">
                <div className="flex items-center gap-2">
                    {TAB_ITEMS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-2 rounded-t-lg transition-colors font-bold text-sm tracking-wide ${activeTab === tab.id
                                ? "bg-[var(--shell-side)] text-blue-500 border-b-2 border-blue-500"
                                : "text-zinc-500 hover:text-[var(--foreground)] hover:bg-[var(--shell-side)]/50"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2 pr-2">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 hidden md:inline">Período:</span>
                    <PeriodSelector />
                </div>
            </div>

            {/* TAB CONTENT: GERAL */}
            {activeTab === "geral" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        <KPICard title="Seguidores da Página" value={data.page_followers.value} change={data.page_followers.change} icon={UserGroupIcon} />
                        <KPICard title="Reações Totais" value={data.total_reactions.value} change={data.total_reactions.change} icon={HandThumbUpIcon} />
                        <KPICard title="Visualizações de Vídeo" value={data.organic_video_views.value} change={data.organic_video_views.change} icon={VideoCameraIcon} />
                        <KPICard title="Engajamento" value={data.engagements.value} change={data.engagements.change} icon={ChatBubbleLeftEllipsisIcon} />
                        <KPICard title="Total de Posts" value={data.number_of_posts.value} change={data.number_of_posts.change} icon={DocumentTextIcon} />
                        <KPICard title="Impressões" value={data.organic_impressions.value} change={data.organic_impressions.change} icon={EyeIcon} />
                    </div>

                    <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-3xl p-6">
                        <h3 className="text-lg font-black italic tracking-tight mb-6">Divisão por Ações</h3>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-bold uppercase text-zinc-500">
                                    <span>Reações</span>
                                    <span>{formatNumber(data.actions_split.reactions)}</span>
                                </div>
                                <div className="h-4 w-full bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(data.actions_split.reactions / maxAction) * 100}%` }}></div>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-bold uppercase text-zinc-500">
                                    <span>Comentários</span>
                                    <span>{formatNumber(data.actions_split.comments)}</span>
                                </div>
                                <div className="h-4 w-full bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(data.actions_split.comments / maxAction) * 100}%` }}></div>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-bold uppercase text-zinc-500">
                                    <span>Compartilhamentos</span>
                                    <span>{formatNumber(data.actions_split.shares)}</span>
                                </div>
                                <div className="h-4 w-full bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(data.actions_split.shares / maxAction) * 100}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: PUBLICAÇÕES (SPLIT VIEW) */}
            {activeTab === "publicacoes" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* LEFT: DESEMPENHO (Detailed Performance Table with Pagination) */}
                    <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-3xl p-6 overflow-y-auto pr-2 flex flex-col h-full">

                        <h3 className="text-lg font-black italic tracking-tight mb-4 text-blue-500">Desempenho da Publicação</h3>

                        {/* Best Post by Reach Card */}
                        {/* Best Post by Reach Card + Engagement Stats */}
                        {(() => {
                            const bestPostPerformance = [...data.top_posts].sort((a, b) => b.reach - a.reach)[0];
                            const reachChange = 5.75;

                            return (
                                <div className="flex flex-col xl:flex-row gap-4 mb-6">
                                    {/* Left: Best Post Card */}
                                    <div className="flex-1 bg-blue-50 dark:bg-blue-500/5 rounded-xl p-4 border border-blue-100 dark:border-blue-500/20">
                                        <div className="flex items-center gap-2 mb-3 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wide">
                                            <HandThumbUpIcon className="w-4 h-4" />
                                            Melhor post por alcance
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="w-24 h-24 shrink-0 rounded-lg bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                                                <img src={bestPostPerformance.image} className="w-full h-full object-cover" alt="Best post" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 text-[10px] text-zinc-500 mb-1">
                                                    <span className="flex items-center gap-1"><span className="w-3 h-3">📅</span> {bestPostPerformance.date}</span>
                                                </div>
                                                <p className="text-xs font-medium text-[var(--foreground)] line-clamp-2 mb-2 italic">"{bestPostPerformance.message}"</p>
                                                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                                    Este post alcançou <span className="font-bold">{formatNumber(bestPostPerformance.reach)}</span> pessoas.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Engagement Stats Highlights */}
                                    <div className="w-full xl:w-1/3 bg-[var(--shell-side)] rounded-xl p-6 flex flex-col justify-center text-center border border-[var(--shell-border)]">
                                        <span className="text-zinc-500 text-xs font-bold uppercase mb-1">Total Engagement</span>
                                        <div className="flex items-center justify-center gap-2 mb-3">
                                            <span className="text-5xl font-black text-[var(--foreground)] tracking-tight">{formatNumber(data.engagements.value)}</span>
                                            <span className={`text-sm font-bold ${data.engagements.change > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {data.engagements.change > 0 ? '↑' : '↓'} {Math.abs(data.engagements.change)}%
                                            </span>
                                        </div>
                                        <div className="flex justify-center gap-4 text-[11px] text-zinc-500 font-medium pt-3 border-t border-[var(--shell-border)]">
                                            <span title="Reactions">👍 {formatNumber(data.actions_split.reactions)}</span>
                                            <span title="Comments">💬 {formatNumber(data.actions_split.comments)}</span>
                                            <span title="Shares">🔗 {formatNumber(data.actions_split.shares)}</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })()}


                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-[var(--shell-surface)] z-10">
                                    <tr className="border-b border-[var(--shell-border)] font-bold uppercase tracking-wider text-zinc-500 text-xs">
                                        <th className="pb-3 pl-2">Post</th>
                                        <th className="pb-3 px-2">Message</th>
                                        <th className="pb-3 px-2">Date</th>
                                        <th className="pb-3 text-right px-2">Imp.</th>
                                        <th className="pb-3 text-right px-2">Alcance</th>
                                        <th className="pb-3 text-right px-2">Reações</th>
                                        <th className="pb-3 text-right px-2">Coment.</th>
                                        <th className="pb-3 text-right px-2">Compart.</th>
                                        <th className="pb-3 text-right px-2">Video</th>
                                        <th className="pb-3 text-right px-2">Cliques</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--shell-border)]">
                                    {data.top_posts.slice(performancePage * ITEMS_PER_PAGE, (performancePage + 1) * ITEMS_PER_PAGE).map((post) => (
                                        <tr key={post.id} className="group hover:bg-[var(--shell-side)] transition-colors">
                                            <td className="py-3 pl-2">
                                                <div className="w-10 h-10 rounded-lg bg-zinc-800 overflow-hidden relative shrink-0">
                                                    <img src={post.image} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </td>
                                            <td className="py-3 px-2">
                                                <p className="font-bold truncate max-w-[100px] text-[var(--foreground)]" title={post.message}>{post.message}</p>
                                                <a href={post.link} className="text-[10px] text-blue-500 hover:underline block mt-0.5">Link do post</a>
                                            </td>
                                            <td className="py-3 px-2 text-xs text-zinc-500">{post.date}</td>
                                            <td className="py-3 text-right px-2 text-zinc-400 font-mono">{formatNumber(post.impressions || post.reach * 1.2)}</td>
                                            <td className="py-3 text-right px-2 font-mono text-[var(--foreground)] font-bold">{formatNumber(post.reach)}</td>
                                            <td className="py-3 text-right px-2 font-mono text-zinc-400">{formatNumber(post.reactions)}</td>
                                            <td className="py-3 text-right px-2 font-mono text-zinc-400">{formatNumber(post.comments)}</td>
                                            <td className="py-3 text-right px-2 font-mono text-zinc-400">{formatNumber(post.shares)}</td>
                                            <td className="py-3 text-right px-2 font-mono text-purple-500">{formatNumber(post.video_views)}</td>
                                            <td className="py-3 text-right px-2 font-mono text-zinc-400">{post.link_clicks}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Performance Pagination Footer */}
                        <div className="mt-4 flex items-center justify-end gap-4 border-t border-[var(--shell-border)] pt-4">
                            <span className="text-xs font-bold text-zinc-500">
                                {performancePage * ITEMS_PER_PAGE + 1} - {Math.min((performancePage + 1) * ITEMS_PER_PAGE, data.top_posts.length)} / {data.top_posts.length}
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setPerformancePage(Math.max(0, performancePage - 1))}
                                    disabled={performancePage === 0}
                                    className="p-1 rounded hover:bg-[var(--shell-side)] disabled:opacity-30 disabled:hover:bg-transparent text-zinc-400"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                        <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setPerformancePage(Math.min(Math.ceil(data.top_posts.length / ITEMS_PER_PAGE) - 1, performancePage + 1))}
                                    disabled={(performancePage + 1) * ITEMS_PER_PAGE >= data.top_posts.length}
                                    className="p-1 rounded hover:bg-[var(--shell-side)] disabled:opacity-30 disabled:hover:bg-transparent text-zinc-400"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                        <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Chart: Melhores por Interações */}
                        <div className="mb-8 mt-8">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                <h4 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                                    <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-500" />
                                    Melhores por Interações
                                </h4>
                                <div className="flex flex-wrap items-center gap-3 text-[10px] font-medium text-zinc-500">
                                    <button
                                        onClick={() => setVisibleMetrics(prev => ({ ...prev, reach: !prev.reach }))}
                                        className={`flex items-center gap-1.5 transition-all hover:opacity-80 ${visibleMetrics.reach ? 'opacity-100' : 'opacity-40 grayscale'}`}
                                    >
                                        <span className="w-2 h-2 rounded-full bg-cyan-400"></span>Alcance
                                    </button>
                                    <button
                                        onClick={() => setVisibleMetrics(prev => ({ ...prev, reactions: !prev.reactions }))}
                                        className={`flex items-center gap-1.5 transition-all hover:opacity-80 ${visibleMetrics.reactions ? 'opacity-100' : 'opacity-40 grayscale'}`}
                                    >
                                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>Reações
                                    </button>
                                    <button
                                        onClick={() => setVisibleMetrics(prev => ({ ...prev, comments: !prev.comments }))}
                                        className={`flex items-center gap-1.5 transition-all hover:opacity-80 ${visibleMetrics.comments ? 'opacity-100' : 'opacity-40 grayscale'}`}
                                    >
                                        <span className="w-2 h-2 rounded-full bg-purple-400"></span>Comentários
                                    </button>
                                    <button
                                        onClick={() => setVisibleMetrics(prev => ({ ...prev, shares: !prev.shares }))}
                                        className={`flex items-center gap-1.5 transition-all hover:opacity-80 ${visibleMetrics.shares ? 'opacity-100' : 'opacity-40 grayscale'}`}
                                    >
                                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>Compart.
                                    </button>
                                </div>
                            </div>
                            <div className="bg-[var(--shell-side)] rounded-xl p-4 border border-[var(--shell-border)] relative h-[380px]">
                                {/* Chart Container */}
                                {(() => {
                                    // Prepare Data: Sort by timestamp ascending
                                    // Prepare Data: Sort by timestamp ascending AND TAKE LAST 20
                                    const sortedPosts = [...data.top_posts]
                                        .sort((a, b) => a.timestamp - b.timestamp)
                                        .slice(-20);
                                    if (sortedPosts.length === 0) return null;

                                    const minTime = sortedPosts[0].timestamp;
                                    const maxTime = sortedPosts[sortedPosts.length - 1].timestamp;
                                    const timeRange = maxTime - minTime || 1;

                                    // Determine Max Values dynamically
                                    const rawMaxReach = Math.max(...sortedPosts.map(p => p.reach)) || 1000;
                                    // Add ~10% padding and round up to nice number
                                    const maxReach = Math.ceil((rawMaxReach * 1.1) / 100) * 100;

                                    const maxEngagement = Math.max(
                                        ...sortedPosts.map(p => Math.max(p.reactions, p.comments, p.shares))
                                    ) * 1.2 || 100;

                                    // Helper to format axis numbers
                                    const formatAxisValue = (num: number) => {
                                        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
                                        if (num >= 1000) return (num / 1000).toFixed(0) + 'k';
                                        return num.toString();
                                    };

                                    // Helper to get coordinates
                                    const getX = (ts: number) => {
                                        return ((ts - minTime) / timeRange) * 100; // Percent
                                    }
                                    const getY = (val: number, max: number) => {
                                        return 100 - ((Math.min(val, max) / max) * 100);
                                    }

                                    return (
                                        <div className="w-full h-full relative">
                                            {/* Y-Axis Grid & Labels */}
                                            <div className="absolute inset-0 flex flex-col justify-between text-[9px] text-zinc-500 pointer-events-none pb-6 pr-4">
                                                {[1, 0.75, 0.5, 0.25, 0].map((percent) => {
                                                    const val = Math.round(maxReach * percent);
                                                    return (
                                                        <div key={percent} className="flex items-center w-full relative h-0">
                                                            <span className="w-8 text-right mr-2 shrink-0">{formatAxisValue(val)}</span>
                                                            <div className="w-full h-px bg-[var(--shell-border)] border-t border-dashed border-zinc-700/30"></div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Right Axis (Engagement) - Optional visual aid */}
                                            {/* <div className="absolute top-0 right-0 bottom-24 w-px bg-zinc-800/50"></div> */}

                                            {/* Chart Area - 2 Layers: SVG Lines + HTML Overlay */}
                                            <div className="absolute top-0 left-8 right-8 bottom-24">

                                                {/* Layer 1: SVG Lines (Fixed Scale 0-100) */}
                                                <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                                                    {/* 1. REACH Line (Cyan) */}
                                                    {visibleMetrics.reach && (
                                                        <polyline
                                                            points={sortedPosts.map(p => `${getX(p.timestamp)},${getY(p.reach, maxReach)}`).join(" ")}
                                                            fill="none"
                                                            stroke="#22d3ee"
                                                            strokeWidth="0.8" // Scaled relative to 100x100 box, usually need smaller value or vector-effect
                                                            vectorEffect="non-scaling-stroke" // Keeps stroke width constant in px
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            className="drop-shadow-sm transition-all duration-300"
                                                            style={{ strokeWidth: '4px' }} // Force px width via style
                                                        />
                                                    )}

                                                    {/* 2. REACTIONS Line (Emerald) */}
                                                    {visibleMetrics.reactions && (
                                                        <polyline
                                                            points={sortedPosts.map(p => `${getX(p.timestamp)},${getY(p.reactions, maxEngagement)}`).join(" ")}
                                                            fill="none"
                                                            stroke="#34d399"
                                                            vectorEffect="non-scaling-stroke"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            className="transition-all duration-300"
                                                            style={{ strokeWidth: '4px' }}
                                                        />
                                                    )}

                                                    {/* 3. COMMENTS Line (Purple) */}
                                                    {visibleMetrics.comments && (
                                                        <polyline
                                                            points={sortedPosts.map(p => `${getX(p.timestamp)},${getY(p.comments, maxEngagement)}`).join(" ")}
                                                            fill="none"
                                                            stroke="#c084fc"
                                                            vectorEffect="non-scaling-stroke"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            className="transition-all duration-300"
                                                            style={{ strokeWidth: '4px' }}
                                                        />
                                                    )}

                                                    {/* 4. SHARES Line (Amber) */}
                                                    {visibleMetrics.shares && (
                                                        <polyline
                                                            points={sortedPosts.map(p => `${getX(p.timestamp)},${getY(p.shares, maxEngagement)}`).join(" ")}
                                                            fill="none"
                                                            stroke="#fbbf24"
                                                            vectorEffect="non-scaling-stroke"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            className="transition-all duration-300"
                                                            style={{ strokeWidth: '4px' }}
                                                        />
                                                    )}
                                                </svg>

                                                {/* Layer 2: HTML Overlay (Dots & Tooltips) */}
                                                <div className="absolute inset-0 pointer-events-none">
                                                    {sortedPosts.map((post, i) => {
                                                        const x = getX(post.timestamp);
                                                        const yReach = getY(post.reach, maxReach);

                                                        // Tooltip data
                                                        const interactions = post.reactions + post.comments + post.shares;
                                                        const dateLabel = new Date(post.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                                                        const timeLabel = new Date(post.timestamp).getHours() + 'h';

                                                        return (
                                                            <div key={post.id} className="absolute group pointer-events-auto" style={{ left: `${x}%`, top: 0, bottom: 0, width: '1px' }}>

                                                                {/* Hover/Touch Zone */}
                                                                <div className="absolute -left-4 -right-4 top-0 bottom-0 bg-transparent z-20 cursor-crosshair"></div>

                                                                {/* Points Container */}
                                                                <div className="absolute top-0 bottom-0 w-full">
                                                                    {/* Reach Dot */}
                                                                    <div
                                                                        className={`absolute -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-cyan-400 rounded-full border-2 border-[var(--shell-surface)] transition-all duration-300 group-hover:scale-150 z-30 ${visibleMetrics.reach ? 'opacity-100' : 'opacity-0'}`}
                                                                        style={{ top: `${yReach}%`, left: '50%' }}
                                                                    />

                                                                    {/* Other Metrics Dots */}
                                                                    {visibleMetrics.reactions && (
                                                                        <div
                                                                            className="absolute -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[var(--shell-surface)] z-10"
                                                                            style={{ top: `${getY(post.reactions, maxEngagement)}%`, left: '50%' }}
                                                                        />
                                                                    )}
                                                                    {visibleMetrics.comments && (
                                                                        <div
                                                                            className="absolute -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-purple-400 rounded-full border-2 border-[var(--shell-surface)] z-10"
                                                                            style={{ top: `${getY(post.comments, maxEngagement)}%`, left: '50%' }}
                                                                        />
                                                                    )}
                                                                    {visibleMetrics.shares && (
                                                                        <div
                                                                            className="absolute -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-[var(--shell-surface)] z-10"
                                                                            style={{ top: `${getY(post.shares, maxEngagement)}%`, left: '50%' }}
                                                                        />
                                                                    )}
                                                                </div>

                                                                {/* Tooltip (Positioned relative to the vertical slice) */}
                                                                <div className="absolute left-1/2 top-0 -translate-x-1/2 transform transition-all duration-200 opacity-0 group-hover:opacity-100 group-hover:translate-y-2 z-50 pointer-events-none w-0 flex justify-center">
                                                                    <div className="bg-zinc-900/95 backdrop-blur-md border border-zinc-700 text-white text-[10px] rounded-lg p-3 shadow-2xl whitespace-nowrap min-w-[180px]">
                                                                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-zinc-700">
                                                                            <span className="font-bold text-emerald-400">{dateLabel} <span className="text-zinc-500 mx-1">•</span> {timeLabel}</span>
                                                                            <span className="bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded text-[9px] font-bold">Reach: {formatNumber(post.reach)}</span>
                                                                        </div>
                                                                        <div className="font-medium text-zinc-300 mb-2 truncate max-w-[200px] italic">"{post.message}"</div>

                                                                        <div className="space-y-1">
                                                                            <div className="flex justify-between text-zinc-400">
                                                                                <span>Interações Totais:</span>
                                                                                <strong className="text-white">{formatNumber(interactions)}</strong>
                                                                            </div>
                                                                            <div className="grid grid-cols-4 gap-2 pt-2 text-[9px] text-center">
                                                                                <div className="bg-zinc-800 rounded p-1 flex flex-col items-center">
                                                                                    <div className="w-2 h-2 rounded-full bg-emerald-400 mb-1"></div>
                                                                                    <div className="font-bold text-white mt-0.5">{formatNumber(post.reactions)}</div>
                                                                                </div>
                                                                                <div className="bg-zinc-800 rounded p-1 flex flex-col items-center">
                                                                                    <div className="w-2 h-2 rounded-full bg-purple-400 mb-1"></div>
                                                                                    <div className="font-bold text-white mt-0.5">{formatNumber(post.comments)}</div>
                                                                                </div>
                                                                                <div className="bg-zinc-800 rounded p-1 flex flex-col items-center">
                                                                                    <div className="w-2 h-2 rounded-full bg-amber-400 mb-1"></div>
                                                                                    <div className="font-bold text-white mt-0.5">{formatNumber(post.shares)}</div>
                                                                                </div>
                                                                                <div className="bg-zinc-800 rounded p-1 flex flex-col items-center">
                                                                                    <div className="w-2 h-2 rounded-full bg-cyan-400 mb-1"></div>
                                                                                    <div className="font-bold text-white mt-0.5">{post.link_clicks}</div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* X-Axis Custom Timeline Labels */}
                                            <div className="absolute bottom-0 left-8 right-8 h-20 px-0 pointer-events-none">
                                                {sortedPosts.filter((_, i) => i % Math.max(1, Math.floor(sortedPosts.length / 8)) === 0).map((p, idx) => {
                                                    const date = new Date(p.timestamp);
                                                    const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();
                                                    const day = date.getDate().toString().padStart(2, '0');
                                                    const hour = date.getHours();

                                                    return (
                                                        <div key={p.id} className="absolute bottom-0 flex flex-col items-center justify-end group z-20 hover:z-50 pointer-events-auto" style={{ left: `${getX(p.timestamp)}%`, transform: 'translateX(-50%)', height: '100%' }}>
                                                            {/* Image Preview Tooltip */}
                                                            <div className="absolute bottom-[70px] left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none w-32 h-32 bg-zinc-900 rounded-lg shadow-2xl overflow-hidden border-2 border-zinc-700 z-50 transform translate-y-2 group-hover:translate-y-0">
                                                                <img src={p.image} alt={p.message} className="w-full h-full object-cover" />
                                                            </div>

                                                            {/* Vertical Dashed Line */}
                                                            <div className="absolute bottom-14 w-px border-l border-dashed border-zinc-400/30 h-[320px]"></div>

                                                            {/* Icon */}
                                                            <EyeIcon className="w-4 h-4 text-[var(--foreground)] mb-1 bg-[var(--shell-side)] relative z-10 rounded-full cursor-pointer hover:text-blue-500 transition-colors" />

                                                            {/* Time */}
                                                            <span className="text-[10px] font-mono font-bold text-zinc-500 mb-2 bg-[var(--shell-side)] relative z-10 px-1 rounded">{hour}h</span>

                                                            {/* Date Badge */}
                                                            <div className="flex flex-col border border-zinc-200/20 rounded overflow-hidden w-8 text-center shadow-sm relative z-10">
                                                                <div className="bg-red-600 text-white text-[8px] font-black uppercase py-0.5">{month}</div>
                                                                <div className="bg-white text-zinc-900 text-xs font-black py-0.5">{day}</div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )
                                })()}
                            </div>

                            {/* Speedometer Charts */}
                            {speedData && (
                                <div className="mt-8 pt-8 border-t border-[var(--shell-border)]">
                                    <h4 className="text-sm font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
                                        <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-500" />
                                        Performance por Tipo de Mídia
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 h-48">
                                        <SpeedometerChart title="Alcance Médio" data={speedData.reach} />
                                        <SpeedometerChart title="Engajamento Total" data={speedData.engagement} />
                                        <SpeedometerChart title="Cliques (Tráfego)" data={speedData.clicks} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div >

                    {/* RIGHT: REAÇÕES DESCRITIVAS DESTAQUE (Detailed Reactions) */}
                    < div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-3xl p-6 overflow-hidden flex flex-col h-full" >

                        <h3 className="text-lg font-black italic tracking-tight mb-4 text-emerald-500">Detalhamento de Reações</h3>

                        {/* HEADER: ANALYTICS WIDGETS */}
                        <div className="mb-6 space-y-6">
                            {/* 1. Best Post Card */}
                            {/* 1. Best Post Card + Total Interactions Stats */}
                            {(() => {
                                const bestPost = [...data.top_posts].sort((a, b) => (b.reactions + b.comments + b.shares) - (a.reactions + a.comments + a.shares))[0];
                                const engagement = bestPost.reactions + bestPost.comments + bestPost.shares;
                                const rate = ((engagement / bestPost.reach) * 100).toFixed(2);

                                // Stats for the right side
                                const totalInteractions = data.top_posts.reduce((acc, curr) => acc + curr.reactions + curr.comments + curr.shares, 0); const totalPosts = data.top_posts.length; const avgInteractions = Math.round(totalInteractions / (totalPosts || 1));

                                return (
                                    <div className="flex flex-col xl:flex-row gap-4">
                                        <div className="flex-1 bg-blue-50 dark:bg-blue-500/5 rounded-xl p-4 border border-blue-100 dark:border-blue-500/20">
                                            <div className="flex items-center gap-2 mb-3 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wide">
                                                <HandThumbUpIcon className="w-4 h-4" />
                                                Melhor post por engajamento
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="w-24 h-24 shrink-0 rounded-lg bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                                                    <img src={bestPost.image} className="w-full h-full object-cover" alt="Best post" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 mb-1">
                                                        <span className="flex items-center gap-1"><span className="w-3 h-3">📅</span> {bestPost.date}</span>
                                                    </div>
                                                    <p className="text-xs font-medium text-[var(--foreground)] line-clamp-2 mb-2 italic">"{bestPost.message}"</p>
                                                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                                        Taxa de engajamento de <span className="font-bold text-blue-600 dark:text-blue-400">{rate}%</span> ({formatNumber(engagement)} interações).
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Summary Stats Highlight */}
                                        <div className="w-full xl:w-1/3 bg-[var(--shell-side)] rounded-xl p-6 flex flex-col justify-center text-center border border-[var(--shell-border)]">
                                            <span className="text-zinc-500 text-xs font-bold uppercase">Total de Interações</span>
                                            <span className="text-5xl font-black text-[var(--foreground)] mt-2 mb-3">{formatNumber(totalInteractions)}</span>
                                            <div className="text-[11px] text-zinc-500 pt-3 border-t border-[var(--shell-border)]">
                                                Média: <span className="font-bold text-[var(--foreground)]">{formatNumber(avgInteractions)}</span> / post
                                            </div>
                                        </div>
                                    </div>
                                )
                            })()}


                        </div>

                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-[var(--shell-surface)] z-10">
                                    <tr className="border-b border-[var(--shell-border)] font-bold uppercase tracking-wider text-zinc-500 text-xs">
                                        <th className="pb-3 pl-2 min-w-[200px]">Post</th>
                                        <th className="pb-3 text-right px-2 text-blue-500">Total</th>
                                        <th className="pb-3 text-right px-2" title="Like"><span className="text-2xl">👍</span></th>
                                        <th className="pb-3 text-right px-2" title="Love"><span className="text-2xl">❤️</span></th>
                                        <th className="pb-3 text-right px-2" title="Haha"><span className="text-2xl">😂</span></th>
                                        <th className="pb-3 text-right px-2" title="Wow"><span className="text-2xl">😮</span></th>
                                        <th className="pb-3 text-right px-2" title="Sad"><span className="text-2xl">😢</span></th>
                                        <th className="pb-3 text-right px-2" title="Angry"><span className="text-2xl">😡</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--shell-border)]">
                                    {data.top_posts.slice(reactionsPage * ITEMS_PER_PAGE, (reactionsPage + 1) * ITEMS_PER_PAGE).map((post) => (
                                        <tr key={post.id} className="group hover:bg-[var(--shell-side)] transition-colors">
                                            <td className="py-3 pl-2 flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-zinc-800 overflow-hidden relative shrink-0">
                                                    <img src={post.image} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <div className="max-w-[180px] overflow-hidden">
                                                    <p className="font-bold truncate text-[var(--foreground)] text-sm" title={post.message}>{post.message}</p>
                                                    <a href="#" className="text-xs text-blue-500 hover:underline">Link do post</a>
                                                </div>
                                            </td>
                                            <td className="py-3 text-right px-2 font-bold text-blue-500">{formatNumber(post.reactions)}</td>
                                            <td className="py-3 text-right px-2 text-zinc-400 font-mono">{post.reaction_breakdown?.like || 0}</td>
                                            <td className="py-3 text-right px-2 text-zinc-400 font-mono">{post.reaction_breakdown?.love || 0}</td>
                                            <td className="py-3 text-right px-2 text-zinc-400 font-mono">{post.reaction_breakdown?.haha || 0}</td>
                                            <td className="py-3 text-right px-2 text-zinc-400 font-mono">{post.reaction_breakdown?.wow || 0}</td>
                                            <td className="py-3 text-right px-2 text-zinc-400 font-mono">{post.reaction_breakdown?.sad || 0}</td>
                                            <td className="py-3 text-right px-2 text-zinc-400 font-mono">{post.reaction_breakdown?.angry || 0}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        <div className="mt-4 flex items-center justify-end gap-4 border-t border-[var(--shell-border)] pt-4">
                            <span className="text-xs font-bold text-zinc-500">
                                {reactionsPage * ITEMS_PER_PAGE + 1} - {Math.min((reactionsPage + 1) * ITEMS_PER_PAGE, data.top_posts.length)} / {data.top_posts.length}
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setReactionsPage(Math.max(0, reactionsPage - 1))}
                                    disabled={reactionsPage === 0}
                                    className="p-1 rounded hover:bg-[var(--shell-side)] disabled:opacity-30 disabled:hover:bg-transparent text-zinc-400"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                        <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setReactionsPage(Math.min(Math.ceil(data.top_posts.length / ITEMS_PER_PAGE) - 1, reactionsPage + 1))}
                                    disabled={(reactionsPage + 1) * ITEMS_PER_PAGE >= data.top_posts.length}
                                    className="p-1 rounded hover:bg-[var(--shell-side)] disabled:opacity-30 disabled:hover:bg-transparent text-zinc-400"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                        <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Chart: Reaction Performance */}
                        <div className="mb-8 mt-8">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                <h4 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                                    <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-500" />
                                    Desempenho de Reações
                                </h4>
                                <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium text-zinc-500">
                                    <button onClick={() => setVisibleReactions(p => ({ ...p, total: !p.total }))} className={`flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800/50 hover:bg-zinc-800 transition-all ${visibleReactions.total ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                                        <span className="w-2 h-2 rounded-full bg-white border border-zinc-500"></span><span className="text-white">Total</span>
                                    </button>
                                    <button onClick={() => setVisibleReactions(p => ({ ...p, like: !p.like }))} className={`flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 transition-all ${visibleReactions.like ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                                        <span className="w-2 h-2 rounded-full bg-blue-400"></span><span className="text-blue-400">Like</span>
                                    </button>
                                    <button onClick={() => setVisibleReactions(p => ({ ...p, love: !p.love }))} className={`flex items-center gap-1.5 px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 transition-all ${visibleReactions.love ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                                        <span className="w-2 h-2 rounded-full bg-rose-400"></span><span className="text-rose-400">Love</span>
                                    </button>
                                    <button onClick={() => setVisibleReactions(p => ({ ...p, haha: !p.haha }))} className={`flex items-center gap-1.5 px-2 py-1 rounded bg-yellow-500/10 hover:bg-yellow-500/20 transition-all ${visibleReactions.haha ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                                        <span className="w-2 h-2 rounded-full bg-yellow-400"></span><span className="text-yellow-400">Haha</span>
                                    </button>
                                    <button onClick={() => setVisibleReactions(p => ({ ...p, wow: !p.wow }))} className={`flex items-center gap-1.5 px-2 py-1 rounded bg-orange-500/10 hover:bg-orange-500/20 transition-all ${visibleReactions.wow ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                                        <span className="w-2 h-2 rounded-full bg-orange-400"></span><span className="text-orange-400">Wow</span>
                                    </button>
                                    <button onClick={() => setVisibleReactions(p => ({ ...p, sad: !p.sad }))} className={`flex items-center gap-1.5 px-2 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 transition-all ${visibleReactions.sad ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                                        <span className="w-2 h-2 rounded-full bg-cyan-400"></span><span className="text-cyan-400">Sad</span>
                                    </button>
                                    <button onClick={() => setVisibleReactions(p => ({ ...p, angry: !p.angry }))} className={`flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 transition-all ${visibleReactions.angry ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                                        <span className="w-2 h-2 rounded-full bg-red-500"></span><span className="text-red-500">Angry</span>
                                    </button>
                                </div>
                            </div>

                            <div className="bg-[var(--shell-side)] rounded-xl p-4 border border-[var(--shell-border)] relative h-[380px]">
                                {(() => {
                                    // Use same slice logic as the list
                                    const sortedPosts = [...data.top_posts].sort((a, b) => a.timestamp - b.timestamp).slice(-20);
                                    if (sortedPosts.length === 0) return null;

                                    const minTime = sortedPosts[0].timestamp;
                                    const maxTime = sortedPosts[sortedPosts.length - 1].timestamp;
                                    const timeRange = maxTime - minTime || 1;

                                    // Calculate max Y based on TOTAL reactions
                                    const maxReactions = Math.max(...sortedPosts.map(p => p.reactions)) * 1.1 || 10;

                                    const getX = (ts: number) => ((ts - minTime) / timeRange) * 100;
                                    const getY = (val: number) => 100 - ((val / maxReactions) * 100);

                                    return (
                                        <div className="w-full h-full relative">
                                            {/* Y-Axis Grid */}
                                            <div className="absolute inset-0 flex flex-col justify-between text-[9px] text-zinc-500 pointer-events-none pb-6 pr-4">
                                                {[1, 0.5, 0].map((t) => (
                                                    <div key={t} className="flex items-center w-full relative h-0">
                                                        <span className="w-6 text-right mr-2 shrink-0">{formatNumber(Math.round(maxReactions * t))}</span>
                                                        <div className="w-full h-px bg-[var(--shell-border)] border-t border-dashed border-zinc-700/30"></div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Chart Area */}
                                            <div className="absolute top-0 left-8 right-8 bottom-24">
                                                {/* Layer 1: SVG Lines */}
                                                <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                                                    {visibleReactions.total && <polyline points={sortedPosts.map(p => `${getX(p.timestamp)},${getY(p.reactions)}`).join(" ")} fill="none" stroke="white" strokeWidth="0.5" vectorEffect="non-scaling-stroke" strokeDasharray="4 4" className="opacity-30" />}
                                                    {visibleReactions.like && <polyline points={sortedPosts.map(p => `${getX(p.timestamp)},${getY(p.reaction_breakdown?.like || 0)}`).join(" ")} fill="none" stroke="#60a5fa" strokeWidth="0.8" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" style={{ strokeWidth: '3px' }} />}
                                                    {visibleReactions.love && <polyline points={sortedPosts.map(p => `${getX(p.timestamp)},${getY(p.reaction_breakdown?.love || 0)}`).join(" ")} fill="none" stroke="#fb7185" strokeWidth="0.8" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" style={{ strokeWidth: '3px' }} />}
                                                    {visibleReactions.haha && <polyline points={sortedPosts.map(p => `${getX(p.timestamp)},${getY(p.reaction_breakdown?.haha || 0)}`).join(" ")} fill="none" stroke="#facc15" strokeWidth="0.8" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" style={{ strokeWidth: '3px' }} />}
                                                    {visibleReactions.wow && <polyline points={sortedPosts.map(p => `${getX(p.timestamp)},${getY(p.reaction_breakdown?.wow || 0)}`).join(" ")} fill="none" stroke="#fb923c" strokeWidth="0.8" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" style={{ strokeWidth: '3px' }} />}
                                                    {visibleReactions.sad && <polyline points={sortedPosts.map(p => `${getX(p.timestamp)},${getY(p.reaction_breakdown?.sad || 0)}`).join(" ")} fill="none" stroke="#22d3ee" strokeWidth="0.8" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" style={{ strokeWidth: '3px' }} />}
                                                    {visibleReactions.angry && <polyline points={sortedPosts.map(p => `${getX(p.timestamp)},${getY(p.reaction_breakdown?.angry || 0)}`).join(" ")} fill="none" stroke="#ef4444" strokeWidth="0.8" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" style={{ strokeWidth: '3px' }} />}
                                                </svg>

                                                {/* Layer 2: HTML Overlay */}
                                                <div className="absolute inset-0 pointer-events-none">
                                                    {sortedPosts.map((p) => {
                                                        const total = p.reactions;
                                                        return (
                                                            <div key={p.id} className="absolute group pointer-events-auto" style={{ left: `${getX(p.timestamp)}%`, top: 0, bottom: 0, width: '1px' }}>
                                                                <div className="absolute -left-3 -right-3 top-0 bottom-0 bg-transparent z-20 cursor-crosshair"></div>

                                                                <div className="absolute top-0 bottom-0 w-full">
                                                                    {/* Dots */}
                                                                    {visibleReactions.total && <div className="absolute -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full opacity-50" style={{ top: `${getY(total)}%`, left: '50%' }} />}
                                                                    {visibleReactions.like && <div className="absolute -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-400 rounded-full border border-[var(--shell-surface)] z-10 transition-transform group-hover:scale-150" style={{ top: `${getY(p.reaction_breakdown?.like || 0)}%`, left: '50%' }} />}
                                                                    {visibleReactions.love && <div className="absolute -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-rose-400 rounded-full border border-[var(--shell-surface)] z-10 transition-transform group-hover:scale-150" style={{ top: `${getY(p.reaction_breakdown?.love || 0)}%`, left: '50%' }} />}
                                                                    {visibleReactions.haha && <div className="absolute -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-yellow-400 rounded-full border border-[var(--shell-surface)] z-10 transition-transform group-hover:scale-150" style={{ top: `${getY(p.reaction_breakdown?.haha || 0)}%`, left: '50%' }} />}
                                                                    {visibleReactions.wow && <div className="absolute -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-orange-400 rounded-full border border-[var(--shell-surface)] z-10 transition-transform group-hover:scale-150" style={{ top: `${getY(p.reaction_breakdown?.wow || 0)}%`, left: '50%' }} />}
                                                                    {visibleReactions.sad && <div className="absolute -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-cyan-400 rounded-full border border-[var(--shell-surface)] z-10 transition-transform group-hover:scale-150" style={{ top: `${getY(p.reaction_breakdown?.sad || 0)}%`, left: '50%' }} />}
                                                                    {visibleReactions.angry && <div className="absolute -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-red-500 rounded-full border border-[var(--shell-surface)] z-10 transition-transform group-hover:scale-150" style={{ top: `${getY(p.reaction_breakdown?.angry || 0)}%`, left: '50%' }} />}
                                                                </div>

                                                                {/* Tooltip */}
                                                                <div className="absolute left-1/2 top-0 -translate-x-1/2 transform transition-all duration-200 opacity-0 group-hover:opacity-100 group-hover:translate-y-2 z-50 pointer-events-none w-0 flex justify-center">
                                                                    <div className="bg-zinc-900/95 backdrop-blur-md border border-zinc-700 text-white text-[10px] rounded-lg p-3 shadow-2xl whitespace-nowrap min-w-[180px]">
                                                                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-zinc-700">
                                                                            <span className="font-bold text-emerald-400">
                                                                                {new Date(p.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} <span className="text-zinc-500 mx-1">•</span> {new Date(p.timestamp).getHours()}h
                                                                            </span>
                                                                            <span className="bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded text-[9px] font-bold">Total: {formatNumber(total)}</span>
                                                                        </div>
                                                                        <div className="font-medium text-zinc-300 mb-2 truncate max-w-[200px] italic">"{p.message}"</div>
                                                                        <div className="grid grid-cols-6 gap-1 pt-2 text-[9px] text-center">
                                                                            <div className={`bg-zinc-800 rounded p-1 ${visibleReactions.like ? 'opacity-100' : 'opacity-40'}`}>
                                                                                <div>👍</div>
                                                                                <div className="font-bold text-blue-400 mt-0.5">{formatNumber(p.reaction_breakdown?.like || 0)}</div>
                                                                            </div>
                                                                            <div className={`bg-zinc-800 rounded p-1 ${visibleReactions.love ? 'opacity-100' : 'opacity-40'}`}>
                                                                                <div>❤️</div>
                                                                                <div className="font-bold text-rose-400 mt-0.5">{formatNumber(p.reaction_breakdown?.love || 0)}</div>
                                                                            </div>
                                                                            <div className={`bg-zinc-800 rounded p-1 ${visibleReactions.haha ? 'opacity-100' : 'opacity-40'}`}>
                                                                                <div>😂</div>
                                                                                <div className="font-bold text-yellow-400 mt-0.5">{formatNumber(p.reaction_breakdown?.haha || 0)}</div>
                                                                            </div>
                                                                            <div className={`bg-zinc-800 rounded p-1 ${visibleReactions.wow ? 'opacity-100' : 'opacity-40'}`}>
                                                                                <div>😮</div>
                                                                                <div className="font-bold text-orange-400 mt-0.5">{formatNumber(p.reaction_breakdown?.wow || 0)}</div>
                                                                            </div>
                                                                            <div className={`bg-zinc-800 rounded p-1 ${visibleReactions.sad ? 'opacity-100' : 'opacity-40'}`}>
                                                                                <div>😢</div>
                                                                                <div className="font-bold text-cyan-400 mt-0.5">{formatNumber(p.reaction_breakdown?.sad || 0)}</div>
                                                                            </div>
                                                                            <div className={`bg-zinc-800 rounded p-1 ${visibleReactions.angry ? 'opacity-100' : 'opacity-40'}`}>
                                                                                <div>😡</div>
                                                                                <div className="font-bold text-red-500 mt-0.5">{formatNumber(p.reaction_breakdown?.angry || 0)}</div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* X-Axis Custom Timeline Labels */}
                                            <div className="absolute bottom-0 left-8 right-8 h-20 px-0 pointer-events-none">
                                                {sortedPosts.filter((_, i) => i % Math.max(1, Math.floor(sortedPosts.length / 8)) === 0).map((p, idx) => {
                                                    const date = new Date(p.timestamp);
                                                    const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();
                                                    const day = date.getDate().toString().padStart(2, '0');
                                                    const hour = date.getHours();

                                                    return (
                                                        <div key={p.id} className="absolute bottom-0 flex flex-col items-center justify-end group z-20 hover:z-50 pointer-events-auto" style={{ left: `${getX(p.timestamp)}%`, transform: 'translateX(-50%)', height: '100%' }}>
                                                            {/* Image Preview Tooltip */}
                                                            <div className="absolute bottom-[70px] left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none w-32 h-32 bg-zinc-900 rounded-lg shadow-2xl overflow-hidden border-2 border-zinc-700 z-50 transform translate-y-2 group-hover:translate-y-0">
                                                                <img src={p.image} alt={p.message} className="w-full h-full object-cover" />
                                                            </div>

                                                            {/* Vertical Dashed Line */}
                                                            <div className="absolute bottom-14 w-px border-l border-dashed border-zinc-400/30 h-[320px]"></div>

                                                            {/* Icon */}
                                                            <EyeIcon className="w-4 h-4 text-[var(--foreground)] mb-1 bg-[var(--shell-side)] relative z-10 rounded-full cursor-pointer hover:text-blue-500 transition-colors" />

                                                            {/* Time */}
                                                            <span className="text-[10px] font-mono font-bold text-zinc-500 mb-2 bg-[var(--shell-side)] relative z-10 px-1 rounded">{hour}h</span>

                                                            {/* Date Badge */}
                                                            <div className="flex flex-col border border-zinc-200/20 rounded overflow-hidden w-8 text-center shadow-sm relative z-10">
                                                                <div className="bg-red-600 text-white text-[8px] font-black uppercase py-0.5">{month}</div>
                                                                <div className="bg-white text-zinc-900 text-xs font-black py-0.5">{day}</div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                    </div>
                </div>
            )
            }

            {/* TAB CONTENT: PÚBLICO */}
            {
                activeTab === "publico" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-3xl p-6 flex flex-col justify-center relative min-h-[500px]">
                            <h3 className="absolute top-6 left-6 text-lg font-black italic tracking-tight">Faixa Etária & Gênero (Funil)</h3>
                            {data.demographics && (
                                <div className="mt-8 w-full h-full flex items-center">
                                    <PopulationPyramid data={data.demographics.age} />
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
        </div >
    );
}

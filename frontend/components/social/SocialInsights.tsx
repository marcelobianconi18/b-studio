"use client";

import { useEffect, useState, useMemo, type ComponentType, type MouseEvent as ReactMouseEvent } from "react";
import PeriodSelector, { type PeriodValue } from "@/components/PeriodSelector";
import dynamic from 'next/dynamic';
import InstagramReelsMiniAnalysis from "./InstagramReelsMiniAnalysis";

const BrazilFollowersMap = dynamic(() => import('./BrazilFollowersMap'), {
    ssr: false,
    loading: () => <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-3xl h-full min-h-[400px] w-full animate-pulse flex items-center justify-center text-zinc-700">Carregando Mapa...</div>
});
import {
    ClockIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    UserGroupIcon,
    HandThumbUpIcon,
    ChatBubbleLeftEllipsisIcon,
    VideoCameraIcon,
    DocumentTextIcon,
    EyeIcon,
    ChevronLeftIcon,
    ChevronRightIcon
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
        top_country: string;
        top_city: string;
        top_language: string;
        top_audience: string;
        top_age_group: string;
        countries_data: Array<{ country: string; likes: number; growth: number; percentage: number }>;
        cities_data: Array<{ city: string; likes: number; growth: number; percentage: number }>;
        cities_by_gender: Array<{ city: string; male: number; female: number }>;
        cities_by_age: Array<{ age_group: string; cities: Array<{ city: string; fans: number; growth?: number; percentage?: number }> }>;
    };
    reactions_by_type?: { [key: string]: number };
    actions_split_changes?: { reactions: number; comments: number; shares: number; };
}

type InsightPost = InsightsData["top_posts"][number];
type PostType = "video" | "photo" | "album";

const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(0) + " mil";
    return num.toString();
};

const getQualitySignalsTotal = (post: InsightsData["top_posts"][number]) => {
    return (post.reaction_breakdown?.like || 0)
        + (post.reaction_breakdown?.love || 0)
        + (post.reaction_breakdown?.haha || 0)
        + (post.reaction_breakdown?.wow || 0)
        + (post.reaction_breakdown?.sad || 0)
        + (post.reaction_breakdown?.angry || 0);
};

type FollowersInterval = "daily" | "weekly" | "monthly";

type FollowersSeriesPoint = {
    label: string;
    gained: number;
    lost: number;
    net: number;
    cumulative: number;
};

type PeriodFollowersSnapshot = {
    newFollowers: number;
    net: number;
    growthPct: number;
};

type AudienceViewMode = "base_total" | "base_engajada";

type AudienceAgeRow = {
    range: string;
    male: number;
    female: number;
    total: number;
};

const AGE_ORDER: Record<string, number> = {
    "13-17": 1,
    "18-24": 2,
    "25-34": 3,
    "35-44": 4,
    "45-54": 5,
    "55-64": 6,
    "65+": 7,
};

const AGE_ECONOMIC_TAGS: Record<string, string> = {
    "13-17": "Gen Alpha / Descoberta",
    "18-24": "Gen Z / Entrada",
    "25-34": "Millennials / Decisores",
    "35-44": "Millennials / Conversao",
    "45-54": "Senior / Ticket Alto",
    "55-64": "Senior / Lealdade",
    "65+": "Legacy / Relacao",
};

const AGE_ENGAGEMENT_WEIGHT: Record<string, number> = {
    "13-17": 0.86,
    "18-24": 1.14,
    "25-34": 1.12,
    "35-44": 1.04,
    "45-54": 0.94,
    "55-64": 0.82,
    "65+": 0.7,
};

const AGE_CONVERSION_WEIGHT: Record<string, number> = {
    "13-17": 0.45,
    "18-24": 0.72,
    "25-34": 1.15,
    "35-44": 1.28,
    "45-54": 1.1,
    "55-64": 0.9,
    "65+": 0.78,
};

const FREIGHT_BASE_STATES = new Set(["SP", "RJ", "MG", "ES", "PR", "SC", "RS"]);

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const normalizeAudienceRows = (rows: AudienceAgeRow[]) => {
    const sum = rows.reduce((acc, item) => acc + item.total, 0);
    const base = Math.max(1, sum);
    return rows
        .map((item) => {
            const male = (item.male / base) * 100;
            const female = (item.female / base) * 100;
            return {
                range: item.range,
                male,
                female,
                total: male + female,
            };
        })
        .sort((a, b) => (AGE_ORDER[a.range] ?? 99) - (AGE_ORDER[b.range] ?? 99));
};

const getStateCodeFromCity = (cityName: string) => {
    const parts = cityName.split(",");
    if (parts.length < 2) return "";
    return parts[parts.length - 1]?.trim().toUpperCase() ?? "";
};

const normalizeLookupKey = (value: string) => {
    return value
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
};

const formatCityWithState = (rawCity: string, fallbackCities?: Array<{ city: string }>) => {
    const trimmed = rawCity.trim();
    const match = trimmed.match(/^(.*?)(?:,|\/|\s-\s)\s*([A-Za-z]{2})$/);
    if (match) {
        const cityName = match[1]?.trim();
        const state = match[2]?.trim().toUpperCase();
        if (cityName && state) return `${cityName}/${state}`;
    }

    if (fallbackCities?.length) {
        const key = normalizeLookupKey(trimmed);
        const candidate = fallbackCities.find((item) => normalizeLookupKey(item.city).startsWith(key));
        if (candidate) return formatCityWithState(candidate.city);
    }

    return trimmed;
};

const COUNTRY_FLAG_BY_NAME: Record<string, string> = {
    brasil: "🇧🇷",
    brazil: "🇧🇷",
    portugal: "🇵🇹",
    "estados unidos": "🇺🇸",
    eua: "🇺🇸",
    usa: "🇺🇸",
    "united states": "🇺🇸",
    argentina: "🇦🇷",
    chile: "🇨🇱",
    uruguai: "🇺🇾",
    paraguai: "🇵🇾",
    bolivia: "🇧🇴",
    colombia: "🇨🇴",
    peru: "🇵🇪",
    mexico: "🇲🇽",
    espanha: "🇪🇸",
    franca: "🇫🇷",
    alemanha: "🇩🇪",
    italia: "🇮🇹",
    "reino unido": "🇬🇧",
    "united kingdom": "🇬🇧",
    canada: "🇨🇦",
    japao: "🇯🇵",
};

const getCountryFlagEmoji = (countryName: string) => {
    const key = normalizeLookupKey(countryName);
    return COUNTRY_FLAG_BY_NAME[key] ?? "🌎";
};

const getGenderBadge = (clusterLabel: string) => {
    const key = normalizeLookupKey(clusterLabel);
    if (key.includes("mulher") || key.includes("femin")) {
        return { symbol: "♀", label: "Mulheres", className: "bg-violet-500/10 border-violet-500/25 text-violet-300" };
    }
    if (key.includes("homem") || key.includes("masc")) {
        return { symbol: "♂", label: "Homens", className: "bg-blue-500/10 border-blue-500/25 text-blue-300" };
    }
    return { symbol: "♀♂", label: "Gênero", className: "bg-zinc-500/10 border-zinc-500/25 text-zinc-300" };
};

const mulberry32 = (seed: number) => {
    return () => {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

const formatShortPtBr = (date: Date) => {
    const raw = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
    return raw.replace(".", "").toUpperCase();
};

const startOfWeekMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay(); // 0..6 (Sun..Sat)
    const diff = (day === 0 ? -6 : 1) - day; // move to Monday
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date;
};

const makeFollowersSeries = (interval: FollowersInterval, seedBase: number): FollowersSeriesPoint[] => {
    const now = new Date();
    const seed = Math.floor(seedBase % 1_000_000) + (interval === "daily" ? 11 : interval === "weekly" ? 22 : 33);
    const rand = mulberry32(seed);

    const pointsCount = interval === "daily" ? 7 : 12;
    const labels: string[] = [];

    if (interval === "daily") {
        for (let i = pointsCount - 1; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            labels.push(formatShortPtBr(d));
        }
    } else if (interval === "weekly") {
        const base = startOfWeekMonday(now);
        for (let i = pointsCount - 1; i >= 0; i--) {
            const d = new Date(base);
            d.setDate(d.getDate() - i * 7 + 6); // week end (Sun)
            labels.push(`SEM ${formatShortPtBr(d)}`);
        }
    } else {
        for (let i = pointsCount - 1; i >= 0; i--) {
            const d = new Date(now);
            d.setMonth(d.getMonth() - i, 1);
            labels.push(d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "").toUpperCase());
        }
    }

    const baseGained = interval === "daily" ? 70 : interval === "weekly" ? 380 : 1650;
    const baseLost = interval === "daily" ? 28 : interval === "weekly" ? 140 : 620;

    let cumulative = 0;
    return labels.map((label, idx) => {
        const wave = Math.sin((idx / Math.max(1, labels.length - 1)) * Math.PI * 1.2);
        const noiseA = rand() * 0.8 + 0.6;
        const noiseB = rand() * 0.8 + 0.6;

        const gained = Math.max(0, Math.round((baseGained * (0.8 + wave * 0.35)) * noiseA));
        const lost = Math.max(0, Math.round((baseLost * (0.85 - wave * 0.25)) * noiseB));
        const net = gained - lost;
        cumulative += net;

        return { label, gained, lost, net, cumulative };
    });
};

const makePeriodFollowersSnapshot = (period: PeriodValue, totalFollowers: number): PeriodFollowersSnapshot => {
    const factors: Record<PeriodValue, number> = {
        "7d": 0.0016,
        "14d": 0.0029,
        "30d": 0.0048,
        "this_month": 0.0052,
        "last_month": 0.0041,
        "this_year": 0.028,
        "all": 0.11,
        "custom": 0.0045,
    };

    const factor = factors[period] ?? factors["30d"];
    const newFollowers = Math.max(1, Math.round(totalFollowers * factor));
    const churn = Math.round(newFollowers * 0.27);
    const net = newFollowers - churn;
    const previousBase = Math.max(1, totalFollowers - net);
    const growthPct = (net / previousBase) * 100;

    return { newFollowers, net, growthPct };
};

type KPICardProps = {
    title: string;
    value: number;
    change: number;
    icon: ComponentType<{ className?: string }>;
    tooltip?: string;
};

const KPICard = ({ title, value, change, icon: _Icon, tooltip }: KPICardProps) => {
    const subtitle =
        change > 0
            ? `+${Math.abs(change)}% vs período anterior`
            : change < 0
                ? `-${Math.abs(change)}% vs período anterior`
                : "Base ativa da conta no período.";

    return (
        <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-2xl px-6 py-5 min-h-[118px] flex flex-col justify-center">
            <div className="flex items-center gap-1 mb-2">
                <h3 className="text-zinc-500 text-[11px] font-bold uppercase tracking-[0.14em]">{title}</h3>
                {tooltip && (
                    <span
                        title={tooltip}
                        className="w-4 h-4 rounded-full border border-[var(--shell-border)] text-[9px] font-black text-zinc-500 flex items-center justify-center cursor-help"
                    >
                        ?
                    </span>
                )}
            </div>
            <div className="text-5xl leading-[0.9] font-black text-[var(--foreground)] tracking-tight">{formatNumber(value)}</div>
            <p className="mt-2 text-[12px] font-semibold text-zinc-500">{subtitle}</p>
        </div>
    );
};

// Population Pyramid Component
const PopulationPyramid = ({
    data,
    influencerRange,
    decisorRange,
}: {
    data: Array<{ range: string; male: number; female: number }>;
    influencerRange?: string;
    decisorRange?: string;
}) => {
    const maxVal = Math.max(...data.map(d => Math.max(d.male, d.female))) * 1.1; // Add 10% buffer

    return (
        <div className="flex flex-col w-full h-full px-4 justify-center">
            {/* Legend */}
            <div className="flex justify-center gap-8 mb-5 border-b border-[var(--shell-border)] pb-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-sky-500" />
                    <span className="text-[10px] font-bold uppercase text-zinc-500">Masculino</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-orange-400" />
                    <span className="text-[10px] font-bold uppercase text-zinc-500">Feminino</span>
                </div>
            </div>

            {/* Pyramid */}
            <div className="w-full max-w-3xl mx-auto flex flex-col font-sans">
                {[...data].reverse().map((item) => (
                    <div
                        key={item.range}
                        className={`flex items-center w-full relative h-6 border-b border-[var(--shell-border)] last:border-0 transition-colors group ${decisorRange === item.range
                            ? "bg-emerald-500/10 hover:bg-emerald-500/15"
                            : influencerRange === item.range
                                ? "bg-blue-500/10 hover:bg-blue-500/15"
                                : "hover:bg-[var(--shell-side)]"
                            }`}
                    >

                        {/* Left Side: Male (Blue) */}
                        <div className="flex-1 flex justify-end items-center gap-3 pr-4 h-full">
                            <span className="text-[11px] font-black text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors w-10 text-right shrink-0">
                                {item.male}%
                            </span>
                            <div
                                className="h-5 bg-sky-500 rounded-l-sm transition-all duration-500 shadow-sm relative group-hover:shadow-md group-hover:bg-sky-400"
                                style={{ width: `${(item.male / maxVal) * 100}%`, minWidth: '4px' }}
                            />
                        </div>

                        {/* Central Axis: Age Range */}
                        <div className={`w-16 text-center text-[10px] font-bold shrink-0 ${decisorRange === item.range
                            ? "text-emerald-300"
                            : influencerRange === item.range
                                ? "text-blue-300"
                                : "text-zinc-400"
                            }`}>
                            {item.range}
                        </div>

                        {/* Right Side: Female (Orange) */}
                        <div className="flex-1 flex justify-start items-center gap-3 pl-4 h-full">
                            <div
                                className="h-5 bg-orange-400 rounded-r-sm transition-all duration-500 shadow-sm relative group-hover:shadow-md group-hover:bg-orange-300"
                                style={{ width: `${(item.female / maxVal) * 100}%`, minWidth: '4px' }}
                            />
                            <span className="text-[11px] font-black text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors w-10 text-left shrink-0">
                                {item.female}%
                            </span>
                        </div>

                    </div>
                ))}
            </div>
        </div>
    )
}

const getPostType = (post: InsightPost): PostType => {
    // Deterministic type assignment based on ID chars sum
    const sum = post.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const types: PostType[] = ['video', 'photo', 'album'];
    return types[sum % 3];
};

const SpeedometerChart = ({ title, data }: { title: string, data: { label: string, value: number, color: string }[] }) => {
    const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
    const radius = 90; // Increased from 60
    const center = 110; // Increased from 70
    const stroke = 35; // Increased from 25

    const pol2cart = (x: number, y: number, r: number, deg: number) => {
        const rad = (deg * Math.PI) / 180.0;
        return { x: x + r * Math.cos(rad), y: y + r * Math.sin(rad) };
    };

    const segments = data.reduce<Array<{ label: string; value: number; color: string; start: number; end: number; percent: number }>>((acc, entry) => {
        const percent = entry.value / total;
        const deg = percent * 180;
        const start = acc.length ? acc[acc.length - 1].end : 180;
        const end = start + deg;
        acc.push({ ...entry, start, end, percent });
        return acc;
    }, []);

    const winner = segments.reduce((p, c) => (p.value > c.value ? p : c));
    const needleAngle = winner.start + (winner.end - winner.start) / 2;

    return (
        <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-2xl p-4 flex flex-col items-center justify-between h-full relative overflow-hidden group hover:border-blue-500/20 transition-all">
            <h5 className="text-[10px] uppercase font-bold text-zinc-500 mb-4 text-center tracking-wider">{title}</h5>

            <div className="relative h-[130px] w-[220px] flex justify-center mb-4">
                <svg width="220" height="130" className="overflow-visible">
                    <path d={`M ${pol2cart(center, center, radius, 180).x} ${pol2cart(center, center, radius, 180).y} A ${radius} ${radius} 0 0 1 ${pol2cart(center, center, radius, 360).x} ${pol2cart(center, center, radius, 360).y}`} fill="none" stroke="var(--shell-border)" strokeWidth={stroke} opacity={0.3} />

                    {segments.map((s, i) => {
                        const startPt = pol2cart(center, center, radius, s.start);
                        const endPt = pol2cart(center, center, radius, s.end);
                        const largeArc = s.end - s.start <= 180 ? 0 : 1;

                        const midAngle = s.start + (s.end - s.start) / 2;
                        const textPos = pol2cart(center, center, radius, midAngle);

                        return (
                            <g key={i}>
                                <path
                                    d={`M ${startPt.x} ${startPt.y} A ${radius} ${radius} 0 ${largeArc} 1 ${endPt.x} ${endPt.y}`}
                                    fill="none"
                                    stroke={s.color}
                                    strokeWidth={stroke}
                                />
                                {s.percent > 0.05 && (
                                    <text
                                        x={textPos.x}
                                        y={textPos.y}
                                        dominantBaseline="middle"
                                        textAnchor="middle"
                                        fill="white"
                                        fontSize="11"
                                        fontWeight="900"
                                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                                        className="pointer-events-none select-none"
                                    >
                                        {(s.percent * 100).toFixed(0)}%
                                    </text>
                                )}
                            </g>
                        );
                    })}

                    <g transform={`translate(${center}, ${center}) rotate(${needleAngle})`} className="transition-transform duration-1000 ease-out z-10">
                        <line x1="0" y1="0" x2={radius - stroke / 2 + 5} y2="0" stroke="var(--foreground)" strokeWidth="3" strokeLinecap="round" />
                        <circle cx="0" cy="0" r="4" fill="var(--foreground)" className="shadow-md" />
                    </g>
                </svg>
            </div>

            <div className="flex flex-col items-center mt-auto">
                <div className="text-sm font-black mt-0.5 flex items-center gap-1.5" style={{ color: winner.color }}>
                    {winner.label}
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[var(--shell-border)] w-full justify-center">
                {data.map((d, i) => (
                    <div key={i} className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ background: d.color }}></div>
                        <span className="text-[9px] font-bold text-zinc-500 uppercase">{d.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const PaginationControl = ({ currentPage, totalItems, pageSize, onPageChange }: { currentPage: number, totalItems: number, pageSize: number, onPageChange: (page: number) => void }) => {
    const totalPages = Math.ceil(totalItems / pageSize);
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    return (
        <div className="flex items-center justify-end gap-4 p-4 border-t border-[var(--shell-border)] bg-[var(--shell-surface)] text-zinc-500 text-xs font-bold font-mono">
            <span>
                {startItem} - {endItem} / {totalItems}
            </span>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-1 hover:text-[var(--foreground)] disabled:opacity-30 disabled:hover:text-zinc-500 transition-colors"
                >
                    <ChevronLeftIcon className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 hover:text-[var(--foreground)] disabled:opacity-30 disabled:hover:text-zinc-500 transition-colors"
                >
                    <ChevronRightIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

const TAB_ITEMS = [
    { id: "geral", label: "Geral" },
    { id: "publico", label: "Público" },
    { id: "publicacoes", label: "Publicações" },
];

type GeneralLayoutZone = "left" | "right";
type GeneralLayoutState = {
    left: Array<"mapa_calor" | "publicacoes">;
    right: Array<"demografia" | "publico" | "seguidores_periodo">;
};

type EditorBoxId =
    | "mapa_calor"
    | "publicacoes"
    | "demografia"
    | "publico"
    | "seguidores_periodo"
    | `custom_${number}`;

type EditorBoxConfig = {
    bgColor: string;
    minHeight: number;
    widthSpan: 1 | 2;
    hidden: boolean;
    title?: string;
    subtitle?: string;
};

type ResizeState = {
    boxId: EditorBoxId;
    startX: number;
    startY: number;
    startMinHeight: number;
    startWidthSpan: 1 | 2;
};

const GENERAL_LAYOUT_STORAGE_KEY = "social-insights:geral-layout:v1";
const GENERAL_EDITOR_STORAGE_KEY = "social-insights:geral-editor:v1";
const GENERAL_EDITOR_CUSTOM_BOXES_KEY = "social-insights:geral-editor:custom-boxes:v1";
const DEFAULT_GENERAL_LAYOUT: GeneralLayoutState = {
    left: ["mapa_calor", "publicacoes"],
    right: ["demografia", "publico", "seguidores_periodo"],
};

const DEFAULT_EDITOR_CONFIG: Record<Exclude<EditorBoxId, `custom_${number}`>, EditorBoxConfig> = {
    mapa_calor: { bgColor: "transparent", minHeight: 400, widthSpan: 1, hidden: false, title: "Mapa de Calor", subtitle: "Concentração de seguidores por região" },
    publicacoes: { bgColor: "transparent", minHeight: 300, widthSpan: 1, hidden: false, title: "Publicações", subtitle: "Destaques e resumo do desempenho do período." },
    demografia: { bgColor: "transparent", minHeight: 260, widthSpan: 1, hidden: false, title: "Demografia", subtitle: "Resumo por faixa etária e gênero." },
    publico: { bgColor: "transparent", minHeight: 260, widthSpan: 1, hidden: false, title: "Público", subtitle: "Principais dados de audiência e distribuição." },
    seguidores_periodo: { bgColor: "transparent", minHeight: 220, widthSpan: 1, hidden: false, title: "Seguidores no Período", subtitle: "Indicadores do período selecionado." },
};

const parseGeneralLayout = (raw: string | null): GeneralLayoutState => {
    if (!raw) return DEFAULT_GENERAL_LAYOUT;
    try {
        const parsed = JSON.parse(raw) as Partial<GeneralLayoutState>;
        const nextLeft = parsed.left?.filter((item): item is GeneralLayoutState["left"][number] =>
            item === "mapa_calor" || item === "publicacoes"
        ) ?? [];
        const nextRight = parsed.right?.filter((item): item is GeneralLayoutState["right"][number] =>
            item === "demografia" || item === "publico" || item === "seguidores_periodo"
        ) ?? [];
        if (nextLeft.length === 2 && nextRight.length === 3) {
            return { left: nextLeft, right: nextRight };
        }
        return DEFAULT_GENERAL_LAYOUT;
    } catch {
        return DEFAULT_GENERAL_LAYOUT;
    }
};

const parseEditorConfigMap = (raw: string | null) => {
    const fallback: Record<string, EditorBoxConfig> = { ...DEFAULT_EDITOR_CONFIG };
    if (!raw) return fallback;
    try {
        const parsed = JSON.parse(raw) as Record<string, Partial<EditorBoxConfig>>;
        const result: Record<string, EditorBoxConfig> = { ...fallback };
        Object.entries(parsed).forEach(([id, config]) => {
            result[id] = {
                bgColor: typeof config.bgColor === "string" ? config.bgColor : "transparent",
                minHeight: typeof config.minHeight === "number" ? Math.max(160, config.minHeight) : 220,
                widthSpan: config.widthSpan === 2 ? 2 : 1,
                hidden: Boolean(config.hidden),
                title: typeof config.title === "string" ? config.title : fallback[id]?.title,
                subtitle: typeof config.subtitle === "string" ? config.subtitle : fallback[id]?.subtitle,
            };
        });
        return result;
    } catch {
        return fallback;
    }
};

type SocialInsightsProps = {
    hideTopPeriodSelector?: boolean;
    platform?: "facebook" | "instagram";
};

export default function SocialInsights({ hideTopPeriodSelector = false, platform = "facebook" }: SocialInsightsProps) {
    const isInstagram = platform === "instagram";
    const [activeTab, setActiveTab] = useState("geral");
    const [period, setPeriod] = useState<PeriodValue>("30d");
    const [isGeneralArrangeMode, setIsGeneralArrangeMode] = useState(false);
    const [isTextEditMode, setIsTextEditMode] = useState(false);
    const [selectedBoxId, setSelectedBoxId] = useState<EditorBoxId | null>(null);
    const [resizeState, setResizeState] = useState<ResizeState | null>(null);
    const [generalLayout, setGeneralLayout] = useState<GeneralLayoutState>(() => {
        if (typeof window === "undefined") return DEFAULT_GENERAL_LAYOUT;
        return parseGeneralLayout(window.localStorage.getItem(GENERAL_LAYOUT_STORAGE_KEY));
    });
    const [editorBoxConfig, setEditorBoxConfig] = useState<Record<string, EditorBoxConfig>>(() => {
        if (typeof window === "undefined") return { ...DEFAULT_EDITOR_CONFIG };
        return parseEditorConfigMap(window.localStorage.getItem(GENERAL_EDITOR_STORAGE_KEY));
    });
    const [customBoxes, setCustomBoxes] = useState<Array<{ id: `custom_${number}`; zone: GeneralLayoutZone }>>(() => {
        if (typeof window === "undefined") return [];
        try {
            const raw = window.localStorage.getItem(GENERAL_EDITOR_CUSTOM_BOXES_KEY);
            if (!raw) return [];
            const parsed = JSON.parse(raw) as Array<{ id: string; zone: string }>;
            return parsed
                .filter((item): item is { id: `custom_${number}`; zone: GeneralLayoutZone } =>
                    /^custom_\d+$/.test(item.id) && (item.zone === "left" || item.zone === "right")
                );
        } catch {
            return [];
        }
    });
    const [draggingGeneralCard, setDraggingGeneralCard] = useState<{ zone: GeneralLayoutZone; id: string } | null>(null);
    const [data, setData] = useState<InsightsData | null>(null);
    const [followersInterval, setFollowersInterval] = useState<FollowersInterval>("daily");
    const [heatmapMetric, setHeatmapMetric] = useState<'interactions' | 'reach'>('interactions');
    const [heatmapMode, setHeatmapMode] = useState<'best' | 'worst'>('best');
    const [countryPage, setCountryPage] = useState(1);
    const [cityPage, setCityPage] = useState(1);
    const [citiesGenderPage, setCitiesGenderPage] = useState(1);
    const [genderSort, setGenderSort] = useState<'female' | 'male'>('female');
    const [activeAgeGroupIndex, setActiveAgeGroupIndex] = useState(0);
    const [citiesAgePage, setCitiesAgePage] = useState(1);
    const [selectedStateFilter, setSelectedStateFilter] = useState<string>('todos');
    const [audienceViewMode, setAudienceViewMode] = useState<AudienceViewMode>("base_total");
    const PAGE_SIZE = 10;
    const isLocalEditor = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

    useEffect(() => {
        if (typeof window === "undefined") return;
        window.localStorage.setItem(GENERAL_LAYOUT_STORAGE_KEY, JSON.stringify(generalLayout));
    }, [generalLayout]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        window.localStorage.setItem(GENERAL_EDITOR_STORAGE_KEY, JSON.stringify(editorBoxConfig));
    }, [editorBoxConfig]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        window.localStorage.setItem(GENERAL_EDITOR_CUSTOM_BOXES_KEY, JSON.stringify(customBoxes));
    }, [customBoxes]);

    const moveGeneralCard = (zone: GeneralLayoutZone, draggedId: string, targetId: string) => {
        if (draggedId === targetId) return;
        setGeneralLayout((prev) => {
            const list = [...prev[zone]];
            const fromIndex = list.findIndex((item) => item === draggedId);
            const toIndex = list.findIndex((item) => item === targetId);
            if (fromIndex < 0 || toIndex < 0) return prev;
            const [moved] = list.splice(fromIndex, 1);
            list.splice(toIndex, 0, moved);
            return { ...prev, [zone]: list } as GeneralLayoutState;
        });
    };

    const getGeneralCardOrder = (zone: GeneralLayoutZone, cardId: string) => {
        const index = generalLayout[zone].findIndex((item) => item === cardId);
        return index >= 0 ? index : 0;
    };

    const getEditorConfig = (boxId: EditorBoxId): EditorBoxConfig => {
        return editorBoxConfig[boxId] ?? {
            bgColor: "transparent",
            minHeight: 220,
            widthSpan: 1,
            hidden: false,
            title: "Nova Caixa",
            subtitle: "Clique para editar o texto",
        };
    };

    const updateBoxConfig = (boxId: EditorBoxId, patch: Partial<EditorBoxConfig>) => {
        setEditorBoxConfig((prev) => ({
            ...prev,
            [boxId]: {
                ...(prev[boxId] ?? {
                    bgColor: "transparent",
                    minHeight: 220,
                    widthSpan: 1,
                    hidden: false,
                    title: "Nova Caixa",
                    subtitle: "Clique para editar o texto",
                }),
                ...patch,
            },
        }));
    };

    const updateSelectedBoxConfig = (patch: Partial<EditorBoxConfig>) => {
        if (!selectedBoxId) return;
        updateBoxConfig(selectedBoxId, patch);
    };

    const startBoxResize = (event: ReactMouseEvent, boxId: EditorBoxId) => {
        if (!isLocalEditor) return;
        event.preventDefault();
        event.stopPropagation();
        const current = getEditorConfig(boxId);
        setResizeState({
            boxId,
            startX: event.clientX,
            startY: event.clientY,
            startMinHeight: current.minHeight,
            startWidthSpan: current.widthSpan,
        });
    };

    const addCustomBox = () => {
        const newId = `custom_${Date.now()}` as const;
        const zone: GeneralLayoutZone = "right";
        setCustomBoxes((prev) => [...prev, { id: newId, zone }]);
        setEditorBoxConfig((prev) => ({
            ...prev,
            [newId]: {
                bgColor: "rgba(59,130,246,0.08)",
                minHeight: 220,
                widthSpan: 1,
                hidden: false,
                title: "Nova Caixa",
                subtitle: "Edite este conteúdo",
            },
        }));
        setSelectedBoxId(newId);
    };

    const deleteSelectedBox = () => {
        if (!selectedBoxId) return;
        const isCustom = selectedBoxId.startsWith("custom_");
        if (isCustom) {
            setCustomBoxes((prev) => prev.filter((item) => item.id !== selectedBoxId));
            setEditorBoxConfig((prev) => {
                const next = { ...prev };
                delete next[selectedBoxId];
                return next;
            });
        } else {
            updateBoxConfig(selectedBoxId, { hidden: true });
        }
        setSelectedBoxId(null);
    };

    const restoreAllGeneralBoxes = () => {
        setGeneralLayout(DEFAULT_GENERAL_LAYOUT);
        setEditorBoxConfig({ ...DEFAULT_EDITOR_CONFIG });
        setCustomBoxes([]);
        setSelectedBoxId(null);
    };

    useEffect(() => {
        if (!resizeState) return;
        const onMouseMove = (event: MouseEvent) => {
            const deltaY = event.clientY - resizeState.startY;
            const deltaX = event.clientX - resizeState.startX;
            const nextMinHeight = Math.max(160, Math.min(1000, resizeState.startMinHeight + deltaY));
            const nextWidthSpan: 1 | 2 = deltaX > 120 ? 2 : deltaX < -120 ? 1 : resizeState.startWidthSpan;
            updateBoxConfig(resizeState.boxId, { minHeight: nextMinHeight, widthSpan: nextWidthSpan });
        };
        const onMouseUp = () => setResizeState(null);
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };
    }, [resizeState]);

    const speedData = useMemo(() => {
        if (!data || !data.top_posts) return null;

        const stats: Record<PostType, { count: number; reach: number; engagement: number; clicks: number; label: string; color: string }> = {
            video: { count: 0, reach: 0, engagement: 0, clicks: 0, label: 'REELS/VÍDEO', color: '#facc15' },
            photo: { count: 0, reach: 0, engagement: 0, clicks: 0, label: 'FOTO', color: '#ef4444' },
            album: { count: 0, reach: 0, engagement: 0, clicks: 0, label: 'CARROSSEL', color: '#22c55e' }
        };

        data.top_posts.forEach((p: InsightPost) => {
            const type = getPostType(p);
            const s = stats[type];
            if (s) {
                s.count++;
                s.reach += p.reach;
                s.engagement += (p.reactions + p.comments + p.shares);
                s.clicks += p.link_clicks || 0;
            }
        });

        const getAvg = (s: { count: number; reach: number }) => s.count ? s.reach / s.count : 0;

        return {
            reach: [
                { label: stats.video.label, value: getAvg(stats.video), color: stats.video.color },
                { label: stats.photo.label, value: getAvg(stats.photo), color: stats.photo.color },
                { label: stats.album.label, value: getAvg(stats.album), color: stats.album.color }
            ],
            engagement: [
                { label: stats.video.label, value: stats.video.engagement, color: stats.video.color },
                { label: stats.photo.label, value: stats.photo.engagement, color: stats.photo.color },
                { label: stats.album.label, value: stats.album.engagement, color: stats.album.color }
            ],
            clicks: [
                { label: stats.video.label, value: stats.video.clicks, color: stats.video.color },
                { label: stats.photo.label, value: stats.photo.clicks, color: stats.photo.color },
                { label: stats.album.label, value: stats.album.clicks, color: stats.album.color }
            ]
        };
    }, [data]);

    const heatmapData = useMemo(() => {
        if (!data || !data.top_posts) return null;

        // 7 days x 12 intervals (2h)
        const counts = Array.from({ length: 7 }, () => Array.from({ length: 12 }, () => ({ count: 0, reach: 0, interactions: 0 })));

        data.top_posts.forEach((p: InsightPost) => {
            const d = new Date(p.timestamp);
            const day = d.getDay(); // 0-6 (Dom-Sab)
            const hour = d.getHours();
            const interval = Math.floor(hour / 2); // 0-11

            const c = counts[day][interval];
            c.count++;
            c.reach += p.reach;
            c.interactions += (p.reactions + p.comments + p.shares);
        });

        // Averages
        return counts.map(dayArr => dayArr.map(cell => ({
            reach: cell.count ? cell.reach / cell.count : 0,
            interactions: cell.count ? cell.interactions / cell.count : 0
        })));
    }, [data]);

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
                    if (!isInstagram) {
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
                    }

                    const mockMessages = [
                        "Reel: 3 prompts de IA para vender no Instagram em 2026. Salve para aplicar hoje.",
                        "Carrossel utilitário: checklist de bio que converte visita em lead.",
                        "Bastidor real da operação: o que mudou quando cortamos edição pesada.",
                        "Reel com prova social: case de cliente que dobrou leads via DM.",
                        "Tutorial rápido: CTA que aumenta compartilhamento no direct.",
                        "Carrossel comparativo: conteúdo de alcance vs conteúdo de conversão.",
                    ];

                    return Array.from({ length: 15 }).map((_, i) => ({
                        id: (i + 1).toString(),
                        image: "https://placehold.co/100x100/png",
                        message: mockMessages[i % mockMessages.length],
                        date: (() => {
                            const d = new Date(2026, 1, 17 - i);
                            return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                        })(),
                        timestamp: new Date(2026, 1, 17 - i, [8, 10, 12, 14, 18, 20][i % 6], 0).getTime(),
                        impressions: Math.max(9000, Math.round((68200 - (i * 2100)) * 1.35)),
                        reach: Math.max(6200, 68200 - (i * 2100)),
                        reactions: Math.max(240, 2840 - (i * 95)),
                        comments: Math.max(60, 620 - (i * 18)),
                        shares: Math.max(40, 930 - (i * 26)),
                        video_views: Math.max(9800, Math.round((68200 - (i * 2100)) * 1.9)),
                        link_clicks: Math.max(18, 150 - (i * 6)),
                        link: "#",
                        reaction_breakdown: {
                            like: Math.max(100, 2840 - (i * 95)),
                            love: Math.max(40, 930 - (i * 26)),
                            haha: Math.max(70, 2100 - (i * 60)),
                            thankful: 0,
                            wow: Math.max(24, 690 - (i * 20)),
                            pride: 0,
                            sad: Math.max(18, 280 - (i * 9)),
                            angry: Math.max(10, 190 - (i * 6))
                        }
                    }));
                };

                // Simulate fetch or use expanded mock
                setData({
                    page_followers: isInstagram ? { value: 344000, change: 2.3 } : { value: 344000, change: 0.9 },
                    total_reactions: isInstagram ? { value: 98200, change: 12.4 } : { value: 73000, change: 0 },
                    organic_video_views: isInstagram ? { value: 1264000, change: 18.1 } : { value: 433000, change: 9.7 },
                    engagements: isInstagram ? { value: 152800, change: 21.6 } : { value: 134000, change: 108.5 },
                    number_of_posts: isInstagram ? { value: 52, change: -8.2 } : { value: 157, change: -53.4 },
                    organic_impressions: isInstagram ? { value: 2860000, change: 14.9 } : { value: 0, change: 0 },
                    actions_split: isInstagram ? { reactions: 62140, comments: 18670, shares: 25790 } : { reactions: 72756, comments: 55941, shares: 5672 },
                    actions_split_changes: isInstagram ? { reactions: 17.8, comments: 9.4, shares: 24.2 } : { reactions: -7.4, comments: 144.7, shares: -42.5 },
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
                        top_country: "Brasil",
                        top_cities: [],
                        top_city: "São Paulo",
                        top_language: "Português (BR)",
                        top_audience: "Mulheres 25-34",
                        top_age_group: "25-34",
                        countries_data: [
                            { country: "Brasil", likes: 28540, growth: 124, percentage: 82 },
                            { country: "Portugal", likes: 2100, growth: 15, percentage: 6 },
                            { country: "Estados Unidos", likes: 950, growth: 4, percentage: 3 },
                            { country: "Angola", likes: 540, growth: 8, percentage: 2 },
                            { country: "Espanha", likes: 320, growth: -2, percentage: 1 },
                            { country: "Reino Unido", likes: 210, growth: 1, percentage: 1 },
                            { country: "França", likes: 180, growth: 0, percentage: 1 },
                            { country: "Argentina", likes: 150, growth: -5, percentage: 0.5 },
                            { country: "Itália", likes: 120, growth: 2, percentage: 0.4 },
                            { country: "Japão", likes: 90, growth: 1, percentage: 0.3 },
                            { country: "Alemanha", likes: 85, growth: 3, percentage: 0.2 },
                            { country: "Canadá", likes: 70, growth: 2, percentage: 0.2 },
                            { country: "Austrália", likes: 65, growth: 1, percentage: 0.2 },
                            { country: "Irlanda", likes: 60, growth: 0, percentage: 0.1 },
                            { country: "Suíça", likes: 55, growth: 1, percentage: 0.1 }
                        ],
                        cities_data: [
                            { city: "São Paulo, SP", likes: 12500, growth: 89, percentage: 36 },
                            { city: "Rio de Janeiro, RJ", likes: 6200, growth: 42, percentage: 18 },
                            { city: "Belo Horizonte, MG", likes: 3100, growth: 15, percentage: 9 },
                            { city: "Salvador, BA", likes: 1800, growth: 8, percentage: 5 },
                            { city: "Brasília, DF", likes: 1500, growth: 12, percentage: 4 },
                            { city: "Curitiba, PR", likes: 1450, growth: 6, percentage: 4 },
                            { city: "Fortaleza, CE", likes: 1200, growth: 9, percentage: 3 },
                            { city: "Recife, PE", likes: 1100, growth: 5, percentage: 3 },
                            { city: "Porto Alegre, RS", likes: 950, growth: 3, percentage: 2 },
                            { city: "Goiânia, GO", likes: 800, growth: 4, percentage: 2 },
                            { city: "Manaus, AM", likes: 750, growth: 5, percentage: 2 },
                            { city: "Belém, PA", likes: 700, growth: 3, percentage: 2 },
                            { city: "Campinas, SP", likes: 650, growth: 8, percentage: 1 },
                            { city: "São Luís, MA", likes: 600, growth: 2, percentage: 1 },
                            { city: "Maceió, AL", likes: 550, growth: 4, percentage: 1 }
                        ],
                        cities_by_gender: [
                            { city: "São Paulo, SP", male: 45, female: 55 },
                            { city: "Rio de Janeiro, RJ", male: 42, female: 58 },
                            { city: "Belo Horizonte, MG", male: 40, female: 60 },
                            { city: "Salvador, BA", male: 38, female: 62 },
                            { city: "Brasília, DF", male: 48, female: 52 },
                            { city: "Curitiba, PR", male: 44, female: 56 },
                            { city: "Fortaleza, CE", male: 35, female: 65 },
                            { city: "Recife, PE", male: 39, female: 61 },
                            { city: "Porto Alegre, RS", male: 46, female: 54 },
                            { city: "Manaus, AM", male: 50, female: 50 },
                            { city: "Belém, PA", male: 41, female: 59 },
                            { city: "Goiânia, GO", male: 43, female: 57 },
                            { city: "Campinas, SP", male: 47, female: 53 },
                            { city: "São Luís, MA", male: 36, female: 64 },
                            { city: "Maceió, AL", male: 37, female: 63 },
                            { city: "Natal, RN", male: 40, female: 60 },
                            { city: "Campo Grande, MS", male: 49, female: 51 },
                            { city: "Teresina, PI", male: 34, female: 66 },
                            { city: "João Pessoa, PB", male: 38, female: 62 },
                            { city: "Aracaju, SE", male: 39, female: 61 }
                        ],
                        cities_by_age: [
                            {
                                age_group: "13-17",
                                cities: [
                                    { city: "São Paulo, SP", fans: 1200 },
                                    { city: "Rio de Janeiro, RJ", fans: 900 },
                                    { city: "Belo Horizonte, MG", fans: 600 },
                                    { city: "Recife, PE", fans: 550 },
                                    { city: "Salvador, BA", fans: 500 },
                                    { city: "Fortaleza, CE", fans: 450 },
                                    { city: "Curitiba, PR", fans: 400 },
                                    { city: "Manaus, AM", fans: 350 },
                                    { city: "Belém, PA", fans: 300 },
                                    { city: "Porto Alegre, RS", fans: 250 }
                                ]
                            },
                            {
                                age_group: "18-24",
                                cities: [
                                    { city: "São Paulo, SP", fans: 3500 },
                                    { city: "Belo Horizonte, MG", fans: 1800 },
                                    { city: "Rio de Janeiro, RJ", fans: 1600 },
                                    { city: "Curitiba, PR", fans: 1200 },
                                    { city: "Porto Alegre, RS", fans: 1100 },
                                    { city: "Salvador, BA", fans: 900 },
                                    { city: "Brasília, DF", fans: 850 },
                                    { city: "Campinas, SP", fans: 800 },
                                    { city: "Goiânia, GO", fans: 750 },
                                    { city: "Florianópolis, SC", fans: 700 }
                                ]
                            },
                            {
                                age_group: "25-34",
                                cities: [
                                    { city: "São Paulo, SP", fans: 5600 },
                                    { city: "Rio de Janeiro, RJ", fans: 3200 },
                                    { city: "Brasília, DF", fans: 1800 },
                                    { city: "Salvador, BA", fans: 1500 },
                                    { city: "Fortaleza, CE", fans: 1400 },
                                    { city: "Recife, PE", fans: 1300 },
                                    { city: "Belo Horizonte, MG", fans: 1200 },
                                    { city: "Manaus, AM", fans: 1100 },
                                    { city: "Curitiba, PR", fans: 1000 },
                                    { city: "Goiânia, GO", fans: 900 }
                                ]
                            },
                            {
                                age_group: "35-44",
                                cities: [
                                    { city: "Rio de Janeiro, RJ", fans: 2800 },
                                    { city: "São Paulo, SP", fans: 2500 },
                                    { city: "Porto Alegre, RS", fans: 1200 },
                                    { city: "Campinas, SP", fans: 900 },
                                    { city: "Santos, SP", fans: 800 },
                                    { city: "Niterói, RJ", fans: 750 },
                                    { city: "Vitória, ES", fans: 700 },
                                    { city: "Florianópolis, SC", fans: 650 },
                                    { city: "Ribeirão Preto, SP", fans: 600 },
                                    { city: "São José dos Campos, SP", fans: 550 }
                                ]
                            },
                            {
                                age_group: "45-54",
                                cities: [
                                    { city: "São Paulo, SP", fans: 1500 },
                                    { city: "Rio de Janeiro, RJ", fans: 1200 },
                                    { city: "Belo Horizonte, MG", fans: 800 },
                                    { city: "Porto Alegre, RS", fans: 600 },
                                    { city: "Curitiba, PR", fans: 500 },
                                    { city: "Brasília, DF", fans: 450 },
                                    { city: "Salvador, BA", fans: 400 },
                                    { city: "Recife, PE", fans: 350 },
                                    { city: "Fortaleza, CE", fans: 300 },
                                    { city: "Belém, PA", fans: 250 }
                                ]
                            },
                            {
                                age_group: "55-64",
                                cities: [
                                    { city: "Rio de Janeiro, RJ", fans: 800 },
                                    { city: "São Paulo, SP", fans: 700 },
                                    { city: "Santos, SP", fans: 400 },
                                    { city: "Niterói, RJ", fans: 350 },
                                    { city: "Porto Alegre, RS", fans: 300 },
                                    { city: "Recife, PE", fans: 250 },
                                    { city: "Salvador, BA", fans: 200 },
                                    { city: "Florianópolis, SC", fans: 180 },
                                    { city: "João Pessoa, PB", fans: 150 },
                                    { city: "Natal, RN", fans: 120 }
                                ]
                            },
                            {
                                age_group: "65+",
                                cities: [
                                    { city: "São Paulo, SP", fans: 400 },
                                    { city: "Rio de Janeiro, RJ", fans: 350 },
                                    { city: "Belo Horizonte, MG", fans: 200 },
                                    { city: "Porto Alegre, RS", fans: 150 },
                                    { city: "Curitiba, PR", fans: 120 },
                                    { city: "Brasília, DF", fans: 100 },
                                    { city: "Recife, PE", fans: 90 },
                                    { city: "Salvador, BA", fans: 80 },
                                    { city: "Santos, SP", fans: 70 },
                                    { city: "Campinas, SP", fans: 60 }
                                ]
                            }
                        ]
                    },
                    reactions_by_type: isInstagram ? { photo: 12400, album: 22310, video_inline: 65120, video: 7400 } : { photo: 9642, album: 6086, video_inline: 4508, video: 9 }
                });

            } catch (e) {
                console.error("Error fetching insights", e);
            }
        };
        fetchData();
    }, [isInstagram]);

    const followersBase = data?.page_followers.value ?? 0;
    const followersSeries = useMemo(() => makeFollowersSeries(followersInterval, followersBase), [followersInterval, followersBase]);
    const followersSummary = useMemo(() => {
        const totalNew = followersSeries.reduce((acc, point) => acc + point.gained, 0);
        const totalLost = followersSeries.reduce((acc, point) => acc + point.lost, 0);
        const net = totalNew - totalLost;
        const previousBase = Math.max(1, followersBase - net);
        const growthPct = (net / previousBase) * 100;
        return { totalNew, totalLost, net, growthPct };
    }, [followersSeries, followersBase]);
    const periodFollowers = useMemo(() => makePeriodFollowersSnapshot(period, followersBase), [period, followersBase]);
    const videoRetentionSummary = useMemo(() => {
        if (!data) return { retention3s: 0, avgWatchSeconds: 0, rewatchRate: 0 };

        const distributionRatio = data.organic_impressions.value > 0
            ? data.organic_video_views.value / data.organic_impressions.value
            : 0.4;
        const ratio = Math.max(0.25, Math.min(1.4, distributionRatio));

        const retention3s = Math.round(Math.max(35, Math.min(92, 40 + ratio * 28)));
        const avgWatchSeconds = Number(Math.max(4.5, Math.min(26, 5 + ratio * 12)).toFixed(1));
        const rewatchRate = Number(Math.max(6, Math.min(38, 7 + ratio * 20)).toFixed(1));

        return { retention3s, avgWatchSeconds, rewatchRate };
    }, [data]);
    const conversionFunnel = useMemo(() => {
        if (!data) return { reach: 0, retention: 0, conversion: 0 };

        const fallbackReach = data.top_posts.reduce((acc, post) => acc + (post.reach || 0), 0);
        const reach = Math.max(1, data.organic_impressions.value || fallbackReach);
        const retentionSignals = data.actions_split.reactions + data.actions_split.comments + data.actions_split.shares;
        const retention = Math.max(1, Math.min(reach, Math.round(retentionSignals * 8)));
        const conversion = Math.max(1, data.top_posts.reduce((acc, post) => acc + (post.link_clicks || 0), 0));

        return {
            reach,
            retention: Math.max(conversion, retention),
            conversion,
        };
    }, [data]);
    const formatEfficiencyRows = useMemo(() => {
        if (!data) return [] as Array<{ label: string; posts: number; avgReach: number; avgEngagement: number; avgClicks: number; efficiency: number }>;

        const stats: Record<"video" | "photo" | "album", { label: string; posts: number; reach: number; engagement: number; clicks: number }> = {
            video: { label: "Reels/Vídeo", posts: 0, reach: 0, engagement: 0, clicks: 0 },
            photo: { label: "Foto", posts: 0, reach: 0, engagement: 0, clicks: 0 },
            album: { label: "Carrossel", posts: 0, reach: 0, engagement: 0, clicks: 0 },
        };

        data.top_posts.forEach((post) => {
            const type = getPostType(post) as "video" | "photo" | "album";
            const bucket = stats[type];
            bucket.posts += 1;
            bucket.reach += post.reach || 0;
            bucket.engagement += (post.reactions || 0) + (post.comments || 0) + (post.shares || 0);
            bucket.clicks += post.link_clicks || 0;
        });

        const rows = Object.values(stats).map((bucket) => {
            const posts = Math.max(1, bucket.posts);
            const avgReach = Math.round(bucket.reach / posts);
            const avgEngagement = Math.round(bucket.engagement / posts);
            const avgClicks = Math.round(bucket.clicks / posts);
            return {
                label: bucket.label,
                posts: bucket.posts,
                avgReach,
                avgEngagement,
                avgClicks,
                efficiency: avgReach > 0 ? Number(((avgEngagement / avgReach) * 100).toFixed(2)) : 0,
            };
        });

        return rows.sort((a, b) => b.efficiency - a.efficiency);
    }, [data]);
    const actionableMatrix = useMemo(() => {
        if (!data) return [] as Array<{ issue: string; recommendation: string; priority: "ALTA" | "MÉDIA" | "BAIXA"; tone: string }>;

        const items: Array<{ issue: string; recommendation: string; priority: "ALTA" | "MÉDIA" | "BAIXA"; tone: string }> = [];
        const qualityRate = (data.total_reactions.value / Math.max(1, conversionFunnel.reach)) * 100;
        const leakRatio = conversionFunnel.retention / Math.max(1, conversionFunnel.conversion);

        if (isInstagram && videoRetentionSummary.retention3s < 62) {
            items.push({
                issue: "Retenção inicial abaixo do ideal",
                recommendation: "Abrir Reels com promessa forte e prova visual nos primeiros 2s.",
                priority: "ALTA",
                tone: "text-rose-500",
            });
        }

        if (qualityRate < 3) {
            items.push({
                issue: "Baixa taxa de sinal qualificado",
                recommendation: "Aumentar conteúdo utilitário com CTA explícito para salvar e compartilhar no DM.",
                priority: "ALTA",
                tone: "text-rose-500",
            });
        }

        if (leakRatio > 90) {
            items.push({
                issue: "Vazamento entre retenção e conversão",
                recommendation: "Inserir CTA de conversão em 2 momentos do conteúdo e reforçar na legenda.",
                priority: "MÉDIA",
                tone: "text-amber-400",
            });
        }

        if (items.length < 3) {
            items.push({
                issue: "Ritmo de formatos pouco distribuído",
                recommendation: "Padronizar mix semanal: 2 Reels, 1 Carrossel, 1 conteúdo de prova social.",
                priority: "BAIXA",
                tone: "text-emerald-500",
            });
        }

        return items.slice(0, 4);
    }, [conversionFunnel, data, isInstagram, videoRetentionSummary.retention3s]);
    const instagramPublicationsTopStats = useMemo(() => {
        if (!isInstagram) return null;
        return {
            totalPosts: 36,
            totalInteractions: 11712,
            split: [
                { label: "Curtidas", percentage: 93.49, tone: "text-blue-400", color: "#60a5fa" },
                { label: "Comentários", percentage: 5.41, tone: "text-zinc-400", color: "#a1a1aa" },
                { label: "Salvos", percentage: 1.1, tone: "text-emerald-400", color: "#10b981" },
            ],
            postTypeSplit: [
                { label: "Reels/Vídeo", count: 16, tone: "text-blue-400", color: "#60a5fa" },
                { label: "Imagens", count: 11, tone: "text-orange-400", color: "#fb923c" },
                { label: "Carrosséis", count: 9, tone: "text-emerald-400", color: "#10b981" },
            ],
            avgInteractionsPerPost: 325,
            avgViewsPerPost: 7190,
            avgEngagementPerPost: 7.28,
        };
    }, [isInstagram]);
    const instagramAudienceModel = useMemo(() => {
        if (!isInstagram || !data?.demographics) return null;

        const baseRows = normalizeAudienceRows(
            data.demographics.age.map((item) => ({
                range: item.range,
                male: item.male,
                female: item.female,
                total: item.male + item.female,
            }))
        );

        const engagedRows = normalizeAudienceRows(
            baseRows.map((item) => {
                const engagementWeight = AGE_ENGAGEMENT_WEIGHT[item.range] ?? 1;
                const maleBias = item.range === "13-17" || item.range === "18-24" ? 1.05 : 0.94;
                const femaleBias = item.range === "25-34" || item.range === "35-44" ? 1.1 : 0.98;
                const male = item.male * engagementWeight * maleBias;
                const female = item.female * engagementWeight * femaleBias;
                return {
                    range: item.range,
                    male,
                    female,
                    total: male + female,
                };
            })
        );

        const getGenderShare = (rows: AudienceAgeRow[]) => {
            const male = rows.reduce((acc, item) => acc + item.male, 0);
            const female = rows.reduce((acc, item) => acc + item.female, 0);
            const total = Math.max(1, male + female);
            const malePct = Math.round((male / total) * 100);
            return {
                malePct,
                femalePct: 100 - malePct,
            };
        };

        const baseGender = getGenderShare(baseRows);
        const engagedGender = getGenderShare(engagedRows);

        const influencerRange = [...engagedRows].sort((a, b) => b.total - a.total)[0]?.range ?? "25-34";
        const decisorRange = [...engagedRows].sort((a, b) => {
            const scoreB = b.total * (AGE_CONVERSION_WEIGHT[b.range] ?? 1);
            const scoreA = a.total * (AGE_CONVERSION_WEIGHT[a.range] ?? 1);
            return scoreB - scoreA;
        })[0]?.range ?? influencerRange;

        const engagementRate = data.organic_impressions.value > 0
            ? data.engagements.value / data.organic_impressions.value
            : 0;
        const deepSignalRate = (data.actions_split.comments + data.actions_split.shares) / Math.max(1, data.total_reactions.value);
        const churnRate = followersSummary.totalLost / Math.max(1, followersSummary.totalNew);

        const retentionNorm = clamp((videoRetentionSummary.retention3s - 40) / 40, 0, 1);
        const engagementNorm = clamp(engagementRate / 0.08, 0, 1);
        const deepSignalNorm = clamp(deepSignalRate / 0.24, 0, 1);
        const churnNorm = clamp(1 - churnRate / 0.85, 0, 1);

        const qualityScore = Math.round((engagementNorm * 0.34 + deepSignalNorm * 0.2 + retentionNorm * 0.28 + churnNorm * 0.18) * 100);
        const qualityLabel = qualityScore >= 80 ? "Oceano Azul" : qualityScore >= 40 ? "Atenção" : "Perigo";
        const qualityTone = qualityScore >= 80 ? "text-emerald-400" : qualityScore >= 40 ? "text-amber-400" : "text-rose-400";
        const qualityColor = qualityScore >= 80 ? "#10b981" : qualityScore >= 40 ? "#f59e0b" : "#f43f5e";
        const qualitySubtitle = qualityScore >= 80
            ? "Base limpa, engajada e com baixa perda."
            : qualityScore >= 40
                ? "Boa base, mas com sinais de dispersão."
                : "Risco alto de audiência fria ou pouco qualificada.";

        const rawBots = clamp(Math.round(4 + (1 - churnNorm) * 10 + (1 - deepSignalNorm) * 6), 3, 18);
        const rawGhost = clamp(Math.round(8 + (1 - engagementNorm) * 14 + (1 - retentionNorm) * 6), 6, 30);
        let valuablePct = 100 - rawBots - rawGhost;
        let ghostPct = rawGhost;
        let botPct = rawBots;
        if (valuablePct < 55) {
            const deficit = 55 - valuablePct;
            ghostPct = Math.max(6, ghostPct - Math.ceil(deficit * 0.7));
            botPct = Math.max(3, botPct - Math.floor(deficit * 0.3));
            valuablePct = 100 - ghostPct - botPct;
        }

        const topCities = data.demographics.cities_data.slice(0, 8);
        let outsideShare = 0;
        let topOutsideCity = "";
        let topOutsideShare = 0;

        topCities.forEach((city) => {
            const stateCode = getStateCodeFromCity(city.city);
            const isOutsideFreight = stateCode !== "" && !FREIGHT_BASE_STATES.has(stateCode);
            if (isOutsideFreight) {
                outsideShare += city.percentage;
                if (city.percentage > topOutsideShare) {
                    topOutsideShare = city.percentage;
                    topOutsideCity = city.city;
                }
            }
        });

        outsideShare = Number(outsideShare.toFixed(1));
        const geoRiskLevel = outsideShare >= 35 ? "ALTO" : outsideShare >= 20 ? "MÉDIO" : "BAIXO";
        const geoRiskTone = outsideShare >= 35 ? "text-rose-400" : outsideShare >= 20 ? "text-amber-400" : "text-emerald-400";
        const geoMessage = outsideShare >= 35
            ? `${outsideShare}% da audiência está fora da malha Sul/Sudeste.`
            : outsideShare >= 20
                ? `${outsideShare}% da audiência já demanda operação regional.`
                : "Distribuição regional está aderente à malha base atual.";
        const geoRecommendation = outsideShare >= 35
            ? "Ativar campanhas regionais e revisar promessas de frete/prazo para evitar fricção."
            : outsideShare >= 20
                ? "Separar criativos por região e monitorar custo de atendimento fora da zona principal."
                : "Manter cobertura nacional leve, concentrando investimento em praças de maior conversão.";

        const decisorShare = Number(
            engagedRows
                .filter((item) => item.range === decisorRange)
                .reduce((acc, item) => acc + item.total, 0)
                .toFixed(1)
        );
        const influencerShare = Number(
            engagedRows
                .filter((item) => item.range === influencerRange)
                .reduce((acc, item) => acc + item.total, 0)
                .toFixed(1)
        );
        const conversionInsight = influencerRange !== decisorRange
            ? `Audiência de volume em ${influencerRange}, mas clique/conversão tende a ${decisorRange}.`
            : `${decisorRange} concentra volume e conversão no período.`;

        return {
            baseRows,
            engagedRows,
            baseGender,
            engagedGender,
            influencerRange,
            decisorRange,
            conversionInsight,
            decisorShare,
            influencerShare,
            qualityScore,
            qualityLabel,
            qualityTone,
            qualityColor,
            qualitySubtitle,
            botometer: {
                valuablePct,
                ghostPct,
                botPct,
            },
            geoAlert: {
                outsideShare,
                topOutsideCity,
                level: geoRiskLevel,
                tone: geoRiskTone,
                message: geoMessage,
                recommendation: geoRecommendation,
            },
        };
    }, [data, followersSummary.totalLost, followersSummary.totalNew, isInstagram, videoRetentionSummary.retention3s]);
    const audienceRowsForView = useMemo(() => {
        if (!data?.demographics) return [] as AudienceAgeRow[];
        if (isInstagram && instagramAudienceModel) {
            return audienceViewMode === "base_engajada"
                ? instagramAudienceModel.engagedRows
                : instagramAudienceModel.baseRows;
        }
        return normalizeAudienceRows(
            data.demographics.age.map((item) => ({
                range: item.range,
                male: item.male,
                female: item.female,
                total: item.male + item.female,
            }))
        );
    }, [audienceViewMode, data, instagramAudienceModel, isInstagram]);
    const audienceTotalsForView = useMemo(() => {
        if (!audienceRowsForView.length) {
            return {
                rawTotalMale: 0,
                rawTotalFemale: 0,
                totalMale: 0,
                totalFemale: 0,
                topAge: null as AudienceAgeRow | null,
                topAgePercentage: 0,
                sortedByAge: [] as AudienceAgeRow[],
            };
        }

        const rawTotalMale = audienceRowsForView.reduce((acc, item) => acc + item.male, 0);
        const rawTotalFemale = audienceRowsForView.reduce((acc, item) => acc + item.female, 0);
        const grandTotal = Math.max(1, rawTotalMale + rawTotalFemale);
        const totalMale = Math.round((rawTotalMale / grandTotal) * 100);
        const totalFemale = 100 - totalMale;
        const topAge = [...audienceRowsForView].sort((a, b) => b.total - a.total)[0] ?? null;
        const topAgePercentage = topAge ? Math.round(topAge.total) : 0;

        return {
            rawTotalMale,
            rawTotalFemale,
            totalMale,
            totalFemale,
            topAge,
            topAgePercentage,
            sortedByAge: [...audienceRowsForView].sort((a, b) => (AGE_ORDER[a.range] ?? 99) - (AGE_ORDER[b.range] ?? 99)),
        };
    }, [audienceRowsForView]);
    const maxAction = data ? Math.max(data.actions_split.reactions, data.actions_split.comments, data.actions_split.shares) : 1;
    const tabItems = useMemo(
        () => (
            isInstagram
                ? [
                    ...TAB_ITEMS,
                    { id: "reels_stories", label: "Reels/Stories" },
                ]
                : TAB_ITEMS
        ),
        [isInstagram],
    );

    if (!data) return <div className="p-20 text-center animate-pulse text-zinc-500">Carregando Insights do {isInstagram ? "Instagram" : "Facebook"}...</div>;

    return (
        <div className="space-y-6 pb-20">
            {/* Tabs Navigation & Period Selector */}
            {/* Tabs Navigation & Period Selector */}
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[var(--shell-border)] pb-0 mb-6 gap-4 bg-zinc-900/40 rounded-t-xl px-2 pt-2">
                <div className="flex flex-wrap items-end">
                    {tabItems.map((tab, index) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <div key={tab.id} className="relative flex items-center">
                                {/* Separator before item (if not first, not active, and previous was not active) */}
                                {index > 0 && !isActive && activeTab !== tabItems[index - 1].id && (
                                    <div className="w-px h-4 bg-zinc-700 mx-1" />
                                )}

                                <button
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        relative px-4 py-2 text-sm font-medium transition-all duration-200 group flex items-center justify-center min-w-[120px]
                                        ${isActive
                                            ? "bg-[var(--shell-surface)] text-white rounded-t-lg z-10 -mb-[1px] pb-[9px] shadow-[0_-1px_0_0_rgba(255,255,255,0.05),-1px_0_0_0_rgba(255,255,255,0.05),1px_0_0_0_rgba(255,255,255,0.05)] border-t border-x border-[var(--shell-border)] border-b-0"
                                            : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-lg mx-1"
                                        }
                                    `}
                                >
                                    {isActive && (
                                        <>
                                            {/* Corner curves for active tab - Chrome style approximation */}
                                            <div className="absolute bottom-0 -left-2 w-2 h-2 bg-transparent rounded-br-lg shadow-[2px_2px_0_0_var(--shell-surface)] pointer-events-none z-20" />
                                            <div className="absolute bottom-0 -right-2 w-2 h-2 bg-transparent rounded-bl-lg shadow-[-2px_2px_0_0_var(--shell-surface)] pointer-events-none z-20" />
                                        </>
                                    )}

                                    <span className="relative z-10 truncate max-w-[100px]">{tab.label}</span>
                                </button>
                            </div>
                        );
                    })}
                </div>
                {!hideTopPeriodSelector && (
                    <div className="flex items-center gap-2 pr-2">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 hidden md:inline">Período:</span>
                        <PeriodSelector value={period} onChange={(value) => setPeriod(value)} />
                    </div>
                )}
            </div>

            {/* TAB CONTENT: GERAL */}
            {activeTab === "geral" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        <KPICard title={isInstagram ? "Seguidores Ativos" : "Seguidores da Página"} value={data.page_followers.value} change={data.page_followers.change} icon={UserGroupIcon} tooltip="Quantidade de perfis que acompanham a conta neste período." />
                        <KPICard title={isInstagram ? "Interações Qualificadas" : "Reações Totais"} value={data.total_reactions.value} change={data.total_reactions.change} icon={HandThumbUpIcon} tooltip={isInstagram ? "Ações com intenção (salvar, compartilhar, responder, etc.)." : "Reações totais das publicações no período."} />
                        <KPICard title={isInstagram ? "Views de Reels" : "Visualizações de Vídeo"} value={data.organic_video_views.value} change={data.organic_video_views.change} icon={VideoCameraIcon} tooltip="Volume de visualizações de conteúdo em vídeo." />
                        <KPICard title="Engajamento" value={data.engagements.value} change={data.engagements.change} icon={ChatBubbleLeftEllipsisIcon} tooltip="Soma das interações geradas nas publicações." />
                        <KPICard title={isInstagram ? "Conteúdos Publicados" : "Total de Posts"} value={data.number_of_posts.value} change={data.number_of_posts.change} icon={DocumentTextIcon} tooltip="Quantidade de conteúdos publicados no período selecionado." />
                        <KPICard title={isInstagram ? "Alcance Não Seguidores" : "Impressões"} value={data.organic_impressions.value} change={data.organic_impressions.change} icon={EyeIcon} tooltip={isInstagram ? "Pessoas alcançadas fora da base atual de seguidores." : "Total de visualizações exibidas, incluindo repetições."} />
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <div className="xl:col-span-2 grid grid-cols-1 xl:grid-cols-2 gap-6">
                            <div
                                draggable={isGeneralArrangeMode}
                                onDragStart={() => setDraggingGeneralCard({ zone: "left", id: "mapa_calor" })}
                                onDragOver={(event) => {
                                    if (draggingGeneralCard?.zone === "left") event.preventDefault();
                                }}
                                onDrop={() => {
                                    if (draggingGeneralCard?.zone === "left") {
                                        moveGeneralCard("left", draggingGeneralCard.id, "mapa_calor");
                                    }
                                    setDraggingGeneralCard(null);
                                }}
                                onDragEnd={() => setDraggingGeneralCard(null)}
                                style={{
                                    order: getGeneralCardOrder("left", "mapa_calor"),
                                    gridColumn: getEditorConfig("mapa_calor").widthSpan === 2 ? "span 2 / span 2" : undefined,
                                    display: getEditorConfig("mapa_calor").hidden ? "none" : undefined,
                                }}
                                className={`${isGeneralArrangeMode ? "cursor-grab active:cursor-grabbing" : ""} rounded-3xl`}
                            >
                                {!getEditorConfig("mapa_calor").hidden && (
                                    <div style={{ backgroundColor: getEditorConfig("mapa_calor").bgColor }} className="rounded-3xl overflow-hidden h-full">
                                        <BrazilFollowersMap
                                            title={getEditorConfig("mapa_calor").title}
                                            subtitle={getEditorConfig("mapa_calor").subtitle}
                                            spanTwoRows={false}
                                        />
                                    </div>
                                )}
                            </div>

                            <div
                                draggable={isGeneralArrangeMode}
                                onDragStart={() => setDraggingGeneralCard({ zone: "left", id: "publicacoes" })}
                                onDragOver={(event) => {
                                    if (draggingGeneralCard?.zone === "left") event.preventDefault();
                                }}
                                onDrop={() => {
                                    if (draggingGeneralCard?.zone === "left") {
                                        moveGeneralCard("left", draggingGeneralCard.id, "publicacoes");
                                    }
                                    setDraggingGeneralCard(null);
                                }}
                                onDragEnd={() => setDraggingGeneralCard(null)}
                                style={{
                                    order: getGeneralCardOrder("left", "publicacoes"),
                                    gridColumn: getEditorConfig("publicacoes").widthSpan === 2 ? "span 2 / span 2" : undefined,
                                    display: getEditorConfig("publicacoes").hidden ? "none" : undefined,
                                }}
                                className={`${isGeneralArrangeMode ? "cursor-grab active:cursor-grabbing" : ""} rounded-3xl`}
                            >
                                <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-3xl p-6 h-full flex flex-col" style={{ backgroundColor: getEditorConfig("publicacoes").bgColor, minHeight: `${getEditorConfig("publicacoes").minHeight}px` }}>
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                                        <div>
                                            <h3 className="text-lg font-black italic tracking-tight text-blue-500">{getEditorConfig("publicacoes").title ?? "Publicações"}</h3>
                                            <p className="text-[11px] text-zinc-500 mt-1">{getEditorConfig("publicacoes").subtitle ?? "Destaques e resumo do desempenho do período."}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab("publicacoes")}
                                            className="px-3 py-2 rounded-xl bg-[var(--shell-side)] border border-[var(--shell-border)] text-[11px] font-black text-zinc-500 hover:text-[var(--foreground)] hover:border-blue-500/30 transition-colors self-start"
                                        >
                                            Ver detalhes
                                        </button>
                                    </div>

                                    {(() => {
                                        const posts = data.top_posts || [];
                                        const interactions = (p: InsightPost) => (p.reactions || 0) + (p.comments || 0) + (p.shares || 0);
                                        const bestByReach = [...posts].sort((a, b) => (b.reach || 0) - (a.reach || 0))[0];
                                        const bestByInteractions = [...posts].sort((a, b) => interactions(b) - interactions(a))[0];
                                        const avgReach = posts.length ? posts.reduce((acc, p) => acc + (p.reach || 0), 0) / posts.length : 0;
                                        const avgInteractions = posts.length ? posts.reduce((acc, p) => acc + interactions(p), 0) / posts.length : 0;
                                        const top3 = [...posts].sort((a, b) => interactions(b) - interactions(a)).slice(0, 3);
                                        const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
                                        const windowsMap = new Map<string, { label: string; posts: number; interactions: number; reach: number; typeCounts: Record<string, number> }>();
                                        const dayMap = new Map<number, { posts: number; interactions: number }>();

                                        posts.forEach((post) => {
                                            const date = new Date(post.timestamp);
                                            const day = date.getDay();
                                            const startHour = Math.floor(date.getHours() / 2) * 2;
                                            const endHour = Math.min(24, startHour + 2);
                                            const key = `${day}-${startHour}`;
                                            const label = `${weekDays[day]} · ${String(startHour).padStart(2, "0")}h-${String(endHour).padStart(2, "0")}h`;
                                            const bucket = windowsMap.get(key) ?? { label, posts: 0, interactions: 0, reach: 0, typeCounts: {} };
                                            bucket.posts += 1;
                                            bucket.interactions += interactions(post);
                                            bucket.reach += post.reach || 0;
                                            const postType = getPostType(post);
                                            bucket.typeCounts[postType] = (bucket.typeCounts[postType] ?? 0) + 1;
                                            windowsMap.set(key, bucket);

                                            const dayBucket = dayMap.get(day) ?? { posts: 0, interactions: 0 };
                                            dayBucket.posts += 1;
                                            dayBucket.interactions += interactions(post);
                                            dayMap.set(day, dayBucket);
                                        });

                                        const topWindows = [...windowsMap.values()]
                                            .sort((a, b) => (b.interactions - a.interactions) || (b.posts - a.posts))
                                            .slice(0, 3);
                                        const bestDayEntry = [...dayMap.entries()].sort((a, b) => b[1].interactions - a[1].interactions)[0];
                                        const bestDayLabel = bestDayEntry ? weekDays[bestDayEntry[0]] : "—";
                                        const maxWindowInteractions = Math.max(1, ...topWindows.map((slot) => slot.interactions));

                                        return (
                                            <div className="flex flex-col gap-6 flex-1">
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                    <div className="bg-[var(--shell-side)] border border-[var(--shell-border)] rounded-2xl p-4">
                                                        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Média de Alcance</div>
                                                        <div className="text-2xl font-black text-[var(--foreground)] mt-2">{formatNumber(Math.round(avgReach))}</div>
                                                        <div className="text-[10px] text-zinc-500 mt-1">por post</div>
                                                    </div>
                                                    <div className="bg-[var(--shell-side)] border border-[var(--shell-border)] rounded-2xl p-4">
                                                        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Média de Interações</div>
                                                        <div className="text-2xl font-black text-[var(--foreground)] mt-2">{formatNumber(Math.round(avgInteractions))}</div>
                                                        <div className="text-[10px] text-zinc-500 mt-1">{isInstagram ? "salvos + com. + comp. DM" : "reac. + com. + comp."}</div>
                                                    </div>
                                                    <div className="bg-[var(--shell-side)] border border-[var(--shell-border)] rounded-2xl p-4">
                                                        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Melhor por Alcance</div>
                                                        <div className="text-2xl font-black text-[var(--foreground)] mt-2">{bestByReach ? formatNumber(bestByReach.reach) : "—"}</div>
                                                        <div className="text-[10px] text-zinc-500 mt-1 truncate" title={bestByReach?.message}>{bestByReach?.message || "Sem dados"}</div>
                                                    </div>
                                                    <div className="bg-[var(--shell-side)] border border-[var(--shell-border)] rounded-2xl p-4">
                                                        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Melhor por Interações</div>
                                                        <div className="text-2xl font-black text-[var(--foreground)] mt-2">{bestByInteractions ? formatNumber(interactions(bestByInteractions)) : "—"}</div>
                                                        <div className="text-[10px] text-zinc-500 mt-1 truncate" title={bestByInteractions?.message}>{bestByInteractions?.message || "Sem dados"}</div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="bg-[var(--shell-side)] border border-[var(--shell-border)] rounded-2xl p-5">
                                                        <div className="flex items-start justify-between gap-4 mb-4">
                                                            <div>
                                                                <h4 className="text-sm font-black italic tracking-tight text-[var(--foreground)]">Divisão por ações</h4>
                                                                <p className="text-[10px] text-zinc-500 mt-0.5">O que mais gerou engajamento.</p>
                                                            </div>
                                                            <div className="text-[10px] font-black text-zinc-500 bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-full px-2 py-1">
                                                                {formatNumber(data.actions_split.reactions + data.actions_split.comments + data.actions_split.shares)}
                                                            </div>
                                                        </div>

                                                        <div className="space-y-3">
                                                            <div className="space-y-1">
                                                                <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-500">
                                                                    <span>{isInstagram ? "Salvamentos" : "Reações"}</span>
                                                                    <span>{formatNumber(data.actions_split.reactions)}</span>
                                                                </div>
                                                                <div className="h-3 w-full bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(data.actions_split.reactions / maxAction) * 100}%` }}></div>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-500">
                                                                    <span>Comentários</span>
                                                                    <span>{formatNumber(data.actions_split.comments)}</span>
                                                                </div>
                                                                <div className="h-3 w-full bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(data.actions_split.comments / maxAction) * 100}%` }}></div>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-500">
                                                                    <span>{isInstagram ? "Compart. DM" : "Compart."}</span>
                                                                    <span>{formatNumber(data.actions_split.shares)}</span>
                                                                </div>
                                                                <div className="h-3 w-full bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(data.actions_split.shares / maxAction) * 100}%` }}></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-[var(--shell-side)] border border-[var(--shell-border)] rounded-2xl p-5">
                                                        <div className="flex items-start justify-between gap-4 mb-4">
                                                            <div>
                                                                <h4 className="text-sm font-black italic tracking-tight text-[var(--foreground)]">Top 3 posts</h4>
                                                                <p className="text-[10px] text-zinc-500 mt-0.5">Ordenado por interações.</p>
                                                            </div>
                                                            <div className="text-[10px] font-black text-zinc-500 bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-full px-2 py-1">
                                                                {posts.length} posts
                                                            </div>
                                                        </div>

                                                        <div className="space-y-3">
                                                            {top3.map((post) => (
                                                                <div key={post.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--shell-surface)] transition-colors">
                                                                    <div className="w-11 h-11 rounded-lg bg-zinc-200 dark:bg-zinc-800 overflow-hidden shrink-0">
                                                                        <img src={post.image} alt="" className="w-full h-full object-cover opacity-90" />
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="text-[11px] font-black text-[var(--foreground)] truncate" title={post.message}>{post.message}</div>
                                                                        <div className="flex items-center gap-3 text-[10px] text-zinc-500 mt-0.5 font-mono">
                                                                            <span title="Alcance">A {formatNumber(post.reach)}</span>
                                                                            <span title="Interações">I {formatNumber(interactions(post))}</span>
                                                                            <span className="truncate" title={post.date}>{post.date}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-[var(--shell-side)] border border-[var(--shell-border)] rounded-2xl p-5 flex-1 flex flex-col min-h-[180px]">
                                                    <div className="flex items-start justify-between gap-4 mb-4">
                                                        <div>
                                                            <h4 className="text-sm font-black italic tracking-tight text-[var(--foreground)]">Melhores horários para publicações</h4>
                                                            <p className="text-[10px] text-zinc-500 mt-0.5">Resumo baseado nos posts com maior interação.</p>
                                                        </div>
                                                        <div className="text-[10px] font-black text-zinc-500 bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-full px-2 py-1">
                                                            Dia líder: {bestDayLabel}
                                                        </div>
                                                    </div>

                                                    {topWindows.length > 0 ? (
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 auto-rows-fr flex-1">
                                                            {topWindows.map((slot, index) => {
                                                                const score = Math.round((slot.interactions / maxWindowInteractions) * 100);
                                                                const reachSafe = Math.max(1, slot.reach);
                                                                const engagementRate = slot.interactions / reachSafe;
                                                                const bestFor = engagementRate >= 0.55 ? "Engajamento" : "Alcance";
                                                                const typeEntries = Object.entries(slot.typeCounts);
                                                                const topType = typeEntries.sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
                                                                const topTypeLabel = topType === "video" ? "Reels/Vídeo" : topType === "photo" ? "Foto" : topType === "album" ? "Carrossel" : topType;

                                                                return (
                                                                    <div
                                                                        key={`${slot.label}-${index}`}
                                                                        className="rounded-xl border border-[var(--shell-border)] bg-[var(--shell-surface)] p-3 h-full flex flex-col"
                                                                    >
                                                                        <div className="flex items-start justify-between gap-2">
                                                                            <div>
                                                                                <div className="text-[10px] text-zinc-500 font-bold uppercase">#{index + 1} Horário</div>
                                                                                <div className="text-sm font-black text-[var(--foreground)] mt-1">{slot.label}</div>
                                                                            </div>
                                                                            <div className="text-right">
                                                                                <div className="text-[10px] text-zinc-500 font-bold uppercase">Score</div>
                                                                                <div className="text-2xl font-black text-blue-500 leading-none mt-1">{score}</div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="text-[10px] text-zinc-500 mt-2">
                                                                            {slot.posts} posts · {formatNumber(slot.interactions)} interações · {formatNumber(slot.reach)} de alcance
                                                                        </div>

                                                                        <div className="mt-auto pt-3 space-y-2">
                                                                            <div className="flex items-center justify-between gap-2 text-[10px]">
                                                                                <span className="text-zinc-500 font-bold uppercase flex items-center gap-1.5">
                                                                                    <ClockIcon className="w-3.5 h-3.5 text-zinc-400" />
                                                                                    Melhor para
                                                                                </span>
                                                                                <span className="font-black text-[var(--foreground)]">{bestFor}</span>
                                                                            </div>
                                                                            <div className="flex items-center justify-between gap-2 text-[10px]">
                                                                                <span className="text-zinc-500 font-bold uppercase flex items-center gap-1.5">
                                                                                    <DocumentTextIcon className="w-3.5 h-3.5 text-zinc-400" />
                                                                                    Tipo líder
                                                                                </span>
                                                                                <span className="font-black text-[var(--foreground)]">{topTypeLabel}</span>
                                                                            </div>
                                                                            <div className="flex items-center justify-between gap-2 text-[10px]">
                                                                                <span className="text-zinc-500 font-bold uppercase flex items-center gap-1.5">
                                                                                    <ChatBubbleLeftEllipsisIcon className="w-3.5 h-3.5 text-zinc-400" />
                                                                                    Interação/alc.
                                                                                </span>
                                                                                <span className="font-black text-[var(--foreground)]">{(engagementRate * 100).toFixed(0)}%</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-zinc-500">Sem dados suficientes para calcular horários.</div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-6">
                            <div
                                draggable={isGeneralArrangeMode}
                                onDragStart={() => setDraggingGeneralCard({ zone: "right", id: "demografia" })}
                                onDragOver={(event) => {
                                    if (draggingGeneralCard?.zone === "right") event.preventDefault();
                                }}
                                onDrop={() => {
                                    if (draggingGeneralCard?.zone === "right") {
                                        moveGeneralCard("right", draggingGeneralCard.id, "demografia");
                                    }
                                    setDraggingGeneralCard(null);
                                }}
                                onDragEnd={() => setDraggingGeneralCard(null)}
                                style={{
                                    order: getGeneralCardOrder("right", "demografia"),
                                    display: getEditorConfig("demografia").hidden ? "none" : undefined,
                                    minHeight: `${getEditorConfig("demografia").minHeight}px`,
                                    backgroundColor: getEditorConfig("demografia").bgColor,
                                }}
                                className={`${isGeneralArrangeMode ? "cursor-grab active:cursor-grabbing" : ""} rounded-3xl`}
                            >
                                {data.demographics && (() => {
                                    const rawTotalMale = data.demographics.age.reduce((acc, curr) => acc + curr.male, 0);
                                    const rawTotalFemale = data.demographics.age.reduce((acc, curr) => acc + curr.female, 0);
                                    const grandTotal = Math.max(1, rawTotalMale + rawTotalFemale);
                                    const femalePct = Math.round((rawTotalFemale / grandTotal) * 100);
                                    const malePct = 100 - femalePct;
                                    const topAge = [...data.demographics.age].sort((a, b) => (b.male + b.female) - (a.male + a.female))[0];
                                    const topAgePct = Math.round(((topAge.male + topAge.female) / grandTotal) * 100);

                                    return (
                                        <div className="space-y-3">
                                            <div className="px-1">
                                                <h4 className="text-sm font-black italic tracking-tight text-blue-500">{getEditorConfig("demografia").title ?? "Demografia"}</h4>
                                                <p className="text-[11px] text-zinc-500 mt-1">{getEditorConfig("demografia").subtitle ?? "Resumo por faixa etária e gênero."}</p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-3xl p-5 relative">
                                                    <h4 className="text-sm font-black italic tracking-tight text-blue-500 mb-4">Total por Faixa Etária</h4>
                                                    <div className="mx-auto w-40 h-40 rounded-full flex items-center justify-center" style={{
                                                        background: "conic-gradient(#14b8a6 0 26%, #06b6d4 26% 45%, #3b82f6 45% 62%, #84cc16 62% 78%, #eab308 78% 90%, #f97316 90% 100%)"
                                                    }}>
                                                        <div className="w-24 h-24 rounded-full bg-[var(--shell-surface)] border border-[var(--shell-border)] flex flex-col items-center justify-center">
                                                            <span className="text-3xl font-black text-[var(--foreground)] leading-none">{topAgePct}%</span>
                                                            <span className="text-[11px] font-black text-zinc-500 uppercase mt-1">{topAge.range}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-3xl p-5 relative">
                                                    <h4 className="text-sm font-black italic tracking-tight text-blue-500 mb-4">Resumo de Gênero</h4>
                                                    <div className="mx-auto w-40 h-40 rounded-full flex items-center justify-center" style={{
                                                        background: `conic-gradient(#fb923c 0 ${femalePct}%, #0ea5e9 ${femalePct}% 100%)`
                                                    }}>
                                                        <div className="w-24 h-24 rounded-full bg-[var(--shell-surface)] border border-[var(--shell-border)] flex flex-col items-center justify-center">
                                                            <span className="text-3xl font-black text-[var(--foreground)] leading-none">{Math.max(femalePct, malePct)}%</span>
                                                            <span className="text-[11px] font-black text-zinc-500 uppercase mt-1">{femalePct >= malePct ? "MULHERES" : "HOMENS"}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            <div
                                draggable={isGeneralArrangeMode}
                                onDragStart={() => setDraggingGeneralCard({ zone: "right", id: "publico" })}
                                onDragOver={(event) => {
                                    if (draggingGeneralCard?.zone === "right") event.preventDefault();
                                }}
                                onDrop={() => {
                                    if (draggingGeneralCard?.zone === "right") {
                                        moveGeneralCard("right", draggingGeneralCard.id, "publico");
                                    }
                                    setDraggingGeneralCard(null);
                                }}
                                onDragEnd={() => setDraggingGeneralCard(null)}
                                style={{
                                    order: getGeneralCardOrder("right", "publico"),
                                    display: getEditorConfig("publico").hidden ? "none" : undefined,
                                }}
                                className={`${isGeneralArrangeMode ? "cursor-grab active:cursor-grabbing" : ""} rounded-3xl`}
                            >
                                <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-3xl p-6" style={{ minHeight: `${getEditorConfig("publico").minHeight}px`, backgroundColor: getEditorConfig("publico").bgColor }}>
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                                        <div>
                                            <h3 className="text-lg font-black italic tracking-tight text-blue-500">{getEditorConfig("publico").title ?? "Público"}</h3>
                                            <p className="text-[11px] text-zinc-500 mt-1">{getEditorConfig("publico").subtitle ?? "Principais dados de audiência e distribuição."}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab("publico")}
                                            className="px-3 py-2 rounded-xl bg-[var(--shell-side)] border border-[var(--shell-border)] text-[11px] font-black text-zinc-500 hover:text-[var(--foreground)] hover:border-blue-500/30 transition-colors self-start"
                                        >
                                            Ver detalhes
                                        </button>
                                    </div>

                                    {data.demographics ? (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-[var(--shell-side)] border border-[var(--shell-border)] rounded-2xl p-4">
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">País Principal</div>
                                                <div className="text-lg font-black text-[var(--foreground)] mt-2 truncate" title={data.demographics.top_country}>{data.demographics.top_country}</div>
                                            </div>
                                            <div className="bg-[var(--shell-side)] border border-[var(--shell-border)] rounded-2xl p-4">
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Cidade Principal</div>
                                                <div className="text-lg font-black text-[var(--foreground)] mt-2 truncate" title={data.demographics.top_city}>{data.demographics.top_city}</div>
                                            </div>
                                            <div className="bg-[var(--shell-side)] border border-[var(--shell-border)] rounded-2xl p-4">
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Idioma</div>
                                                <div className="text-lg font-black text-[var(--foreground)] mt-2 truncate" title={data.demographics.top_language}>{data.demographics.top_language}</div>
                                            </div>
                                            <div className="bg-[var(--shell-side)] border border-[var(--shell-border)] rounded-2xl p-4">
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Faixa Etária</div>
                                                <div className="text-lg font-black text-[var(--foreground)] mt-2 truncate" title={data.demographics.top_age_group}>{data.demographics.top_age_group}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-[var(--shell-side)] border border-[var(--shell-border)] rounded-2xl p-4 text-sm text-zinc-500">
                                            Dados de audiência indisponíveis para este período.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div
                                draggable={isGeneralArrangeMode}
                                onDragStart={() => setDraggingGeneralCard({ zone: "right", id: "seguidores_periodo" })}
                                onDragOver={(event) => {
                                    if (draggingGeneralCard?.zone === "right") event.preventDefault();
                                }}
                                onDrop={() => {
                                    if (draggingGeneralCard?.zone === "right") {
                                        moveGeneralCard("right", draggingGeneralCard.id, "seguidores_periodo");
                                    }
                                    setDraggingGeneralCard(null);
                                }}
                                onDragEnd={() => setDraggingGeneralCard(null)}
                                style={{
                                    order: getGeneralCardOrder("right", "seguidores_periodo"),
                                    display: getEditorConfig("seguidores_periodo").hidden ? "none" : undefined,
                                }}
                                className={`${isGeneralArrangeMode ? "cursor-grab active:cursor-grabbing" : ""} rounded-3xl`}
                            >
                                <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-3xl overflow-hidden" style={{ minHeight: `${getEditorConfig("seguidores_periodo").minHeight}px`, backgroundColor: getEditorConfig("seguidores_periodo").bgColor }}>
                                    <div className="p-5 border-b border-[var(--shell-border)] bg-[var(--shell-side)] flex items-center justify-between">
                                        <h4 className="text-sm font-black italic tracking-tight text-blue-500">{getEditorConfig("seguidores_periodo").title ?? "Seguidores no Período"}</h4>
                                        <span className="text-[10px] font-black uppercase text-zinc-500">Período atual</span>
                                    </div>
                                    <div className="p-5 space-y-3">
                                        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                                            <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Novos Seguidores</div>
                                            <div className="text-4xl font-black tracking-tight text-emerald-400 mt-2">+{formatNumber(periodFollowers.newFollowers)}</div>
                                        </div>
                                        <div className="rounded-2xl border border-[var(--shell-border)] bg-[var(--shell-side)] p-4 flex items-end justify-between">
                                            <div>
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Crescimento</div>
                                                <div className={`text-3xl font-black tracking-tight mt-2 ${periodFollowers.growthPct >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                                    {periodFollowers.growthPct >= 0 ? "+" : ""}{periodFollowers.growthPct.toFixed(1)}%
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Saldo Líquido</div>
                                                <div className={`text-lg font-black mt-2 ${periodFollowers.net >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                                    {periodFollowers.net >= 0 ? "+" : ""}{formatNumber(periodFollowers.net)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {customBoxes.filter((item) => item.zone === "right").map((box) => (
                                <div
                                    key={box.id}
                                    className="rounded-3xl"
                                >
                                    {!getEditorConfig(box.id).hidden && (
                                        <div
                                            className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-3xl p-6"
                                            style={{ minHeight: `${getEditorConfig(box.id).minHeight}px`, backgroundColor: getEditorConfig(box.id).bgColor }}
                                        >
                                            <h4 className="text-lg font-black italic tracking-tight text-blue-500">{getEditorConfig(box.id).title ?? "Nova Caixa"}</h4>
                                            <p className="text-[11px] text-zinc-500 mt-2">{getEditorConfig(box.id).subtitle ?? "Sem conteúdo"}</p>
                                        </div>
                                    )}
                                </div>
                            ))}

                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: PUBLICAÇÕES (SPLIT VIEW) */}
            {activeTab === "publicacoes" && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">

                    {isInstagram && instagramPublicationsTopStats && (
                        <div className="grid grid-cols-1 lg:grid-cols-8 gap-4 items-stretch">
                            <div className="lg:col-span-4 space-y-4">
                                <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-2xl px-6 py-5 min-h-[118px] flex flex-col justify-center">
                                    <div className="text-zinc-500 text-[11px] font-bold uppercase tracking-[0.14em]">Total de Posts</div>
                                    <div className="text-5xl leading-[0.9] font-black text-[var(--foreground)] tracking-tight mt-2">
                                        {instagramPublicationsTopStats.totalPosts.toLocaleString("pt-BR")}
                                    </div>
                                    <div className="mt-2 flex items-end justify-between gap-3">
                                        <span className="text-[12px] font-semibold text-zinc-500">Média de Engajamento/Post</span>
                                        <span className="text-2xl font-black text-emerald-400">
                                            {instagramPublicationsTopStats.avgEngagementPerPost.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-2xl px-6 py-5">
                                    <div className="text-zinc-500 text-[11px] font-bold uppercase tracking-[0.14em] mb-4">Médias por Post</div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="rounded-2xl border border-[var(--shell-border)] bg-[var(--shell-side)] px-5 py-4 flex flex-col justify-center min-h-[118px]">
                                            <div className="text-zinc-500 text-[11px] font-bold uppercase tracking-[0.14em]">Interações</div>
                                            <div className="text-5xl leading-[0.9] font-black text-[var(--foreground)] tracking-tight mt-2">
                                                {instagramPublicationsTopStats.avgInteractionsPerPost.toLocaleString("pt-BR")}
                                            </div>
                                            <div className="mt-2 text-[12px] font-semibold text-zinc-500">Média por post</div>
                                        </div>
                                        <div className="rounded-2xl border border-[var(--shell-border)] bg-[var(--shell-side)] px-5 py-4 flex flex-col justify-center min-h-[118px]">
                                            <div className="text-zinc-500 text-[11px] font-bold uppercase tracking-[0.14em]">Visualizações</div>
                                            <div className="text-5xl leading-[0.9] font-black text-[var(--foreground)] tracking-tight mt-2">
                                                {instagramPublicationsTopStats.avgViewsPerPost.toLocaleString("pt-BR")}
                                            </div>
                                            <div className="mt-2 text-[12px] font-semibold text-zinc-500">Média por post</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-4 lg:justify-self-end w-full h-full grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="w-full h-full flex flex-col justify-center items-center gap-6 p-6 rounded-2xl bg-[var(--shell-side)] border border-[var(--shell-border)] relative">
                                    {(() => {
                                        const segments = instagramPublicationsTopStats.split.map((item) => {
                                            const value = Math.max(0, item.percentage);
                                            return { ...item, percentage: value };
                                        });
                                        const totalPercentage = Math.max(1, segments.reduce((acc, segment) => acc + segment.percentage, 0));
                                        let cursor = 0;
                                        const donutGradient = segments
                                            .map((segment) => {
                                                const normalized = (segment.percentage / totalPercentage) * 100;
                                                const start = cursor;
                                                cursor += normalized;
                                                return `${segment.color} ${start}% ${cursor}%`;
                                            })
                                            .join(", ");
                                        const main = instagramPublicationsTopStats.split.reduce((prev, curr) =>
                                            curr.percentage > prev.percentage ? curr : prev
                                        );

                                        return (
                                            <>
                                                <div className="w-full text-left">
                                                    <h4 className="text-[10px] font-bold uppercase text-zinc-500 mb-1 tracking-widest">Total de Interações</h4>
                                                    <div className="text-3xl font-black text-[var(--foreground)] tracking-tight">
                                                        {instagramPublicationsTopStats.totalInteractions.toLocaleString("pt-BR")}
                                                    </div>
                                                    <div className="text-[10px] text-zinc-500 mt-1">
                                                        {main.label} é o maior sinal, com <strong className="text-[var(--foreground)]">{main.percentage.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%</strong> do total.
                                                    </div>
                                                </div>

                                                <div className="relative w-44 h-44 flex items-center justify-center">
                                                    <div
                                                        className="w-full h-full rounded-full -rotate-90 transition-all duration-700"
                                                        style={{ background: `conic-gradient(${donutGradient})` }}
                                                    />
                                                    <div className="absolute inset-[28px] rounded-full bg-[var(--shell-surface)] border border-[var(--shell-border)] flex flex-col items-center justify-center text-center px-2">
                                                        <div className="text-4xl leading-none font-black text-zinc-900 dark:text-white tracking-tight tabular-nums">
                                                            {main.percentage.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%
                                                        </div>
                                                        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mt-1">
                                                            {main.label}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="w-full space-y-1.5">
                                                    {instagramPublicationsTopStats.split.map((item) => (
                                                        <div key={item.label} className="flex items-center justify-between text-xs">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                                                <span className="text-zinc-500 uppercase font-bold tracking-wide">{item.label}</span>
                                                            </div>
                                                            <span className={`font-black ${item.tone}`}>
                                                                {item.percentage.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                                                            </span>
                                                        </div>
                                                    ))}
                                                    <div className="h-1.5 rounded-full overflow-hidden flex bg-[var(--shell-border)] mt-1">
                                                        {instagramPublicationsTopStats.split.map((item) => (
                                                            <div
                                                                key={`bar-${item.label}`}
                                                                style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>

                                <div className="w-full h-full flex flex-col justify-center items-center gap-6 p-6 rounded-2xl bg-[var(--shell-side)] border border-[var(--shell-border)] relative">
                                    {(() => {
                                        const totalPosts = Math.max(1, instagramPublicationsTopStats.totalPosts);
                                        const segments = instagramPublicationsTopStats.postTypeSplit.map((item) => {
                                            const percentage = (item.count / totalPosts) * 100;
                                            return { ...item, percentage };
                                        });
                                        const totalPercentage = Math.max(1, segments.reduce((acc, segment) => acc + segment.percentage, 0));
                                        let cursor = 0;
                                        const donutGradient = segments
                                            .map((segment) => {
                                                const normalized = (segment.percentage / totalPercentage) * 100;
                                                const start = cursor;
                                                cursor += normalized;
                                                return `${segment.color} ${start}% ${cursor}%`;
                                            })
                                            .join(", ");
                                        const main = segments.reduce((prev, curr) =>
                                            curr.count > prev.count ? curr : prev
                                        );

                                        return (
                                            <>
                                                <div className="w-full text-left">
                                                    <h4 className="text-[10px] font-bold uppercase text-zinc-500 mb-1 tracking-widest">Tipo de Posts</h4>
                                                    <div className="text-3xl font-black text-[var(--foreground)] tracking-tight">
                                                        {instagramPublicationsTopStats.totalPosts.toLocaleString("pt-BR")}
                                                    </div>
                                                    <div className="text-[10px] text-zinc-500 mt-1">
                                                        {main.label} lidera com <strong className="text-[var(--foreground)]">{main.count}</strong> de {instagramPublicationsTopStats.totalPosts} posts.
                                                    </div>
                                                </div>

                                                <div className="relative w-44 h-44 flex items-center justify-center">
                                                    <div
                                                        className="w-full h-full rounded-full -rotate-90 transition-all duration-700"
                                                        style={{ background: `conic-gradient(${donutGradient})` }}
                                                    />
                                                    <div className="absolute inset-[28px] rounded-full bg-[var(--shell-surface)] border border-[var(--shell-border)] flex flex-col items-center justify-center text-center px-2">
                                                        <div className="text-4xl leading-none font-black text-zinc-900 dark:text-white tracking-tight tabular-nums">
                                                            {main.count}
                                                        </div>
                                                        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mt-1">
                                                            {main.label}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="w-full space-y-1.5">
                                                    {segments.map((item) => (
                                                        <div key={item.label} className="flex items-center justify-between text-xs">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                                                <span className="text-zinc-500 uppercase font-bold tracking-wide">{item.label}</span>
                                                            </div>
                                                            <span className={`font-black ${item.tone}`}>
                                                                {item.count}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    <div className="h-1.5 rounded-full overflow-hidden flex bg-[var(--shell-border)] mt-1">
                                                        {segments.map((item) => (
                                                            <div
                                                                key={`bar-type-${item.label}`}
                                                                style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* LEFT: DESEMPENHO (Detailed Performance Table with Pagination) */}
                        <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-3xl p-6 flex flex-col h-full">

                            <h3 className="text-lg font-black italic tracking-tight mb-4 text-blue-500">Desempenho da Publicação</h3>

                            {/* Best Post by Reach Card */}
                            {/* Best Post by Reach Card + Engagement Stats */}
                            {(() => {
                                const bestPostPerformance = [...data.top_posts].sort((a, b) => b.reach - a.reach)[0];
                                const reachChange = 5.75;

                                return (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        {/* Left: Best Post Card */}
                                        <div className="bg-blue-50 dark:bg-blue-500/5 rounded-xl p-4 border border-blue-100 dark:border-blue-500/20 flex flex-col justify-center">
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
                                                    <p className="text-xs font-medium text-[var(--foreground)] line-clamp-2 mb-2 italic">{`"${bestPostPerformance.message}"`}</p>
                                                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                                        Este post alcançou <span className="font-bold">{formatNumber(bestPostPerformance.reach)}</span> pessoas.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Engagement Stats Highlights */}
                                        <div className="bg-[var(--shell-side)] rounded-xl p-6 flex flex-col justify-center text-center border border-[var(--shell-border)]">
                                            <span className="text-zinc-500 text-xs font-bold uppercase mb-1">{isInstagram ? "Engajamento Total" : "Total Engagement"}</span>
                                            <div className="flex items-center justify-center gap-2 mb-3">
                                                <span className="text-5xl font-black text-[var(--foreground)] tracking-tight">{Math.round(data.engagements.value).toLocaleString('pt-BR')}</span>
                                                <span className={`text-sm font-bold ${data.engagements.change > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {data.engagements.change > 0 ? '↑' : '↓'} {Math.abs(data.engagements.change)}%
                                                </span>
                                            </div>
                                            <div className="flex justify-center gap-4 text-[11px] text-zinc-500 font-medium pt-3 border-t border-[var(--shell-border)]">
                                                <span title={isInstagram ? "Saves" : "Reactions"}>{isInstagram ? "🔖" : "👍"} {data.actions_split.reactions.toLocaleString('pt-BR')}</span>
                                                <span title="Comments">💬 {data.actions_split.comments.toLocaleString('pt-BR')}</span>
                                                <span title={isInstagram ? "DM Shares" : "Shares"}>{isInstagram ? "✈️" : "🔗"} {data.actions_split.shares.toLocaleString('pt-BR')}</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })()}


                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-[var(--shell-surface)] z-10">
                                        <tr className="border-b border-[var(--shell-border)] font-bold uppercase tracking-wider text-zinc-500 text-xs">
                                            <th className="pb-3 pl-2">Post</th>
                                            <th className="pb-3 px-2">{isInstagram ? "Conteúdo" : "Message"}</th>
                                            <th className="pb-3 px-2">{isInstagram ? "Data" : "Date"}</th>
                                            <th className="pb-3 text-right px-2">Imp.</th>
                                            <th className="pb-3 text-right px-2">Alcance</th>
                                            <th className="pb-3 text-right px-2">{isInstagram ? "Salvos" : "Reações"}</th>
                                            <th className="pb-3 text-right px-2">Coment.</th>
                                            <th className="pb-3 text-right px-2">{isInstagram ? "Comp. DM" : "Compart."}</th>
                                            <th className="pb-3 text-right px-2">{isInstagram ? "Views Reels" : "Video"}</th>
                                            <th className="pb-3 text-right px-2">{isInstagram ? "Toques Link" : "Cliques"}</th>
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
                                                <td className="py-3 text-right px-2 text-zinc-400 font-mono">{(post.impressions || Math.round(post.reach * 1.2)).toLocaleString('pt-BR')}</td>
                                                <td className="py-3 text-right px-2 font-mono text-[var(--foreground)] font-bold">{post.reach.toLocaleString('pt-BR')}</td>
                                                <td className="py-3 text-right px-2 font-mono text-zinc-400">{post.reactions.toLocaleString('pt-BR')}</td>
                                                <td className="py-3 text-right px-2 font-mono text-zinc-400">{post.comments.toLocaleString('pt-BR')}</td>
                                                <td className="py-3 text-right px-2 font-mono text-zinc-400">{post.shares.toLocaleString('pt-BR')}</td>
                                                <td className="py-3 text-right px-2 font-mono text-purple-500">{post.video_views.toLocaleString('pt-BR')}</td>
                                                <td className="py-3 text-right px-2 font-mono text-zinc-400">{post.link_clicks.toLocaleString('pt-BR')}</td>
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
                                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>{isInstagram ? "Salvos" : "Reações"}
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
                                            <span className="w-2 h-2 rounded-full bg-amber-400"></span>{isInstagram ? "Comp. DM" : "Compart."}
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
                                                                            <div className="font-medium text-zinc-300 mb-2 truncate max-w-[200px] italic">{`"${post.message}"`}</div>

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
                                                                <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20 relative z-10 transform hover:scale-110 transition-transform duration-200">
                                                                    <div className="w-[30px] h-[30px] bg-white rounded-lg flex flex-col items-center justify-center pb-0.5">
                                                                        <span className="text-[7px] font-black text-zinc-400 uppercase leading-none mb-0.5 tracking-tighter">{month}</span>
                                                                        <span className="text-sm font-black text-zinc-900 leading-none tracking-tight">{day}</span>
                                                                    </div>
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
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 min-h-[320px]">
                                            <SpeedometerChart title="Alcance Médio" data={speedData.reach} />
                                            <SpeedometerChart title="Engajamento Total" data={speedData.engagement} />
                                            <SpeedometerChart title={isInstagram ? "Toques no Link" : "Cliques (Tráfego)"} data={speedData.clicks} />
                                        </div>

                                        <div className="mt-6 bg-[var(--shell-side)] border border-[var(--shell-border)] rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <h5 className="text-xs font-black uppercase tracking-widest text-zinc-500">Eficiência por Formato (Média/Post)</h5>
                                                <span className="text-[10px] font-bold text-zinc-500">Comparativo de produtividade criativa</span>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-sm whitespace-nowrap">
                                                    <thead>
                                                        <tr className="border-b border-[var(--shell-border)] text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                                                            <th className="pb-2 pr-3">Formato</th>
                                                            <th className="pb-2 pr-3 text-right">Posts</th>
                                                            <th className="pb-2 pr-3 text-right">Alcance Médio</th>
                                                            <th className="pb-2 pr-3 text-right">Engaj. Médio</th>
                                                            <th className="pb-2 pr-3 text-right">Toques Médios</th>
                                                            <th className="pb-2 pr-3 text-right">Eficiência</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[var(--shell-border)]">
                                                        {formatEfficiencyRows.map((row, idx) => (
                                                            <tr key={row.label}>
                                                                <td className="py-2 pr-3 font-black text-[var(--foreground)]">{row.label}</td>
                                                                <td className="py-2 pr-3 text-right font-mono text-zinc-400">{row.posts}</td>
                                                                <td className="py-2 pr-3 text-right font-mono text-zinc-400">{formatNumber(row.avgReach)}</td>
                                                                <td className="py-2 pr-3 text-right font-mono text-zinc-400">{formatNumber(row.avgEngagement)}</td>
                                                                <td className="py-2 pr-3 text-right font-mono text-zinc-400">{formatNumber(row.avgClicks)}</td>
                                                                <td className={`py-2 pr-3 text-right font-mono font-black ${idx === 0 ? "text-emerald-400" : "text-blue-400"}`}>{row.efficiency.toFixed(2)}%</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {isInstagram && (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                                <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-2xl px-6 py-5 min-h-[118px] flex flex-col justify-center">
                                                    <div className="text-zinc-500 text-[11px] font-bold uppercase tracking-[0.14em]">Retenção 0-3s</div>
                                                    <div className="text-5xl leading-[0.9] font-black text-emerald-500 mt-2">{videoRetentionSummary.retention3s}%</div>
                                                    <div className="mt-2 text-[12px] font-semibold text-zinc-500">Taxa de permanência inicial</div>
                                                </div>
                                                <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-2xl px-6 py-5 min-h-[118px] flex flex-col justify-center">
                                                    <div className="text-zinc-500 text-[11px] font-bold uppercase tracking-[0.14em]">Tempo Médio</div>
                                                    <div className="text-5xl leading-[0.9] font-black text-blue-500 mt-2">{videoRetentionSummary.avgWatchSeconds}s</div>
                                                    <div className="mt-2 text-[12px] font-semibold text-zinc-500">Visualização média por Reel</div>
                                                </div>
                                                <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-2xl px-6 py-5 min-h-[118px] flex flex-col justify-center">
                                                    <div className="text-zinc-500 text-[11px] font-bold uppercase tracking-[0.14em]">Re-watch</div>
                                                    <div className="text-5xl leading-[0.9] font-black text-indigo-500 mt-2">{videoRetentionSummary.rewatchRate}%</div>
                                                    <div className="mt-2 text-[12px] font-semibold text-zinc-500">Taxa estimada de loop/revisita</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                            </div>
                        </div >

                        {/* RIGHT: REAÇÕES DESCRITIVAS DESTAQUE (Detailed Reactions) */}
                        < div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-3xl p-6 overflow-hidden flex flex-col h-full" >

                            <h3 className="text-lg font-black italic tracking-tight mb-4 text-emerald-500">{isInstagram ? "Detalhamento de Sinais de Qualidade" : "Detalhamento de Reações"}</h3>
                            {/* 1. Best Post Card + Total Interactions Stats */}
                            {(() => {
                                const bestPost = [...data.top_posts].sort((a, b) => (b.reactions + b.comments + b.shares) - (a.reactions + a.comments + a.shares))[0];
                                const engagement = bestPost.reactions + bestPost.comments + bestPost.shares;
                                const rate = ((engagement / bestPost.reach) * 100).toFixed(2);

                                // Stats for the right side
                                const totalInteractions = data.top_posts.reduce((acc, curr) => acc + curr.reactions + curr.comments + curr.shares, 0); const totalPosts = data.top_posts.length; const avgInteractions = Math.round(totalInteractions / (totalPosts || 1));

                                return (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        <div className="flex-1 bg-blue-50 dark:bg-blue-500/5 rounded-xl p-4 border border-blue-100 dark:border-blue-500/20">
                                            <div className="flex items-center gap-2 mb-3 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wide">
                                                <HandThumbUpIcon className="w-4 h-4" />
                                                {isInstagram ? "Melhor post por sinal qualificado" : "Melhor post por engajamento"}
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="w-24 h-24 shrink-0 rounded-lg bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                                                    <img src={bestPost.image} className="w-full h-full object-cover" alt="Best post" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 mb-1">
                                                        <span className="flex items-center gap-1"><span className="w-3 h-3">📅</span> {bestPost.date}</span>
                                                    </div>
                                                    <p className="text-xs font-medium text-[var(--foreground)] line-clamp-2 mb-2 italic">{`"${bestPost.message}"`}</p>
                                                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                                        Taxa de engajamento de <span className="font-bold text-blue-600 dark:text-blue-400">{rate}%</span> ({formatNumber(engagement)} interações).
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Summary Stats Highlight */}
                                        <div className="w-full bg-[var(--shell-side)] rounded-xl p-6 flex flex-col justify-center text-center border border-[var(--shell-border)]">
                                            <span className="text-zinc-500 text-xs font-bold uppercase mb-1">Total de Interações</span>
                                            <div className="flex items-center justify-center gap-2 mb-3">
                                                <span className="text-5xl font-black text-[var(--foreground)] tracking-tight">{totalInteractions.toLocaleString('pt-BR')}</span>
                                            </div>
                                            <div className="text-[11px] text-zinc-500 pt-3 border-t border-[var(--shell-border)]">
                                                Média: <span className="font-bold text-[var(--foreground)]">{avgInteractions.toLocaleString('pt-BR')}</span> / post
                                            </div>
                                        </div>
                                    </div>
                                )
                            })()}

                            {/* HEADER: ANALYTICS WIDGETS */}
                            {/* Chart: Reaction Performance (Top) */}




                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-[var(--shell-surface)] z-10">
                                        <tr className="border-b border-[var(--shell-border)] font-bold uppercase tracking-wider text-zinc-500 text-xs">
                                            <th className="pb-3 pl-2 min-w-[200px]">Post</th>
                                            <th className="pb-3 text-right px-2 text-blue-500">{isInstagram ? "Total Qualif." : "Total"}</th>
                                            <th className="pb-3 text-right px-2" title={isInstagram ? "Salvamentos" : "Like"}>{isInstagram ? "Salvos" : <span className="text-2xl">👍</span>}</th>
                                            <th className="pb-3 text-right px-2" title={isInstagram ? "Compartilhamentos por DM" : "Love"}>{isInstagram ? "Comp. DM" : <span className="text-2xl">❤️</span>}</th>
                                            <th className="pb-3 text-right px-2" title={isInstagram ? "Visitas ao Perfil" : "Haha"}>{isInstagram ? "Perfil" : <span className="text-2xl">😂</span>}</th>
                                            <th className="pb-3 text-right px-2" title={isInstagram ? "Toques no Link" : "Wow"}>{isInstagram ? "Link" : <span className="text-2xl">😮</span>}</th>
                                            <th className="pb-3 text-right px-2" title={isInstagram ? "Respostas" : "Sad"}>{isInstagram ? "Resp." : <span className="text-2xl">😢</span>}</th>
                                            <th className="pb-3 text-right px-2" title={isInstagram ? "Novos Seguidores" : "Angry"}>{isInstagram ? "Follows" : <span className="text-2xl">😡</span>}</th>
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
                                                <td className="py-3 text-right px-2 font-bold text-blue-500">{formatNumber(isInstagram ? getQualitySignalsTotal(post) : post.reactions)}</td>
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

                            {/* CHART MOVED HERE: Reaction Performance */}
                            <div className="mb-8 mt-8">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                    <h4 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                                        <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-500" />
                                        {isInstagram ? "Desempenho de Sinais de Qualidade" : "Desempenho de Reações"}
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium text-zinc-500">
                                        <button onClick={() => setVisibleReactions(p => ({ ...p, total: !p.total }))} className={`flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800/50 hover:bg-zinc-800 transition-all ${visibleReactions.total ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                                            <span className="w-2 h-2 rounded-full bg-white border border-zinc-500"></span><span className="text-white">Total</span>
                                        </button>
                                        <button onClick={() => setVisibleReactions(p => ({ ...p, like: !p.like }))} className={`flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 transition-all ${visibleReactions.like ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                                            <span className="w-2 h-2 rounded-full bg-blue-400"></span><span className="text-blue-400">{isInstagram ? "Salvos" : "Like"}</span>
                                        </button>
                                        <button onClick={() => setVisibleReactions(p => ({ ...p, love: !p.love }))} className={`flex items-center gap-1.5 px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 transition-all ${visibleReactions.love ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                                            <span className="w-2 h-2 rounded-full bg-rose-400"></span><span className="text-rose-400">{isInstagram ? "Comp. DM" : "Love"}</span>
                                        </button>
                                        <button onClick={() => setVisibleReactions(p => ({ ...p, haha: !p.haha }))} className={`flex items-center gap-1.5 px-2 py-1 rounded bg-yellow-500/10 hover:bg-yellow-500/20 transition-all ${visibleReactions.haha ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                                            <span className="w-2 h-2 rounded-full bg-yellow-400"></span><span className="text-yellow-400">{isInstagram ? "Perfil" : "Haha"}</span>
                                        </button>
                                        <button onClick={() => setVisibleReactions(p => ({ ...p, wow: !p.wow }))} className={`flex items-center gap-1.5 px-2 py-1 rounded bg-orange-500/10 hover:bg-orange-500/20 transition-all ${visibleReactions.wow ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                                            <span className="w-2 h-2 rounded-full bg-orange-400"></span><span className="text-orange-400">{isInstagram ? "Link" : "Wow"}</span>
                                        </button>
                                        <button onClick={() => setVisibleReactions(p => ({ ...p, sad: !p.sad }))} className={`flex items-center gap-1.5 px-2 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 transition-all ${visibleReactions.sad ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                                            <span className="w-2 h-2 rounded-full bg-cyan-400"></span><span className="text-cyan-400">{isInstagram ? "Resp." : "Sad"}</span>
                                        </button>
                                        <button onClick={() => setVisibleReactions(p => ({ ...p, angry: !p.angry }))} className={`flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 transition-all ${visibleReactions.angry ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                                            <span className="w-2 h-2 rounded-full bg-red-500"></span><span className="text-red-500">{isInstagram ? "Follows" : "Angry"}</span>
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

                                        const maxChartTotal = isInstagram
                                            ? Math.max(...sortedPosts.map((post) => getQualitySignalsTotal(post))) * 1.1 || 10
                                            : Math.max(...sortedPosts.map((post) => post.reactions)) * 1.1 || 10;

                                        const getX = (ts: number) => ((ts - minTime) / timeRange) * 100;
                                        const getY = (val: number) => 100 - ((val / maxChartTotal) * 100);

                                        return (
                                            <div className="w-full h-full relative">
                                                {/* Y-Axis Grid */}
                                                <div className="absolute inset-0 flex flex-col justify-between text-[9px] text-zinc-500 pointer-events-none pb-6 pr-4">
                                                    {[1, 0.5, 0].map((t) => (
                                                        <div key={t} className="flex items-center w-full relative h-0">
                                                            <span className="w-6 text-right mr-2 shrink-0">{formatNumber(Math.round(maxChartTotal * t))}</span>
                                                            <div className="w-full h-px bg-[var(--shell-border)] border-t border-dashed border-zinc-700/30"></div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Chart Area */}
                                                <div className="absolute top-0 left-8 right-8 bottom-24">
                                                    {/* Layer 1: SVG Lines */}
                                                    <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                                                        {visibleReactions.total && <polyline points={sortedPosts.map(p => `${getX(p.timestamp)},${getY(isInstagram ? getQualitySignalsTotal(p) : p.reactions)}`).join(" ")} fill="none" stroke="white" strokeWidth="0.5" vectorEffect="non-scaling-stroke" strokeDasharray="4 4" className="opacity-30" />}
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
                                                            const total = isInstagram ? getQualitySignalsTotal(p) : p.reactions;
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
                                                                            <div className="font-medium text-zinc-300 mb-2 truncate max-w-[200px] italic">{`"${p.message}"`}</div>
                                                                            <div className="grid grid-cols-6 gap-1 pt-2 text-[9px] text-center">
                                                                                <div className={`bg-zinc-800 rounded p-1 ${visibleReactions.like ? 'opacity-100' : 'opacity-40'}`}>
                                                                                    <div>{isInstagram ? "SALV" : "👍"}</div>
                                                                                    <div className="font-bold text-blue-400 mt-0.5">{formatNumber(p.reaction_breakdown?.like || 0)}</div>
                                                                                </div>
                                                                                <div className={`bg-zinc-800 rounded p-1 ${visibleReactions.love ? 'opacity-100' : 'opacity-40'}`}>
                                                                                    <div>{isInstagram ? "DM" : "❤️"}</div>
                                                                                    <div className="font-bold text-rose-400 mt-0.5">{formatNumber(p.reaction_breakdown?.love || 0)}</div>
                                                                                </div>
                                                                                <div className={`bg-zinc-800 rounded p-1 ${visibleReactions.haha ? 'opacity-100' : 'opacity-40'}`}>
                                                                                    <div>{isInstagram ? "PERFIL" : "😂"}</div>
                                                                                    <div className="font-bold text-yellow-400 mt-0.5">{formatNumber(p.reaction_breakdown?.haha || 0)}</div>
                                                                                </div>
                                                                                <div className={`bg-zinc-800 rounded p-1 ${visibleReactions.wow ? 'opacity-100' : 'opacity-40'}`}>
                                                                                    <div>{isInstagram ? "LINK" : "😮"}</div>
                                                                                    <div className="font-bold text-orange-400 mt-0.5">{formatNumber(p.reaction_breakdown?.wow || 0)}</div>
                                                                                </div>
                                                                                <div className={`bg-zinc-800 rounded p-1 ${visibleReactions.sad ? 'opacity-100' : 'opacity-40'}`}>
                                                                                    <div>{isInstagram ? "RESP" : "😢"}</div>
                                                                                    <div className="font-bold text-cyan-400 mt-0.5">{formatNumber(p.reaction_breakdown?.sad || 0)}</div>
                                                                                </div>
                                                                                <div className={`bg-zinc-800 rounded p-1 ${visibleReactions.angry ? 'opacity-100' : 'opacity-40'}`}>
                                                                                    <div>{isInstagram ? "FOLLOW" : "😡"}</div>
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
                                                                <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20 relative z-10 transform hover:scale-110 transition-transform duration-200">
                                                                    <div className="w-[30px] h-[30px] bg-white rounded-lg flex flex-col items-center justify-center pb-0.5">
                                                                        <span className="text-[7px] font-black text-zinc-400 uppercase leading-none mb-0.5 tracking-tighter">{month}</span>
                                                                        <span className="text-sm font-black text-zinc-900 leading-none tracking-tight">{day}</span>
                                                                    </div>
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



                            {heatmapData && (
                                <div className="mt-8 pt-8 border-t border-[var(--shell-border)]">
                                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                        <h4 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                                            <ClockIcon className="w-4 h-4 text-emerald-500" />
                                            Melhores Horários
                                        </h4>
                                        <div className="flex items-center gap-4">
                                            {/* Metric Toggle */}
                                            <div className="flex bg-[var(--shell-hover)] rounded-lg p-0.5 border border-[var(--shell-border)]">
                                                <button onClick={() => setHeatmapMetric('interactions')} className={`px-2 py-1 text-[10px] uppercase font-bold rounded-md transition-all ${heatmapMetric === 'interactions' ? 'bg-[var(--shell-active)] text-emerald-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>Interação</button>
                                                <button onClick={() => setHeatmapMetric('reach')} className={`px-2 py-1 text-[10px] uppercase font-bold rounded-md transition-all ${heatmapMetric === 'reach' ? 'bg-[var(--shell-active)] text-blue-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>Visualização</button>
                                            </div>
                                            {/* Summary Text */}
                                            {(() => {
                                                const allCells: { val: number; day: string; hour: string }[] = [];
                                                const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

                                                heatmapData.forEach((dayData, dIdx) => {
                                                    dayData.forEach((cell, hIdx) => {
                                                        if (cell[heatmapMetric] > 0) {
                                                            allCells.push({
                                                                val: cell[heatmapMetric],
                                                                day: days[dIdx],
                                                                hour: `${hIdx * 2}h`
                                                            });
                                                        }
                                                    });
                                                });

                                                if (allCells.length === 0) return null;

                                                const best = allCells.reduce((prev, curr) => curr.val > prev.val ? curr : prev, allCells[0]);
                                                const worst = allCells.reduce((prev, curr) => curr.val < prev.val ? curr : prev, allCells[0]);

                                                return (
                                                    <div className="hidden lg:flex items-center gap-3 ml-4 pl-4 border-l border-[var(--shell-border)]/50">
                                                        {/* Best Time Card */}
                                                        <div className="flex items-center gap-3 bg-blue-500/5 hover:bg-blue-500/10 transition-colors border border-blue-500/10 rounded-xl px-4 py-2 group cursor-default shadow-sm">
                                                            <div className="bg-blue-500 p-1.5 rounded-lg shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                                                                <ArrowTrendingUpIcon className="w-4 h-4 text-white" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] font-bold text-blue-400/80 uppercase tracking-widest leading-none mb-1">Melhor Horário</span>
                                                                <span className="text-sm font-black text-[var(--foreground)] tracking-tight leading-none">
                                                                    {best.hour} <span className="text-zinc-500 font-medium text-[10px] mx-0.5">•</span> {best.day}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Worst Time Card */}
                                                        <div className="flex items-center gap-3 bg-red-500/5 hover:bg-red-500/10 transition-colors border border-red-500/10 rounded-xl px-4 py-2 group cursor-default shadow-sm">
                                                            <div className="bg-red-500 p-1.5 rounded-lg shadow-lg shadow-red-500/20 group-hover:scale-110 transition-transform">
                                                                <ArrowTrendingDownIcon className="w-4 h-4 text-white" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] font-bold text-red-500/80 uppercase tracking-widest leading-none mb-1">Menor Volume</span>
                                                                <span className="text-sm font-black text-[var(--foreground)] tracking-tight leading-none">
                                                                    {worst.hour} <span className="text-zinc-500 font-medium text-[10px] mx-0.5">•</span> {worst.day}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    <div className="bg-[var(--shell-surface)] rounded-2xl p-6 border border-[var(--shell-border)] overflow-x-auto">
                                        <div className="min-w-[500px]">
                                            <div className="flex gap-4">
                                                {/* Y-Axis Labels (Hours) */}
                                                <div className="flex flex-col justify-between py-2 text-[9px] font-mono text-zinc-500 text-right pr-2">
                                                    {Array.from({ length: 12 }).map((_, i) => (
                                                        <div key={i} className="h-6 flex items-center justify-end">{i * 2}h</div>
                                                    ))}
                                                </div>

                                                {/* Day Columns */}
                                                {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((fullDayName, dayIdx) => {
                                                    const dayAbbr = fullDayName.charAt(0);
                                                    const dayData = heatmapData[dayIdx];

                                                    // Calculate min/max for normalization
                                                    const allValues = heatmapData
                                                        .flat()
                                                        .map((cell: { reach: number; interactions: number }) => cell[heatmapMetric]);
                                                    const max = Math.max(...allValues) || 1;
                                                    const min = Math.min(...allValues);

                                                    return (
                                                        <div key={dayIdx} className="flex-1 flex flex-col gap-1 min-w-[40px]">
                                                            {/* Hour Cells Stack */}
                                                            {dayData.map((cell: { reach: number; interactions: number }, hourIdx: number) => {
                                                                const val = cell[heatmapMetric];

                                                                // 1-10 Scale Calculation
                                                                // We enforce a minimum score of 1 to ensure all cells are "painted"
                                                                let score = 1;
                                                                if (val > 0) {
                                                                    const normalized = (val - min) / (max - min || 1);
                                                                    // Map 0..1 to 1..10
                                                                    score = Math.floor(normalized * 9) + 1;
                                                                }

                                                                // Color mapping based on score 1-10 - MONOCHROMATIC BLUE GRADIENT
                                                                // Weaker (1) -> Stronger (10)
                                                                let bgClass = "";
                                                                if (score === 1) bgClass = "bg-sky-200 border-sky-300";           // Lightest/White-ish Blue
                                                                else if (score === 2) bgClass = "bg-sky-300 border-sky-400";
                                                                else if (score === 3) bgClass = "bg-sky-400 border-sky-500";
                                                                else if (score === 4) bgClass = "bg-blue-400 border-blue-500";
                                                                else if (score === 5) bgClass = "bg-blue-500 border-blue-600";
                                                                else if (score === 6) bgClass = "bg-blue-600 border-blue-700";
                                                                else if (score === 7) bgClass = "bg-blue-700 border-blue-800";
                                                                else if (score === 8) bgClass = "bg-blue-800 border-blue-900";
                                                                else if (score === 9) bgClass = "bg-blue-900 border-blue-950";
                                                                else if (score === 10) bgClass = "bg-blue-950 border-black shadow-[0_0_12px_rgba(30,58,138,0.5)]"; // Deepest Blue

                                                                return (
                                                                    <div
                                                                        key={hourIdx}
                                                                        className={`h-6 rounded hover:scale-105 transition-all relative group cursor-pointer border ${val === 0 ? 'border-transparent' : ''} ${bgClass}`}
                                                                    >
                                                                        {/* Enhanced Tooltip - Show for ALL cells now */}
                                                                        {true && (
                                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-[999] pointer-events-none w-max">
                                                                                <div className="bg-zinc-900/95 backdrop-blur-md text-white text-[10px] rounded-xl p-3 shadow-2xl border border-zinc-700/50 text-center min-w-[120px]">
                                                                                    <p className="font-bold text-xs mb-1 text-zinc-300 border-b border-zinc-800 pb-1">{fullDayName}, {hourIdx * 2}h</p>
                                                                                    <div className="flex items-center justify-between gap-4 mt-2">
                                                                                        <span className="text-zinc-500 uppercase tracking-widest text-[9px] font-bold">Score</span>
                                                                                        <div className="flex gap-0.5">
                                                                                            {/* Mini Score Bar */}
                                                                                            {Array.from({ length: 10 }).map((_, i) => (
                                                                                                <div key={i} className={`w-1 h-3 rounded-[1px] ${i < score ? (i > 7 ? 'bg-blue-500' : 'bg-emerald-500') : 'bg-zinc-800'}`}></div>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="flex items-center justify-between gap-4 mt-1">
                                                                                        <span className="text-zinc-500 uppercase tracking-widest text-[9px] font-bold">Vol</span>
                                                                                        <span className="font-mono font-bold text-white">{formatNumber(val)}</span>
                                                                                    </div>
                                                                                </div>
                                                                                {/* Arrow */}
                                                                                <div className="w-3 h-3 bg-zinc-900 border-r border-b border-zinc-700/50 rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1.5 backdrop-blur-md"></div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}

                                                            {/* Day Label (Bottom) */}
                                                            <div className="text-center mt-2 text-[10px] font-bold text-zinc-500">{dayAbbr}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Legend 1-10 Scale */}
                                            <div className="flex items-center justify-between mt-6 text-[9px] text-zinc-500 font-medium font-mono uppercase tracking-wider bg-zinc-900/30 rounded-full p-2 border border-zinc-800/50">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-sky-200 w-3 h-3 rounded block border border-sky-300"></span>
                                                    <span>1 (Menor)</span>
                                                </div>

                                                {/* Gradient Bar Representation */}
                                                <div className="flex-1 mx-4 h-1.5 rounded-full bg-gradient-to-r from-sky-200 via-blue-500 to-blue-950 relative"></div>

                                                <div className="flex items-center gap-2">
                                                    <span>10 (Maior)</span>
                                                    <span className="bg-blue-950 w-3 h-3 rounded block shadow-[0_0_5px_rgba(30,58,138,0.5)]"></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )
            }

            {/* TAB CONTENT: REELS/STORIES */}
            {activeTab === "reels_stories" && isInstagram && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
                    {(() => {
                        const basePosts = [...data.top_posts]
                            .sort((a, b) => b.timestamp - a.timestamp)
                            .slice(0, 6);
                        const sequenceSource = basePosts.length
                            ? basePosts
                            : Array.from({ length: 6 }).map((_, index) => ({
                                id: `fallback-story-${index + 1}`,
                                image: "https://placehold.co/120x120/0f172a/e2e8f0?text=ST",
                                timestamp: Date.now() - (index * 3600 * 1000),
                                video_views: 12000 - index * 900,
                                reach: 12000 - index * 900,
                                shares: 240 - index * 20,
                                comments: 180 - index * 14,
                                reactions: 480 - index * 30,
                                link_clicks: 80 - index * 8,
                            }));

                        const storyAgeBands = ["18-24", "25-34", "35-44", "45-54"];
                        const sequence = sequenceSource.map((post, index) => {
                            const reach = Math.max(1200, Math.round((post.video_views || post.reach) * (0.66 - index * 0.05)));
                            const retention = clamp(95 - index * 12 + ((post.shares ?? 0) % 6), 28, 98);
                            const backTaps = Math.max(15, Math.round((post.comments ?? 0) * 0.8 + (post.shares ?? 0) * 0.4 + index * 16));
                            const nextTaps = Math.max(40, Math.round((post.reactions ?? 0) * 0.7 + (post.shares ?? 0) * 0.9 + index * 42));
                            const exits = Math.max(18, Math.round(((100 - retention) * reach) / 1400));
                            const replies = Math.max(8, Math.round((post.comments ?? 0) * 1.15 + (post.link_clicks ?? 0) * 0.6));
                            const linkClicks = Math.max(0, Math.round((post.link_clicks ?? 0) * 0.8 - index * 4));
                            const seed = post.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) + index * 17;
                            const type = index % 3 === 0 ? "Vídeo" : index % 3 === 1 ? "Estático" : "Repost";
                            const interactionLabel = index % 3 === 0
                                ? `Enquete (${formatNumber(Math.max(12, (post.comments ?? 0) + (post.shares ?? 0)))})`
                                : index % 3 === 1
                                    ? `Caixinha (${formatNumber(Math.max(8, post.comments ?? 0))})`
                                    : `Reações (${formatNumber(Math.max(10, post.reactions ?? 0))})`;
                            const dominantAgeRange = storyAgeBands[seed % storyAgeBands.length];
                            const dominantAgeShare = clamp(33 + (seed % 25), 30, 68);
                            const dominantGender = seed % 2 === 0 ? "Mulheres" : "Homens";
                            const dominantGenderShare = clamp(52 + (seed % 19), 50, 78);

                            return {
                                id: post.id,
                                image: post.image,
                                timestamp: post.timestamp,
                                time: new Date(post.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
                                label: `Story ${index + 1}`,
                                type,
                                reach,
                                retention,
                                backTaps,
                                nextTaps,
                                exits,
                                replies,
                                interactionLabel,
                                linkClicks,
                                dominantAgeRange,
                                dominantAgeShare,
                                dominantGender,
                                dominantGenderShare,
                            };
                        });

                        const totalBack = sequence.reduce((acc, item) => acc + item.backTaps, 0);
                        const totalForward = sequence.reduce((acc, item) => acc + item.nextTaps, 0);
                        const totalExits = sequence.reduce((acc, item) => acc + item.exits, 0);
                        const totalReplies = sequence.reduce((acc, item) => acc + item.replies, 0);

                        let rejectionIndex = 0;
                        let maxDrop = -Infinity;
                        for (let i = 1; i < sequence.length; i += 1) {
                            const drop = sequence[i - 1].reach - sequence[i].reach;
                            if (drop > maxDrop) {
                                maxDrop = drop;
                                rejectionIndex = i;
                            }
                        }

                        const bestWindow = sequence.length >= 2
                            ? `${sequence[0].time} - ${sequence[1].time}`
                            : sequence[0]?.time ?? "--:--";
                        const repliesPerK = Math.round((totalReplies / Math.max(1, sequence.reduce((acc, item) => acc + item.reach, 0))) * 1000);

                        return (
                            <div className="space-y-4">
                                <InstagramReelsMiniAnalysis posts={data.top_posts} storiesRows={sequence} totalFollowers={data.page_followers.value} />

                                <div className="bg-[var(--shell-surface)] border border-cyan-500/25 rounded-3xl overflow-hidden shadow-[0_0_35px_rgba(6,182,212,0.14)]">
                                    <div className="px-5 py-3 border-b border-cyan-500/20 bg-[var(--shell-side)]">
                                        <h3 className="text-sm font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-300">
                                            Protocolo AIMC-Bianconi 2026 - Monitor de Lealdade (Stories Analytics)
                                        </h3>
                                    </div>
                                    <div className="p-4 md:p-5 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                                            <div className="h-[132px] rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-4 flex flex-col justify-between">
                                                <div className="text-[10px] uppercase tracking-[0.14em] font-black text-emerald-300">◀ Toques para Voltar (Interesse)</div>
                                                <div className="text-5xl leading-none font-black tracking-tight text-emerald-300">{formatNumber(totalBack)}</div>
                                                <div className="text-[11px] text-emerald-200/80">Alta relevância</div>
                                            </div>
                                            <div className="h-[132px] rounded-2xl border border-amber-500/35 bg-amber-500/10 p-4 flex flex-col justify-between">
                                                <div className="text-[10px] uppercase tracking-[0.14em] font-black text-amber-300">▶ Toques para Avançar (Tédio)</div>
                                                <div className="text-5xl leading-none font-black tracking-tight text-amber-300">{formatNumber(totalForward)}</div>
                                                <div className="text-[11px] text-amber-200/80">Alerta amarelo (melhorar ritmo)</div>
                                            </div>
                                            <div className="h-[132px] rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 flex flex-col justify-between">
                                                <div className="text-[10px] uppercase tracking-[0.14em] font-black text-rose-300">⛔ Saídas (Rejeição)</div>
                                                <div className="text-5xl leading-none font-black tracking-tight text-rose-300">{formatNumber(totalExits)}</div>
                                                <div className="text-[11px] text-rose-200/80">Alerta vermelho (tóxico)</div>
                                            </div>
                                            <div className="h-[132px] rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-4 flex flex-col justify-between">
                                                <div className="text-[10px] uppercase tracking-[0.14em] font-black text-emerald-300">💬 Respostas & Reações (Conversão)</div>
                                                <div className="text-5xl leading-none font-black tracking-tight text-emerald-300">{formatNumber(totalReplies)}</div>
                                                <div className="text-[11px] text-emerald-200/80">Sucesso</div>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-[var(--shell-border)] overflow-hidden">
                                            <div className="px-4 py-3 border-b border-[var(--shell-border)] bg-[var(--shell-side)]">
                                                <h4 className="text-[10px] uppercase tracking-widest font-black text-zinc-500 dark:text-zinc-400">Tabela de Detalhamento (Frame a Frame)</h4>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full min-w-[1220px] text-sm">
                                                    <thead>
                                                        <tr className="border-b border-[var(--shell-border)] text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                                            <th className="py-2.5 px-3 text-left">Frame</th>
                                                            <th className="py-2.5 px-3 text-left">Tipo</th>
                                                            <th className="py-2.5 px-3 text-right">Faixa etária pred.</th>
                                                            <th className="py-2.5 px-3 text-right">Gênero maioria</th>
                                                            <th className="py-2.5 px-3 text-right">Alcance</th>
                                                            <th className="py-2.5 px-3 text-right">Retenção</th>
                                                            <th className="py-2.5 px-3 text-right">Interação</th>
                                                            <th className="py-2.5 px-3 text-right">Navegação</th>
                                                            <th className="py-2.5 px-3 text-right">Link</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[var(--shell-border)]">
                                                        {sequence.map((item) => (
                                                            <tr key={item.id} className="hover:bg-[var(--shell-side)] transition-colors">
                                                                <td className="py-2.5 px-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-9 h-9 rounded-md overflow-hidden border border-[var(--shell-border)] bg-zinc-800 shrink-0">
                                                                            <img src={item.image} alt={item.label} className="w-full h-full object-cover" />
                                                                        </div>
                                                                        <div>
                                                                            <div className="font-black text-[var(--foreground)]">{item.time}</div>
                                                                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{item.label}</div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400">{item.type}</td>
                                                                <td className="py-2.5 px-3 text-right">
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded border border-violet-500/30 bg-violet-500/15 text-xs font-black text-violet-700 dark:text-violet-300">
                                                                        {item.dominantAgeRange}
                                                                    </span>
                                                                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">{item.dominantAgeShare}%</div>
                                                                </td>
                                                                <td className="py-2.5 px-3 text-right">
                                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-black ${item.dominantGender === "Mulheres"
                                                                        ? "border-fuchsia-500/30 bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300"
                                                                        : "border-sky-500/30 bg-sky-500/15 text-sky-700 dark:text-sky-300"
                                                                        }`}>
                                                                        {item.dominantGender}
                                                                    </span>
                                                                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">{item.dominantGenderShare}%</div>
                                                                </td>
                                                                <td className="py-2.5 px-3 text-right font-black text-[var(--foreground)]">{formatNumber(item.reach)}</td>
                                                                <td className="py-2.5 px-3 text-right">
                                                                    <div className="flex items-center justify-end gap-2">
                                                                        <div className="w-24 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                                                                            <div className={`h-full ${item.retention >= 80 ? "bg-emerald-400" : item.retention >= 60 ? "bg-amber-400" : "bg-rose-500"}`} style={{ width: `${item.retention}%` }} />
                                                                        </div>
                                                                        <span className={`font-black text-xs ${item.retention >= 80 ? "text-emerald-400" : item.retention >= 60 ? "text-amber-400" : "text-rose-400"}`}>{item.retention}%</span>
                                                                    </div>
                                                                </td>
                                                                <td className="py-2.5 px-3 text-right text-zinc-700 dark:text-zinc-300">{item.interactionLabel}</td>
                                                                <td className="py-2.5 px-3 text-right">
                                                                    <div className="flex items-center justify-end gap-2">
                                                                        <div className="w-24 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex">
                                                                            <div className="h-full bg-emerald-400" style={{ width: `${Math.min(100, (item.backTaps / Math.max(1, item.backTaps + item.exits)) * 100)}%` }} />
                                                                            <div className="h-full bg-rose-500" style={{ width: `${Math.min(100, (item.exits / Math.max(1, item.backTaps + item.exits)) * 100)}%` }} />
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="py-2.5 px-3 text-right font-black text-zinc-700 dark:text-zinc-300">{item.linkClicks > 0 ? formatNumber(item.linkClicks) : "-"}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                                            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3">
                                                <div className="text-[11px] font-black text-cyan-700 dark:text-cyan-300 uppercase tracking-widest">A. Melhor Horário de Retenção</div>
                                                <div className="text-sm font-bold text-cyan-900 dark:text-cyan-100 mt-1">{bestWindow} (&lt;2% rejeição)</div>
                                            </div>
                                            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                                                <div className="text-[11px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-widest">B. Cemitério de Sequências</div>
                                                <div className="text-sm font-bold text-amber-900 dark:text-amber-100 mt-1">Aviso: {sequence[rejectionIndex]?.type ?? "Frame"} com pico de saída na sequência.</div>
                                            </div>
                                            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                                                <div className="text-[11px] font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-widest">C. Termômetro de Comunidade</div>
                                                <div className="text-sm font-bold text-emerald-900 dark:text-emerald-100 mt-1">{totalReplies} replies / {Math.max(1, repliesPerK)}k views (Comunidade forte)</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* TAB CONTENT: PÚBLICO */}
            {
                activeTab === "publico" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">

                        {isInstagram && data.demographics && (
                            <div className="flex items-center justify-end">
                                <div className="inline-flex rounded-xl border border-[var(--shell-border)] bg-[var(--shell-side)] p-1">
                                    <button
                                        onClick={() => setAudienceViewMode("base_total")}
                                        className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${audienceViewMode === "base_total" ? "bg-blue-500 text-white shadow-sm" : "text-zinc-500 hover:text-[var(--foreground)]"}`}
                                    >
                                        Base Total
                                    </button>
                                    <button
                                        onClick={() => setAudienceViewMode("base_engajada")}
                                        className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${audienceViewMode === "base_engajada" ? "bg-blue-500 text-white shadow-sm" : "text-zinc-500 hover:text-[var(--foreground)]"}`}
                                    >
                                        Base Engajada
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 1. TOP METRICS CARDS */}
                        {data.demographics && (
                            isInstagram ? (
                                <div className="overflow-x-auto">
                                    <div className="grid grid-cols-8 gap-3 min-w-[1760px]">
                                        <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-3xl p-5 min-h-[120px] flex flex-col justify-between hover:border-blue-500/20 transition-all group">
                                            <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-4">Novos Seguidores</h3>
                                            <div>
                                                <div className="text-4xl xl:text-5xl font-black text-emerald-400 tracking-tighter leading-none mb-3">+{formatNumber(periodFollowers.newFollowers)}</div>
                                                <div className={`text-[10px] font-bold uppercase tracking-wide ${periodFollowers.growthPct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                                    {periodFollowers.growthPct >= 0 ? "+" : ""}{periodFollowers.growthPct.toFixed(1)}% no período
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-3xl p-5 min-h-[120px] flex flex-col justify-between hover:border-blue-500/20 transition-all group">
                                            <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-4">Total de Seguidores</h3>
                                            <div>
                                                <div className="text-4xl xl:text-5xl font-black text-white tracking-tighter leading-none mb-3">{formatNumber(data.page_followers.value)}</div>
                                                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">Base ativa da conta</div>
                                            </div>
                                        </div>
                                        <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-3xl p-5 min-h-[120px] flex flex-col justify-between hover:border-blue-500/20 transition-all group">
                                            <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-4">Botômetro</h3>
                                            {instagramAudienceModel ? (
                                                <div className="space-y-2 w-full">
                                                    <div className="flex items-center justify-between text-[10px] font-bold">
                                                        <span className="text-emerald-300 uppercase tracking-wide">Valiosos</span>
                                                        <span className="text-white">{instagramAudienceModel.botometer.valuablePct}%</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-[10px] font-bold">
                                                        <span className="text-amber-300 uppercase tracking-wide">Fantasmas</span>
                                                        <span className="text-white">{instagramAudienceModel.botometer.ghostPct}%</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-[10px] font-bold">
                                                        <span className="text-rose-300 uppercase tracking-wide">Bots</span>
                                                        <span className="text-white">{instagramAudienceModel.botometer.botPct}%</span>
                                                    </div>
                                                    <div className="h-1.5 rounded-full overflow-hidden bg-[var(--shell-border)] flex mt-2 w-full">
                                                        <div className="h-full bg-emerald-500" style={{ width: `${instagramAudienceModel.botometer.valuablePct}%` }} />
                                                        <div className="h-full bg-amber-400" style={{ width: `${instagramAudienceModel.botometer.ghostPct}%` }} />
                                                        <div className="h-full bg-rose-500" style={{ width: `${instagramAudienceModel.botometer.botPct}%` }} />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-[10px] text-zinc-500 font-bold uppercase">Sem dados suficientes</div>
                                            )}
                                        </div>
                                        <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-3xl p-5 min-h-[120px] flex flex-col justify-between hover:border-blue-500/20 transition-all group">
                                            <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-4">Cluster Principal</h3>
                                            {(() => {
                                                const badge = getGenderBadge(data.demographics.top_audience);
                                                const cluster = data.demographics.top_audience ?? "";
                                                const ageMatch = cluster.match(/\b\d{2}\s*-\s*\d{2}\b|\b\d{2}\+\b/);
                                                const ageRange = (ageMatch?.[0] ?? audienceTotalsForView.topAge?.range ?? data.demographics.top_age_group).replace(/\s/g, "");
                                                return (
                                                    <div className="flex items-center gap-4">
                                                        <span className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl border text-2xl font-black leading-none shrink-0 ${badge.className}`}>
                                                            {badge.symbol}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <div className="text-3xl font-black text-white tracking-tight leading-none truncate">{badge.label}</div>
                                                            <div className="text-sm font-bold text-zinc-500 mt-1">{ageRange}</div>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                        <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-3xl p-5 min-h-[120px] flex flex-col justify-between hover:border-blue-500/20 transition-all group">
                                            <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-4">
                                                {audienceViewMode === "base_engajada" ? "Faixa Etária (Engajada)" : "Faixa Etária Principal"}
                                            </h3>
                                            <div>
                                                <div className="text-5xl font-black text-white tracking-tighter leading-none mb-3">
                                                    {audienceTotalsForView.topAge?.range ?? data.demographics.top_age_group}
                                                </div>
                                                {audienceTotalsForView.topAge && (
                                                    <div className="text-[10px] text-blue-400 font-bold uppercase tracking-wide">
                                                        {AGE_ECONOMIC_TAGS[audienceTotalsForView.topAge.range] ?? "Cluster"}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-3xl p-5 min-h-[120px] flex flex-col hover:border-blue-500/20 transition-all group">
                                            <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-4">Cidade Principal</h3>
                                            <div className="flex-1 flex items-center">
                                                <div className="text-3xl xl:text-4xl font-black text-white tracking-tighter break-words leading-none">
                                                    {formatCityWithState(data.demographics.top_city, data.demographics.cities_data)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-3xl p-5 min-h-[120px] flex flex-col hover:border-blue-500/20 transition-all group">
                                            <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-4">País Principal</h3>
                                            <div className="flex-1 flex items-center gap-4">
                                                <div className="text-6xl leading-none shrink-0 filter drop-shadow-lg">
                                                    {getCountryFlagEmoji(data.demographics.top_country)}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-xl xl:text-3xl font-black text-white tracking-tight leading-none break-words">{data.demographics.top_country}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-3xl p-5 min-h-[120px] flex flex-col justify-between hover:border-blue-500/20 transition-all group">
                                            <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-4">Idioma Principal</h3>
                                            <div>
                                                <div className="text-4xl xl:text-5xl font-black text-white tracking-tighter leading-none mb-3">PT-BR</div>
                                                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">Português (BR)</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                                    <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-3xl p-5 flex flex-col hover:border-blue-500/20 transition-all group min-h-[120px]">
                                        <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-4">País Principal</h3>
                                        <div className="flex-1 flex flex-col justify-center">
                                            <div className="text-3xl xl:text-4xl font-black text-white tracking-tighter break-words leading-none mb-3">{data.demographics.top_country}</div>
                                            <div className="w-5 h-1.5 bg-emerald-500 rounded-full"></div>
                                        </div>
                                    </div>
                                    <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-3xl p-5 flex flex-col hover:border-blue-500/20 transition-all group min-h-[120px]">
                                        <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-4">Cidade Principal</h3>
                                        <div className="flex-1 flex flex-col justify-center">
                                            <div className="text-3xl xl:text-4xl font-black text-white tracking-tighter break-words leading-none mb-3">{data.demographics.top_city}</div>
                                            <div className="w-5 h-1.5 bg-emerald-500 rounded-full"></div>
                                        </div>
                                    </div>
                                    <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-3xl p-5 flex flex-col justify-between hover:border-blue-500/20 transition-all group min-h-[120px]">
                                        <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-4">Idioma Principal</h3>
                                        <div>
                                            <div className="text-3xl xl:text-4xl font-black text-white tracking-tighter break-words leading-none mb-2">PT-BR</div>
                                            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide mb-3">Português (BR)</div>
                                            <div className="w-5 h-1.5 bg-emerald-500 rounded-full"></div>
                                        </div>
                                    </div>
                                    <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-3xl p-5 flex flex-col justify-between hover:border-blue-500/20 transition-all group min-h-[120px]">
                                        <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-4">Público Principal</h3>
                                        <div>
                                            <div className="text-3xl xl:text-4xl font-black text-white tracking-tighter break-words leading-none mb-3">{data.demographics.top_audience}</div>
                                            <div className="w-5 h-1.5 bg-emerald-500 rounded-full"></div>
                                        </div>
                                    </div>
                                    <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-3xl p-5 flex flex-col justify-between hover:border-blue-500/20 transition-all group min-h-[120px] col-span-2 lg:col-span-1">
                                        <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-4">Faixa Etária Principal</h3>
                                        <div>
                                            <div className="text-5xl font-black text-white tracking-tighter leading-none mb-3">{data.demographics.top_age_group}</div>
                                            <div className="w-5 h-1.5 bg-emerald-500 rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                            )
                        )}

                        {/* 2. AUDIENCE INTELLIGENCE */}
                        <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-3xl p-6 relative">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                                <div>
                                    <h3 className="text-4xl font-black text-white tracking-tighter leading-none mb-2">
                                        Faixa Etária & Gênero
                                    </h3>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                                        {isInstagram ? "Leitura de volume vs valor para priorizar quem realmente converte." : "Resumo da distribuição demográfica da base."}
                                    </p>
                                </div>
                            </div>

                            {data.demographics && (() => {
                                const topAge = audienceTotalsForView.topAge;
                                const topAgePercentage = audienceTotalsForView.topAgePercentage;
                                const totalMale = audienceTotalsForView.totalMale;
                                const totalFemale = audienceTotalsForView.totalFemale;
                                const sortedByAge = audienceTotalsForView.sortedByAge;
                                const palette = ["#3b82f6", "#06b6d4", "#14b8a6", "#10b981", "#84cc16", "#eab308", "#f97316"];

                                return (
                                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-stretch">
                                        <div className="flex flex-col p-4 rounded-2xl bg-[var(--shell-side)] border border-[var(--shell-border)] relative overflow-hidden min-h-[220px] lg:min-h-[330px]">
                                            <h4 className="text-[10px] font-bold uppercase text-zinc-500 mb-2 tracking-widest z-10 w-full text-center lg:text-left">
                                                {isInstagram && audienceViewMode === "base_engajada" ? "Faixa Etária Engajada" : "Total por Faixa Etária"}
                                            </h4>
                                            <div className="w-full text-left mb-2 z-10 relative">
                                                <div className="text-xl font-black text-[var(--foreground)]">
                                                    {topAge?.range ?? "—"} anos
                                                </div>
                                                <div className="text-[10px] text-zinc-500 mt-1">
                                                    são a maioria, representando <strong className="text-[var(--foreground)]">{topAgePercentage}%</strong> da leitura atual.
                                                </div>
                                                {topAge && isInstagram && (
                                                    <div className="absolute top-0 right-0 text-[10px] text-blue-300 font-bold uppercase tracking-wide text-right">
                                                        {AGE_ECONOMIC_TAGS[topAge.range] ?? "Cluster"}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Centered Chart */}
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                                                <div className="relative w-40 h-40 shrink-0 pointer-events-auto">
                                                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                                        {(() => {
                                                            const radius = 40;
                                                            const circumference = 2 * Math.PI * radius;
                                                            let cumulativePercent = 0;
                                                            return sortedByAge.map((item, index) => {
                                                                const strokeDasharray = `${(item.total / 100) * circumference} ${circumference}`;
                                                                const rotateAngle = (cumulativePercent / 100) * 360;
                                                                cumulativePercent += item.total;
                                                                return (
                                                                    <circle
                                                                        key={item.range}
                                                                        cx="50"
                                                                        cy="50"
                                                                        r={radius}
                                                                        fill="none"
                                                                        stroke={palette[index % palette.length]}
                                                                        strokeWidth="20"
                                                                        strokeDasharray={strokeDasharray}
                                                                        transform={`rotate(${rotateAngle} 50 50)`}
                                                                    />
                                                                );
                                                            });
                                                        })()}
                                                    </svg>
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                        <span className="text-3xl font-black text-[var(--foreground)] tracking-tighter leading-none">
                                                            {topAgePercentage}%
                                                        </span>
                                                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mt-1">
                                                            {topAge?.range ?? "—"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Legend on the right */}
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-[110px] space-y-1 z-10">
                                                {sortedByAge.map((item, index) => {
                                                    const isDecisor = instagramAudienceModel?.decisorRange === item.range;
                                                    const isInfluencer = instagramAudienceModel?.influencerRange === item.range && !isDecisor;
                                                    return (
                                                        <div
                                                            key={item.range}
                                                            className={`flex items-center justify-between gap-2 text-[9px] px-1.5 py-0.5 rounded transition-colors ${isDecisor
                                                                ? "bg-emerald-500/10 border border-emerald-500/25"
                                                                : isInfluencer
                                                                    ? "bg-blue-500/10 border border-blue-500/25"
                                                                    : "hover:bg-[var(--shell-surface)]"
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: palette[index % palette.length] }} />
                                                                <div className="font-medium truncate text-zinc-500">{item.range}</div>
                                                            </div>
                                                            <span className="font-mono font-black text-zinc-600">
                                                                {Math.round(item.total)}%
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="lg:col-span-2 flex flex-col p-4 rounded-2xl bg-[var(--shell-side)] border border-[var(--shell-border)] min-h-[220px] lg:min-h-[330px]">
                                            <h4 className="text-[10px] font-black uppercase text-white mb-4 tracking-widest z-10 w-full text-left">
                                                Distribuição Demográfica (Idade & Gênero)
                                            </h4>
                                            <PopulationPyramid
                                                data={sortedByAge.map((item) => ({
                                                    range: item.range,
                                                    male: Number(item.male.toFixed(1)),
                                                    female: Number(item.female.toFixed(1)),
                                                }))}
                                                influencerRange={isInstagram ? instagramAudienceModel?.influencerRange : undefined}
                                                decisorRange={isInstagram ? instagramAudienceModel?.decisorRange : undefined}
                                            />
                                        </div>

                                        <div className="flex flex-col p-4 rounded-2xl bg-[var(--shell-side)] border border-[var(--shell-border)] relative overflow-hidden min-h-[220px] lg:min-h-[330px]">
                                            <div className="w-full text-left">
                                                <h4 className="text-[10px] font-bold uppercase text-zinc-500 mb-1 tracking-widest">
                                                    {isInstagram && audienceViewMode === "base_engajada" ? "Gênero da Base Engajada" : "Resumo de Gênero"}
                                                </h4>
                                                <div className="text-xl font-black text-[var(--foreground)]">
                                                    {totalFemale > totalMale ? "Mulheres" : "Homens"}
                                                </div>
                                                <div className="text-[10px] text-zinc-500 mt-1">
                                                    são a maioria, representando <strong className="text-[var(--foreground)]">{Math.max(totalFemale, totalMale)}%</strong> da leitura atual.
                                                </div>
                                            </div>

                                            {/* Centered Chart */}
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                                                <div className="relative w-40 h-40 shrink-0 pointer-events-auto flex items-center justify-center">
                                                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                                        <circle cx="50" cy="50" r="40" fill="none" stroke="var(--shell-surface)" strokeWidth="20" />
                                                        <circle
                                                            cx="50"
                                                            cy="50"
                                                            r="40"
                                                            fill="none"
                                                            stroke="#fb923c"
                                                            strokeWidth="20"
                                                            strokeDasharray={`${(totalFemale / 100) * 251.2} 251.2`}
                                                            strokeLinecap="round"
                                                            className="transition-all duration-700"
                                                        />
                                                        <circle
                                                            cx="50"
                                                            cy="50"
                                                            r="40"
                                                            fill="none"
                                                            stroke="#0ea5e9"
                                                            strokeWidth="20"
                                                            strokeDasharray={`${(totalMale / 100) * 251.2} 251.2`}
                                                            strokeDashoffset={-((totalFemale / 100) * 251.2)}
                                                            strokeLinecap="round"
                                                            className="transition-all duration-700"
                                                        />
                                                    </svg>
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                        <span className="text-3xl font-black text-[var(--foreground)] tracking-tighter leading-none">
                                                            {Math.max(totalFemale, totalMale)}%
                                                        </span>
                                                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mt-1">
                                                            {totalFemale > totalMale ? "Mulheres" : "Homens"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="w-full space-y-2 mt-auto z-10">
                                                <div className="flex justify-between items-center text-[10px] font-bold">
                                                    <span className="flex items-center gap-1.5 text-zinc-500 uppercase tracking-wide">
                                                        <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                                                        Mulheres
                                                    </span>
                                                    <span className="text-[var(--foreground)]">{totalFemale}%</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px] font-bold">
                                                    <span className="flex items-center gap-1.5 text-zinc-500 uppercase tracking-wide">
                                                        <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                                                        Homens
                                                    </span>
                                                    <span className="text-[var(--foreground)]">{totalMale}%</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-[var(--shell-surface)] rounded-full overflow-hidden flex mt-2">
                                                    <div className="h-full bg-orange-400" style={{ width: `${totalFemale}%` }} />
                                                    <div className="h-full bg-sky-500" style={{ width: `${totalMale}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* 3. GEOGRAPHY & HEATMAP */}
                        {data.demographics && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-fr">
                                {/* 1. City Table (Top Left) */}
                                <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-3xl overflow-hidden flex flex-col h-full">
                                    <div className="p-6 border-b border-[var(--shell-border)] bg-[var(--shell-side)] flex justify-between items-start">
                                        <div>
                                            <h3 className="text-4xl font-black text-white tracking-tighter leading-none mb-2">{isInstagram ? "Audiência por Geografia - Cidade" : "Fãs por Geografia - Cidade"}</h3>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">{isInstagram ? "Cidades com maior concentração de audiência ativa." : "Cidades onde seus fãs vivem"}</p>
                                        </div>
                                        <select
                                            value={selectedStateFilter}
                                            onChange={(e) => {
                                                setSelectedStateFilter(e.target.value);
                                                setCityPage(1);
                                            }}
                                            className="bg-[var(--shell-surface)] text-[10px] font-bold text-zinc-500 border border-[var(--shell-border)] rounded-lg px-2 py-1 outline-none focus:border-blue-500 transition-colors"
                                        >
                                            <option value="todos">Todos os Estados</option>
                                            <option value="SP">São Paulo (SP)</option>
                                            <option value="RJ">Rio de Janeiro (RJ)</option>
                                            <option value="MG">Minas Gerais (MG)</option>
                                            <option value="BA">Bahia (BA)</option>
                                            <option value="DF">Distrito Federal (DF)</option>
                                            <option value="PR">Paraná (PR)</option>
                                            <option value="CE">Ceará (CE)</option>
                                            <option value="PE">Pernambuco (PE)</option>
                                            <option value="RS">Rio Grande do Sul (RS)</option>
                                            <option value="GO">Goiás (GO)</option>
                                            <option value="AM">Amazonas (AM)</option>
                                            <option value="PA">Pará (PA)</option>
                                            <option value="MA">Maranhão (MA)</option>
                                            <option value="AL">Alagoas (AL)</option>
                                        </select>
                                    </div>
                                    <div className="overflow-x-auto flex-1">
                                        <table className="w-full text-left text-xs whitespace-nowrap">
                                            <thead className="bg-[var(--shell-surface)] border-b border-[var(--shell-border)]">
                                                <tr className="text-zinc-500 font-bold uppercase tracking-wider">
                                                    <th className="px-6 py-3">Cidade</th>
                                                    <th className="px-6 py-3 text-right">{isInstagram ? "Contas Alcançadas" : "Curtidas da Pág."}</th>
                                                    <th className="px-6 py-3 text-right">{isInstagram ? "Variação" : "Cresc. Absoluto"}</th>
                                                    <th className="px-6 py-3 text-right">% do Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[var(--shell-border)]">
                                                {data.demographics.cities_data
                                                    .filter(city => selectedStateFilter === 'todos' || city.city.includes(selectedStateFilter))
                                                    .slice((cityPage - 1) * PAGE_SIZE, cityPage * PAGE_SIZE)
                                                    .map((item, idx) => (
                                                        <tr key={idx} className="hover:bg-[var(--shell-side)] transition-colors">
                                                            <td className="px-6 py-3 font-bold text-[var(--foreground)]">{item.city}</td>
                                                            <td className="px-6 py-3 text-right font-mono text-zinc-400">
                                                                {formatNumber(item.likes)}
                                                                <div className={`text-[9px] ${item.growth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                    {item.growth > 0 ? '+' : ''}{(item.growth / item.likes * 100).toFixed(1)}%
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-3 text-right font-mono">
                                                                <span className={item.growth >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                                                                    {item.growth > 0 ? '+' : ''}{item.growth}
                                                                </span>
                                                                <div className={`text-[9px] ${item.growth >= 0 ? 'text-emerald-500/70' : 'text-rose-500/70'} opacity-70`}>
                                                                    {item.growth > 0 ? '+' : ''}{(item.growth * 10).toFixed(1)}% est.
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-3 text-right font-mono font-bold text-[var(--foreground)]">
                                                                {item.percentage}%
                                                                <div className={`text-[9px] ${item.growth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                    {item.growth > 0 ? '+' : ''}0.2%
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <PaginationControl
                                        currentPage={cityPage}
                                        totalItems={data.demographics.cities_data.filter(city => selectedStateFilter === 'todos' || city.city.includes(selectedStateFilter)).length}
                                        pageSize={PAGE_SIZE}
                                        onPageChange={setCityPage}
                                    />
                                </div>

                                {/* 2. Age Table (Top Right) */}
                                <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-3xl overflow-hidden flex flex-col h-full">
                                    <div className="p-6 border-b border-[var(--shell-border)] bg-[var(--shell-side)] flex justify-between items-center">
                                        <div>
                                            <h3 className="text-4xl font-black text-white tracking-tighter leading-none mb-2">{isInstagram ? "Cidades por Faixa Etária" : "Cidades por Idade"}</h3>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">{isInstagram ? "Contas por faixa etária" : "Fãs por faixa etária"}</p>
                                        </div>
                                        <div className="flex items-center gap-2 bg-[var(--shell-surface)] rounded-lg p-1 border border-[var(--shell-border)]">
                                            <button
                                                onClick={() => {
                                                    setActiveAgeGroupIndex(prev => Math.max(0, prev - 1));
                                                    setCitiesAgePage(1);
                                                }}
                                                disabled={activeAgeGroupIndex === 0}
                                                className="p-1 hover:bg-[var(--shell-side)] rounded disabled:opacity-30 transition-colors"
                                            >
                                                <ChevronLeftIcon className="w-3 h-3 text-zinc-500" />
                                            </button>
                                            <span className="text-[10px] font-black min-w-[50px] text-center text-[var(--foreground)]">
                                                {data.demographics.cities_by_age && data.demographics.cities_by_age[activeAgeGroupIndex]?.age_group}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    setActiveAgeGroupIndex(prev => Math.min((data.demographics?.cities_by_age?.length || 1) - 1, prev + 1));
                                                    setCitiesAgePage(1);
                                                }}
                                                disabled={!data.demographics?.cities_by_age || activeAgeGroupIndex === data.demographics.cities_by_age.length - 1}
                                                className="p-1 hover:bg-[var(--shell-side)] rounded disabled:opacity-30 transition-colors"
                                            >
                                                <ChevronRightIcon className="w-3 h-3 text-zinc-500" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto flex-1">
                                        <table className="w-full text-left text-xs whitespace-nowrap">
                                            <thead className="bg-[var(--shell-surface)] border-b border-[var(--shell-border)]">
                                                <tr className="text-zinc-500 font-bold uppercase tracking-wider">
                                                    <th className="px-6 py-3">Cidade</th>
                                                    <th className="px-6 py-3 text-right">{isInstagram ? "Contas Alcançadas" : "Fãs"}</th>
                                                    <th className="px-6 py-3 text-right">{isInstagram ? "Variação" : "Cresc. Absoluto"}</th>
                                                    <th className="px-6 py-3 text-right">% do Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[var(--shell-border)]">
                                                {data.demographics.cities_by_age &&
                                                    (data.demographics.cities_by_age[activeAgeGroupIndex]?.cities || [])
                                                        .slice((citiesAgePage - 1) * PAGE_SIZE, citiesAgePage * PAGE_SIZE)
                                                        .map((city, idx) => (
                                                            <tr key={idx} className="hover:bg-[var(--shell-side)] transition-colors">
                                                                <td className="px-6 py-3 font-bold text-[var(--foreground)]">{city.city}</td>
                                                                <td className="px-6 py-3 text-right font-mono text-zinc-400">
                                                                    {formatNumber(city.fans)}
                                                                    <div className={`text-[9px] ${(city.growth || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                        {(city.growth || 0) > 0 ? '+' : ''}{((city.growth || 0) / (city.fans || 1) * 100).toFixed(1)}%
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-3 text-right font-mono">
                                                                    <span className={(city.growth || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                                                                        {(city.growth || 0) > 0 ? '+' : ''}{city.growth || 0}
                                                                    </span>
                                                                    <div className={`text-[9px] ${(city.growth || 0) >= 0 ? 'text-emerald-500/70' : 'text-rose-500/70'} opacity-70`}>
                                                                        {(city.growth || 0) > 0 ? '+' : ''}{((city.growth || 0) * 10).toFixed(1)}% est.
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-3 text-right font-mono font-bold text-[var(--foreground)]">
                                                                    {city.percentage ?? ((city.fans / (data.demographics?.cities_by_age?.[activeAgeGroupIndex]?.cities.reduce((acc, c) => acc + c.fans, 0) || 1)) * 100).toFixed(1)}%
                                                                    <div className={`text-[9px] ${(city.growth || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                        {(city.growth || 0) > 0 ? '+' : ''}0.2%
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))
                                                }
                                            </tbody>
                                        </table>
                                    </div>
                                    {data.demographics.cities_by_age && data.demographics.cities_by_age[activeAgeGroupIndex] && (
                                        <PaginationControl
                                            currentPage={citiesAgePage}
                                            totalItems={data.demographics.cities_by_age[activeAgeGroupIndex].cities.length}
                                            pageSize={PAGE_SIZE}
                                            onPageChange={setCitiesAgePage}
                                        />
                                    )}
                                </div>

                                {/* Heatmap (Right Column - Spans 2 Rows) */}
                                <BrazilFollowersMap spanTwoRows={false} />

                                {/* 3. Gender Table (Bottom Left) */}
                                <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-3xl overflow-hidden flex flex-col h-full">
                                    <div className="p-6 border-b border-[var(--shell-border)] bg-[var(--shell-side)] flex justify-between items-start">
                                        <div>
                                            <h3 className="text-4xl font-black text-white tracking-tighter leading-none mb-2">Cidades por Gênero</h3>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Classificado por %</p>
                                        </div>
                                        <div className="flex bg-[var(--shell-surface)] rounded-lg p-0.5 border border-[var(--shell-border)]">
                                            <button
                                                onClick={() => setGenderSort('female')}
                                                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${genderSort === 'female' ? 'bg-orange-400 text-white shadow-sm' : 'text-zinc-500 hover:text-[var(--foreground)]'}`}
                                            >
                                                Mulheres
                                            </button>
                                            <button
                                                onClick={() => setGenderSort('male')}
                                                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${genderSort === 'male' ? 'bg-sky-500 text-white shadow-sm' : 'text-zinc-500 hover:text-[var(--foreground)]'}`}
                                            >
                                                Homens
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        {[...data.demographics.cities_by_gender]
                                            .sort((a, b) => b[genderSort] - a[genderSort])
                                            .slice((citiesGenderPage - 1) * PAGE_SIZE, citiesGenderPage * PAGE_SIZE)
                                            .map((item, idx) => (
                                                <div key={idx} className="flex flex-col gap-1">
                                                    <div className="flex justify-between text-[12px] font-bold text-[var(--foreground)]">
                                                        <span>{item.city}</span>
                                                        <div className="flex gap-2 text-[11px]">
                                                            <span className={`transition-colors ${genderSort === 'female' ? 'text-orange-400 font-black' : 'text-zinc-400'}`}>Mulheres {item.female}%</span>
                                                            <span className={`transition-colors ${genderSort === 'male' ? 'text-sky-500 font-black' : 'text-zinc-400'}`}>Homens {item.male}%</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-[var(--shell-border)]">
                                                        <div className={`h-full transition-all duration-500 ${genderSort === 'female' ? 'bg-orange-400' : 'bg-orange-400/30'}`} style={{ width: `${item.female}%` }} />
                                                        <div className={`h-full transition-all duration-500 ${genderSort === 'male' ? 'bg-sky-500' : 'bg-sky-500/30'}`} style={{ width: `${item.male}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                    <PaginationControl
                                        currentPage={citiesGenderPage}
                                        totalItems={data.demographics.cities_by_gender.length}
                                        pageSize={PAGE_SIZE}
                                        onPageChange={setCitiesGenderPage}
                                    />
                                </div>

                                {/* 4. Countries Table (Bottom Right) */}
                                <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-3xl overflow-hidden flex flex-col h-full">
                                    <div className="p-6 border-b border-[var(--shell-border)] bg-[var(--shell-side)]">
                                        <h3 className="text-4xl font-black text-white tracking-tighter leading-none mb-2">{isInstagram ? "Audiência por Geografia - País" : "Fãs por Geografia - País"}</h3>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">{isInstagram ? "De onde vem a audiência que o conteúdo alcança." : "De onde vêm os seus fãs"}</p>
                                    </div>
                                    <div className="overflow-x-auto flex-1">
                                        <table className="w-full text-left text-xs whitespace-nowrap">
                                            <thead className="bg-[var(--shell-surface)] border-b border-[var(--shell-border)]">
                                                <tr className="text-zinc-500 font-bold uppercase tracking-wider">
                                                    <th className="px-6 py-3">País</th>
                                                    <th className="px-6 py-3 text-right">{isInstagram ? "Contas Alcançadas" : "Curtidas da Pág."}</th>
                                                    <th className="px-6 py-3 text-right">{isInstagram ? "Variação" : "Cresc. Absoluto"}</th>
                                                    <th className="px-6 py-3 text-right">% do Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[var(--shell-border)]">
                                                {data.demographics.countries_data
                                                    .slice((countryPage - 1) * PAGE_SIZE, countryPage * PAGE_SIZE)
                                                    .map((item, idx) => (
                                                        <tr key={idx} className="hover:bg-[var(--shell-side)] transition-colors">
                                                            <td className="px-6 py-3 font-bold text-[var(--foreground)]">{item.country}</td>
                                                            <td className="px-6 py-3 text-right font-mono text-zinc-400">
                                                                {formatNumber(item.likes)}
                                                                <div className={`text-[9px] ${item.growth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                    {item.growth > 0 ? '+' : ''}{(item.growth / item.likes * 100).toFixed(1)}%
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-3 text-right font-mono">
                                                                <span className={item.growth >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                                                                    {item.growth > 0 ? '+' : ''}{item.growth}
                                                                </span>
                                                                <div className={`text-[9px] ${item.growth >= 0 ? 'text-emerald-500/70' : 'text-rose-500/70'} opacity-70`}>
                                                                    {item.growth > 0 ? '+' : ''}{(item.growth * 10).toFixed(1)}% est.
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-3 text-right font-mono font-bold text-[var(--foreground)]">
                                                                {item.percentage}%
                                                                <div className={`text-[9px] ${item.growth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                    {item.growth > 0 ? '+' : ''}0.2%
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <PaginationControl
                                        currentPage={countryPage}
                                        totalItems={data.demographics.countries_data.length}
                                        pageSize={PAGE_SIZE}
                                        onPageChange={setCountryPage}
                                    />
                                </div>



                                {/* Seguidores */}
                                <div className="bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-3xl overflow-hidden flex flex-col h-full">
                                    <div className="p-6 border-b border-[var(--shell-border)] bg-[var(--shell-side)] flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="text-4xl font-black text-white tracking-tighter leading-none mb-2">Seguidores</h3>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Fluxo de entrada/saída e evolução no período.</p>
                                        </div>
                                        <div className="flex bg-[var(--shell-surface)] rounded-xl p-0.5 border border-[var(--shell-border)]">
                                            <button
                                                onClick={() => setFollowersInterval("daily")}
                                                className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${followersInterval === "daily" ? "bg-blue-500 text-white shadow-sm" : "text-zinc-500 hover:text-[var(--foreground)]"}`}
                                            >
                                                Diário
                                            </button>
                                            <button
                                                onClick={() => setFollowersInterval("weekly")}
                                                className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${followersInterval === "weekly" ? "bg-blue-500 text-white shadow-sm" : "text-zinc-500 hover:text-[var(--foreground)]"}`}
                                            >
                                                Semanal
                                            </button>
                                            <button
                                                onClick={() => setFollowersInterval("monthly")}
                                                className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${followersInterval === "monthly" ? "bg-blue-500 text-white shadow-sm" : "text-zinc-500 hover:text-[var(--foreground)]"}`}
                                            >
                                                Mensal
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-6 flex flex-col gap-6">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-black italic tracking-tight text-blue-500">Novos vs Deixaram de seguir</h4>
                                                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-full px-3 py-1">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                                    Novos
                                                    <span className="w-2 h-2 rounded-full bg-rose-500 ml-2" />
                                                    Saídas
                                                </div>
                                            </div>
                                            {(() => {
                                                const maxVal = Math.max(1, ...followersSeries.map(p => Math.max(p.gained, p.lost)));
                                                const barMax = 100;

                                                return (
                                                    <div className="relative h-[280px] rounded-2xl bg-[var(--shell-side)] border border-[var(--shell-border)] p-4 overflow-hidden">
                                                        <div className="absolute left-4 right-4 top-1/2 h-px bg-[var(--shell-border)]" />
                                                        <div className="absolute left-4 right-4 top-6 h-px bg-[var(--shell-border)] opacity-40" />
                                                        <div className="absolute left-4 right-4 bottom-6 h-px bg-[var(--shell-border)] opacity-40" />

                                                        <div className="relative h-full flex items-end gap-2">
                                                            {followersSeries.map((p) => {
                                                                const up = Math.round((p.gained / maxVal) * barMax);
                                                                const down = Math.round((p.lost / maxVal) * barMax);
                                                                return (
                                                                    <div key={p.label} className="flex-1 h-full flex flex-col items-stretch justify-end gap-2 min-w-[18px]">
                                                                        <div className="relative flex-1 flex items-center justify-center">
                                                                            <div className="absolute left-1/2 top-1/2 h-[52px] -translate-x-1/2 border-l border-dashed border-zinc-500/35" />
                                                                            <div className="absolute left-0 right-0 top-1/2 -translate-y-full flex items-end justify-center">
                                                                                <div className="w-full max-w-[22px] rounded-t-lg bg-emerald-500/90 shadow-[0_10px_30px_rgba(16,185,129,0.15)]" style={{ height: `${up}px` }} title={`Novos: ${p.gained.toLocaleString('pt-BR')}`} />
                                                                            </div>
                                                                            <div className="absolute left-0 right-0 top-1/2 flex items-start justify-center">
                                                                                <div className="w-full max-w-[22px] rounded-b-lg bg-rose-500/85 shadow-[0_10px_30px_rgba(244,63,94,0.15)]" style={{ height: `${down}px` }} title={`Saídas: ${p.lost.toLocaleString('pt-BR')}`} />
                                                                            </div>
                                                                        </div>
                                                                        <div className="h-8 flex items-start justify-center">
                                                                            <span className="inline-block -rotate-35 origin-top text-[8px] font-bold text-zinc-500 text-left font-mono tracking-tight">
                                                                                {p.label}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        <div className="absolute top-4 right-4 text-[10px] font-black text-zinc-500 bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-full px-2 py-1">
                                                            Net: {followersSeries[followersSeries.length - 1]?.cumulative >= 0 ? "+" : ""}
                                                            {followersSeries[followersSeries.length - 1]?.cumulative.toLocaleString('pt-BR')}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        <div className="space-y-3">
                                            <h4 className="text-sm font-black italic tracking-tight text-blue-500">Aumento de seguidores</h4>
                                            {(() => {
                                                const values = followersSeries.map(p => p.cumulative);
                                                const min = Math.min(...values, 0);
                                                const max = Math.max(...values, 1);

                                                const w = 560;
                                                const h = 250;
                                                const padX = 8;
                                                const padY = 18;
                                                const innerW = w - padX * 2;
                                                const innerH = h - padY * 2;

                                                const xAt = (i: number) => padX + (innerW * (followersSeries.length <= 1 ? 0 : i / (followersSeries.length - 1)));
                                                const yAt = (v: number) => {
                                                    if (max === min) return padY + innerH / 2;
                                                    return padY + ((max - v) / (max - min)) * innerH;
                                                };

                                                const path = followersSeries.map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${yAt(p.cumulative).toFixed(1)}`).join(" ");
                                                const area = `${path} L ${xAt(followersSeries.length - 1).toFixed(1)} ${yAt(min).toFixed(1)} L ${xAt(0).toFixed(1)} ${yAt(min).toFixed(1)} Z`;

                                                return (
                                                    <div className="relative h-[280px] rounded-2xl bg-[var(--shell-side)] border border-[var(--shell-border)] p-4 overflow-hidden">
                                                        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full">
                                                            <defs>
                                                                <linearGradient id="followersArea" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="0%" stopColor="rgba(59,130,246,0.35)" />
                                                                    <stop offset="100%" stopColor="rgba(59,130,246,0)" />
                                                                </linearGradient>
                                                                <linearGradient id="followersStroke" x1="0" y1="0" x2="1" y2="0">
                                                                    <stop offset="0%" stopColor="#06b6d4" />
                                                                    <stop offset="60%" stopColor="#3b82f6" />
                                                                    <stop offset="100%" stopColor="#6366f1" />
                                                                </linearGradient>
                                                            </defs>

                                                            <line x1={padX} x2={w - padX} y1={yAt(0)} y2={yAt(0)} stroke="rgba(161,161,170,0.35)" strokeWidth="1" />
                                                            <line x1={padX} x2={w - padX} y1={padY} y2={padY} stroke="rgba(161,161,170,0.18)" strokeWidth="1" />
                                                            <line x1={padX} x2={w - padX} y1={h - padY} y2={h - padY} stroke="rgba(161,161,170,0.18)" strokeWidth="1" />
                                                            <path d={area} fill="url(#followersArea)" />
                                                            <path d={path} fill="none" stroke="url(#followersStroke)" strokeWidth="3" strokeLinecap="round" />
                                                            {followersSeries.map((p, i) => (
                                                                <g key={p.label}>
                                                                    <line
                                                                        x1={xAt(i)}
                                                                        x2={xAt(i)}
                                                                        y1={yAt(p.cumulative) + 6}
                                                                        y2={h - padY}
                                                                        stroke="rgba(161,161,170,0.45)"
                                                                        strokeWidth="1"
                                                                        strokeDasharray="3 4"
                                                                    />
                                                                    <circle cx={xAt(i)} cy={yAt(p.cumulative)} r="4" fill="#3b82f6" opacity="0.95" />
                                                                    <circle cx={xAt(i)} cy={yAt(p.cumulative)} r="10" fill="transparent" />
                                                                </g>
                                                            ))}
                                                            {followersSeries.map((point, i) => (
                                                                <g key={`label-${point.label}`} transform={`translate(${xAt(i)} ${h - 4}) rotate(-35)`}>
                                                                    <text
                                                                        x="0"
                                                                        y="0"
                                                                        textAnchor="start"
                                                                        fill="rgb(113 113 122)"
                                                                        fontSize="8"
                                                                        fontWeight="700"
                                                                        style={{ userSelect: "none" }}
                                                                    >
                                                                        {point.label}
                                                                    </text>
                                                                </g>
                                                            ))}
                                                        </svg>

                                                        <div className="absolute top-4 left-4 text-[10px] font-black text-zinc-500 bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-full px-2 py-1">
                                                            Net: {followersSeries[followersSeries.length - 1]?.cumulative >= 0 ? "+" : ""}
                                                            {followersSeries[followersSeries.length - 1]?.cumulative.toLocaleString('pt-BR')}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>


                            </div >
                        )
                        }
                    </div >
                )
            }
        </div >
    );
}

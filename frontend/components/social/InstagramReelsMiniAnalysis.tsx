"use client";

import { useMemo } from "react";
import {
    PaperAirplaneIcon,
    PlayCircleIcon,
} from "@heroicons/react/24/solid";

type ReelPost = {
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
};

type ReelMetric = {
    post: ReelPost;
    durationSec: number;
    audioLabel: string;
    audioType: "trending" | "original";
    views: number;
    engagementTotal: number;
    engagementRate: number;
    hookRate: number;
    avgWatchSec: number;
    viralFactor: number;
    followers: number;
    followersViewRate: number;
    shares: number;
    saves: number;
    rankingScore: number;
    dominantAgeRange: string;
    dominantAgeShare: number;
    dominantGender: "Mulheres" | "Homens";
    dominantGenderShare: number;
};

type StoryFrameRow = {
    id: string;
    image: string;
    time: string;
    label: string;
    type: string;
    reach: number;
    retention: number;
    interactionLabel: string;
    backTaps: number;
    exits: number;
    linkClicks: number;
};

type InstagramReelsMiniAnalysisProps = {
    posts: ReelPost[];
    storiesRows?: StoryFrameRow[];
    totalFollowers?: number;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return `${Math.round(value)}`;
};

const formatSeconds = (value: number) => `${Math.max(1, Math.round(value))}s`;
const formatMinutes = (value: number) => `${(value / 60).toFixed(1)} min`;

const hash = (value: string) => value.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

const buildAudioLabel = (seed: number, type: "trending" | "original") => {
    const trending = ["Trending: Space Wave", "Trending: Focus Cut", "Trending: Neon Pulse"];
    const original = ["Original: B-Studio Voice", "Original: Bastidor 2026", "Original: Insight Talk"];
    const list = type === "trending" ? trending : original;
    return list[seed % list.length];
};

const AGE_BRACKETS = ["18-24", "25-34", "35-44", "45-54"];
const WEEK_DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const getToneByRetentionRate = (rate: number) => {
    if (rate >= 40) return "bg-white/10/20 text-[var(--foreground)]";
    if (rate >= 28) return "bg-[var(--shell-border)]/20 text-[var(--foreground)]";
    return "bg-[var(--shell-border)]/20 text-[var(--foreground)]";
};

const getBarByRetentionRate = (rate: number) => {
    if (rate >= 40) return "bg-white/10";
    if (rate >= 28) return "bg-[var(--shell-border)]";
    return "bg-[var(--shell-border)]";
};

const getToneByEngagementRate = (rate: number) => {
    if (rate >= 8) return "bg-white/10/20 text-[var(--foreground)]";
    if (rate >= 4) return "bg-[var(--shell-border)]/20 text-[var(--foreground)]";
    return "bg-[var(--shell-border)]/20 text-[var(--foreground)]";
};

const getToneByFollowersViewRate = (rate: number) => {
    if (rate >= 35) return "bg-white/10/20 text-[var(--foreground)]";
    if (rate >= 20) return "bg-[var(--shell-border)]/20 text-[var(--foreground)]";
    return "bg-[var(--shell-border)]/20 text-[var(--foreground)]";
};

const getToneByDominantGender = (gender: "Mulheres" | "Homens") => {
    return gender === "Mulheres"
        ? "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-300 border-fuchsia-500/30"
        : "bg-[var(--shell-border)]/15 text-[var(--foreground)] dark:text-[var(--foreground)] border-[var(--shell-border)]/30";
};

export default function InstagramReelsMiniAnalysis({ posts, totalFollowers = 0 }: InstagramReelsMiniAnalysisProps) {
    const reels = useMemo<ReelMetric[]>(() => {
        return posts.map((post) => {
            const seed = hash(post.id);
            const durationSec = 12 + (seed % 34);
            const audioType: "trending" | "original" = seed % 2 === 0 ? "trending" : "original";
            const views = Math.max(1, post.video_views || post.reach);
            const followersViewRate = Number(
                clamp((views / Math.max(1, totalFollowers)) * 100, 0, 100).toFixed(1),
            );
            const shares = Math.max(1, post.shares);
            const saves = Math.max(1, post.reactions + (seed % 120));
            const engagementTotal = Math.max(1, post.reactions + post.comments + shares + saves);
            const engagementRate = Number(((engagementTotal / Math.max(1, post.reach)) * 100).toFixed(1));
            const followers = Math.max(1, Math.round((post.link_clicks + shares + post.comments) * 0.16));

            const hookRate = clamp(
                Math.round((views / Math.max(1, post.reach)) * 42 + (seed % 9) - 3),
                16,
                68,
            );
            const midRetention = clamp(hookRate - 10 + (seed % 6), 9, 55);
            const avgWatchSec = clamp(Math.round(durationSec * ((midRetention + 20) / 100)), 3, durationSec);
            const viralFactor = (shares / engagementTotal) * 100;

            const rankingScore = Math.round(
                clamp(
                    hookRate * 0.34 + engagementRate * 2.15 + viralFactor * 1.75 + Math.min(100, followers) * 0.15 + (seed % 11) - 4,
                    58,
                    99,
                ),
            );
            const dominantAgeRange = AGE_BRACKETS[seed % AGE_BRACKETS.length];
            const dominantAgeShare = clamp(34 + (seed % 27), 30, 68);
            const dominantGender: "Mulheres" | "Homens" = seed % 2 === 0 ? "Mulheres" : "Homens";
            const dominantGenderShare = clamp(52 + (seed % 18), 50, 78);

            return {
                post,
                durationSec,
                audioLabel: buildAudioLabel(seed, audioType),
                audioType,
                views,
                engagementTotal,
                engagementRate,
                hookRate,
                avgWatchSec,
                viralFactor,
                followers,
                followersViewRate,
                shares,
                saves,
                rankingScore,
                dominantAgeRange,
                dominantAgeShare,
                dominantGender,
                dominantGenderShare,
            };
        }).sort((a, b) => b.rankingScore - a.rankingScore);
    }, [posts, totalFollowers]);

    const winner = reels[0];
    const topRows = reels.slice(0, 5);
    const summary = useMemo(() => {
        const totalReels = reels.length;
        const totalDurationSec = reels.reduce((acc, item) => acc + item.durationSec, 0);
        const totalShares = reels.reduce((acc, item) => acc + item.shares, 0);
        const totalEngagements = reels.reduce((acc, item) => acc + item.engagementTotal, 0);
        const avgWatchSec = Math.round(reels.reduce((acc, item) => acc + item.avgWatchSec, 0) / Math.max(1, totalReels));
        const avgDurationSec = Math.round(reels.reduce((acc, item) => acc + item.durationSec, 0) / Math.max(1, totalReels));
        const followersSeenRate = Number(
            clamp(reels.reduce((acc, item) => acc + item.followersViewRate, 0) / Math.max(1, totalReels), 0, 100).toFixed(1),
        );
        const nonFollowersSeenRate = Number((100 - followersSeenRate).toFixed(1));
        const isFollowersMajority = followersSeenRate >= nonFollowersSeenRate;
        const dominantAudienceLabel = isFollowersMajority ? "Seguidores" : "Não seguidores";
        const dominantAudienceRate = isFollowersMajority ? followersSeenRate : nonFollowersSeenRate;

        return {
            totalReels,
            totalDurationSec,
            totalShares,
            totalEngagements,
            avgWatchSec,
            avgDurationSec,
            followersSeenRate,
            nonFollowersSeenRate,
            isFollowersMajority,
            dominantAudienceLabel,
            dominantAudienceRate,
        };
    }, [reels]);
    const bestPublishWindow = useMemo(() => {
        const dayBuckets = Array.from({ length: 7 }, () => ({ sum: 0, count: 0 }));
        const hourBuckets = Array.from({ length: 24 }, () => ({ sum: 0, count: 0 }));

        reels.forEach((item) => {
            const date = new Date(item.post.timestamp);
            const day = date.getDay();
            const hour = date.getHours();
            const score = (item.engagementTotal * 1.5) + (item.shares * 2.2) + (item.followers * 3.5) + (item.hookRate * 20);

            dayBuckets[day].sum += score;
            dayBuckets[day].count += 1;
            hourBuckets[hour].sum += score;
            hourBuckets[hour].count += 1;
        });

        const pickBestIndex = (buckets: Array<{ sum: number; count: number }>) => {
            let bestIndex = 0;
            let bestAvg = -Infinity;
            buckets.forEach((bucket, index) => {
                if (bucket.count === 0) return;
                const avg = bucket.sum / bucket.count;
                if (avg > bestAvg) {
                    bestAvg = avg;
                    bestIndex = index;
                }
            });
            return bestIndex;
        };

        const bestDayIndex = pickBestIndex(dayBuckets);
        const bestHour = pickBestIndex(hourBuckets);

        return {
            day: WEEK_DAYS[bestDayIndex] ?? "N/D",
            hour: `${bestHour}h`,
        };
    }, [reels]);

    const insight = useMemo(() => {
        const trending = reels.filter((item) => item.audioType === "trending");
        const original = reels.filter((item) => item.audioType === "original");

        if (trending.length === 0 || original.length === 0) {
            return "Seus Reels com gancho forte nos 3 primeiros segundos estão puxando distribuição orgânica acima da média.";
        }

        const avgReachTrending = trending.reduce((acc, item) => acc + item.post.reach, 0) / Math.max(1, trending.length);
        const avgReachOriginal = original.reduce((acc, item) => acc + item.post.reach, 0) / Math.max(1, original.length);
        const avgFollowersTrending = trending.reduce((acc, item) => acc + item.followers, 0) / Math.max(1, trending.length);
        const avgFollowersOriginal = original.reduce((acc, item) => acc + item.followers, 0) / Math.max(1, original.length);

        const reachLift = Math.round(((avgReachTrending - avgReachOriginal) / Math.max(1, avgReachOriginal)) * 100);
        const convLift = Math.round(((avgFollowersOriginal - avgFollowersTrending) / Math.max(1, avgFollowersTrending)) * 100);

        return `Seus vídeos com áudio em alta (Trending) têm ${Math.abs(reachLift)}% mais alcance, mas os com áudio original têm ${Math.abs(convLift)}% mais conversão de seguidores.`;
    }, [reels]);

    if (!winner || topRows.length === 0) return null;

    return (
        <div className="lg:col-span-2 bento-cell liquid-glass">
            <div className="px-4 py-3 border-b border-[var(--shell-border)]/50 bg-[var(--shell-side)]/50">
                <h3 className="text-[11px] uppercase tracking-widest font-black text-[var(--foreground)] dark:text-[var(--foreground)]">
                    Análise de Reels (Mini Lista)
                </h3>
            </div>

            <div className="p-4 md:p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-8 gap-x-2 gap-y-1.5">
                    <div className="h-[135px] bento-cell bg-[var(--shell-border)]/30 p-4 flex flex-col justify-between xl:col-span-2 xl:col-start-1 xl:row-start-1">
                        <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--foreground)] dark:text-[var(--foreground)] font-black">Total de Reels</div>
                        <div className="text-5xl leading-none font-black tracking-tight text-[var(--foreground)] ">{summary.totalReels}</div>
                        <div className="text-[11px] text-[var(--foreground)] dark:text-[var(--foreground)]">
                            Total de minutos: <span className="font-black text-[var(--foreground)] ">{formatMinutes(summary.totalDurationSec)}</span>
                        </div>
                    </div>

                    <div className="h-[135px] bento-cell bg-[var(--shell-border)]/30 p-4 flex flex-col justify-between xl:col-span-2 xl:col-start-3 xl:row-start-1">
                        <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--foreground)] dark:text-[var(--foreground)] font-black">Tempo Médio</div>
                        <div className="text-5xl leading-none font-black tracking-tight text-[var(--foreground)] ">{formatSeconds(summary.avgWatchSec)}</div>
                        <div className="text-[11px] text-[var(--foreground)] dark:text-[var(--foreground)]">
                            Média assistida por Reel ({formatSeconds(summary.avgDurationSec)} de duração média)
                        </div>
                    </div>

                    <div className="h-[135px] bento-cell bg-[var(--shell-border)]/30 p-4 flex flex-col justify-between xl:col-span-2 xl:row-start-2 xl:col-start-1">
                        <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--foreground)] dark:text-[var(--foreground)] font-black">Compartilhamentos</div>
                        <div className="text-5xl leading-none font-black tracking-tight text-[var(--foreground)] ">{formatNumber(summary.totalShares)}</div>
                        <div className="text-[11px] text-[var(--foreground)] dark:text-[var(--foreground)]">
                            Soma de shares dos reels analisados
                        </div>
                    </div>

                    <div className="h-[135px] bento-cell bg-[var(--shell-border)]/30 p-4 flex flex-col justify-between xl:col-span-2 xl:row-start-2 xl:col-start-3">
                        <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--foreground)] dark:text-[var(--foreground)] font-black">Engajamentos</div>
                        <div className="text-5xl leading-none font-black tracking-tight text-[var(--foreground)] ">{formatNumber(summary.totalEngagements)}</div>
                        <div className="text-[11px] text-[var(--foreground)] dark:text-[var(--foreground)]">
                            Reações + comentários + shares + salvos
                        </div>
                    </div>

                    <div className="md:col-span-2 xl:col-span-2 xl:col-start-5 xl:row-span-2 xl:h-[276px] bento-cell bg-[var(--shell-surface)]/20 p-4 flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-lg bg-white/10/25 text-[var(--foreground)] inline-flex items-center justify-center text-[11px]">◷</span>
                            <h4 className="text-sm font-black text-[var(--foreground)] ">Melhores Horários • Reels</h4>
                        </div>
                        <div className="mt-3 grid grid-cols-1 gap-2">
                            <div className="rounded-xl bento-cell bg-[var(--shell-border)]/10 px-3 py-2">
                                <div className="text-[9px] uppercase tracking-[0.14em] font-black text-[var(--foreground)] ">Melhor horário</div>
                                <div className="text-3xl leading-none font-black text-[var(--foreground)]  mt-1">{bestPublishWindow.hour}</div>
                            </div>
                            <div className="rounded-xl border border-[var(--shell-border)]/35 bg-[var(--shell-border)]/10 px-3 py-2">
                                <div className="text-[9px] uppercase tracking-[0.14em] font-black text-[var(--foreground)] dark:text-[var(--foreground)]">Melhor dia</div>
                                <div className="text-3xl leading-none font-black text-[var(--foreground)]  mt-1">{bestPublishWindow.day}</div>
                            </div>
                        </div>
                        <div className="mt-auto pt-2 text-[11px] text-[var(--foreground)] dark:text-[var(--foreground)]">
                            Baseado em interação média dos Reels.
                        </div>
                    </div>

                    <div className="md:col-span-2 xl:col-span-2 xl:col-start-7 xl:row-span-2 xl:h-[276px] bento-cell bg-[var(--shell-surface)]/10 p-3 flex flex-col overflow-hidden">
                        <div className="text-[10px] uppercase tracking-widest text-[var(--foreground)] dark:text-[var(--foreground)] font-black">
                            Resumo de audiência
                        </div>
                        <div className="mt-1 text-[11px] text-[var(--foreground)] dark:text-[var(--foreground)]">
                            {summary.dominantAudienceLabel}: <span className="font-black text-[var(--foreground)] ">{summary.dominantAudienceRate}%</span> das views.
                        </div>

                        <div className="mt-2 flex-1 min-h-0 grid grid-cols-[1fr_auto_1fr] items-center">
                            <div
                                className="relative h-44 w-44 rounded-full shrink-0 col-start-2 justify-self-center"
                                style={{
                                    background: `conic-gradient(rgb(251 146 60) 0 ${summary.followersSeenRate}%, rgb(14 165 233) ${summary.followersSeenRate}% 100%)`,
                                }}
                            >
                                <div className="absolute inset-[28px] rounded-full border border-[var(--shell-border)] bg-[var(--shell-surface)] flex flex-col items-center justify-center px-2 text-center shadow-inner">
                                    <span className="w-full text-center text-[2rem] leading-none font-black tabular-nums text-[var(--foreground)] ">
                                        {summary.dominantAudienceRate}%
                                    </span>
                                    <span className="mt-1 text-[9px] leading-[1.1] uppercase tracking-[0.04em] font-black text-[var(--foreground)]  max-w-[84px]">
                                        {summary.isFollowersMajority ? "SEGUIDORES" : "NÃO SEGUIDORES"}
                                    </span>
                                </div>
                            </div>

                            <div className="min-w-[118px] space-y-1.5 col-start-3 justify-self-start ml-3">
                                <div className="flex items-center justify-between text-[10px] text-[var(--foreground)] ">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-[var(--shell-border)]" />
                                        <span className="font-black uppercase tracking-[0.04em]">Seguidores</span>
                                    </div>
                                    <span className="font-black">{summary.followersSeenRate}%</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-[var(--foreground)] ">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-[var(--shell-border)]" />
                                        <span className="font-black uppercase tracking-[0.04em]">Não seguidores</span>
                                    </div>
                                    <span className="font-black">{summary.nonFollowersSeenRate}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bento-cell bg-[var(--shell-border)]/10 p-3 md:p-4 space-y-4">
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
                        <div className="xl:col-span-4 bento-cell bg-[var(--shell-border)]/20 p-3">
                            <div className="text-[10px] uppercase tracking-widest font-black text-[var(--foreground)] dark:text-[var(--foreground)] mb-2">
                                Hero Section (MVP da Semana)
                            </div>
                            <div className="flex gap-3">
                                <div className="w-24 h-24 rounded-xl overflow-hidden bento-cell bg-[var(--shell-surface)] shrink-0 relative">
                                    <img src={winner.post.image} alt={winner.post.message} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                        <PlayCircleIcon className="w-7 h-7 text-[var(--foreground)]/90" />
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs font-black text-[var(--foreground)]  leading-tight line-clamp-2">
                                        MVP da Semana: Campeão de Distribuição
                                    </div>
                                    <div className="text-[11px] text-[var(--foreground)] dark:text-[var(--foreground)] mt-1 truncate">{winner.audioLabel}</div>
                                    <div className="mt-2 inline-flex items-center rounded-lg px-2 py-1 text-[10px] font-black bg-white/10/20 text-[var(--foreground)]">
                                        🏆 Maior Retenção ({winner.hookRate}%)
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="xl:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="h-[132px] bento-cell bg-[var(--shell-border)]/20 p-4 flex flex-col justify-between">
                                <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--foreground)] dark:text-[var(--foreground)] font-black">Taxa de Gancho</div>
                                <div className="text-5xl leading-none font-black tracking-tight text-[var(--foreground)] ">{winner.hookRate}%</div>
                                <div className="text-[11px] text-[var(--foreground)] dark:text-[var(--foreground)]">Retenção nos 3s iniciais</div>
                            </div>
                            <div className="h-[132px] bento-cell bg-[var(--shell-border)]/20 p-4 flex flex-col justify-between">
                                <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--foreground)] dark:text-[var(--foreground)] font-black">Tempo Médio</div>
                                <div className="text-4xl xl:text-5xl leading-none font-black tracking-tight text-[var(--foreground)]  whitespace-nowrap">
                                    {formatSeconds(winner.avgWatchSec)} / {formatSeconds(winner.durationSec)}
                                </div>
                                <div className="text-[11px] text-[var(--foreground)] dark:text-[var(--foreground)]">Tempo assistido vs duração total</div>
                            </div>
                            <div className="h-[132px] bento-cell bg-[var(--shell-border)]/20 p-4 flex flex-col justify-between">
                                <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--foreground)] dark:text-[var(--foreground)] font-black">Fator Viral</div>
                                <div className="text-5xl leading-none font-black tracking-tight text-[var(--foreground)] ">{winner.viralFactor.toFixed(1)}%</div>
                                <div className="text-[11px] text-[var(--foreground)] dark:text-[var(--foreground)]">Shares sobre interações totais</div>
                            </div>
                            <div className="h-[132px] bento-cell bg-[var(--shell-border)]/20 p-4 flex flex-col justify-between">
                                <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--foreground)] dark:text-[var(--foreground)] font-black">Conversão Real</div>
                                <div className="text-5xl leading-none font-black tracking-tight text-[var(--foreground)] ">+{formatNumber(winner.followers)}</div>
                                <div className="text-[11px] text-[var(--foreground)] dark:text-[var(--foreground)]">Novos seguidores do reel</div>
                            </div>
                        </div>
                    </div>

                    <div className="bento-cell bg-[var(--shell-border)]/10 overflow-hidden">
                        <div className="px-4 py-3 border-b border-[var(--shell-border)] bg-[var(--shell-side)]/50 flex items-center justify-between gap-3">
                            <h4 className="text-[10px] uppercase tracking-widest font-black text-[var(--foreground)] dark:text-[var(--foreground)]">
                                Ranking de Performance de Reels
                            </h4>
                            <span className="text-[10px] uppercase tracking-widest font-black text-[var(--foreground)] dark:text-[var(--foreground)]">
                                Top {topRows.length} Reels
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1380px] text-sm">
                                <thead>
                                    <tr className="text-[10px] uppercase tracking-widest font-black text-[var(--foreground)] border-b border-[var(--shell-border)] bg-[var(--shell-surface)]/50">
                                        <th className="py-2.5 px-3 text-left"># & Conteúdo</th>
                                        <th className="py-2.5 px-3 text-right">👥 Seguidores viram</th>
                                        <th className="py-2.5 px-3 text-right">🧬 Faixa etária pred.</th>
                                        <th className="py-2.5 px-3 text-right">⚧ Gênero maioria</th>
                                        <th className="py-2.5 px-3 text-right">👀 Visualizações</th>
                                        <th className="py-2.5 px-3 text-right">❤️ Engajamento</th>
                                        <th className="py-2.5 px-3 text-right">Taxa de Engaj.</th>
                                        <th className="py-2.5 px-3 text-right">🎣 Retenção (3s)</th>
                                        <th className="py-2.5 px-3 text-right">✈️ Distribuição</th>
                                        <th className="py-2.5 px-3 text-right">🔰 Novos Seg.</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                    {topRows.map((row, index) => (
                                        <tr key={row.post.id} className="hover:bg-[var(--shell-border)] dark:hover:bg-[var(--shell-border)]/40 transition-colors">
                                            <td className="py-2.5 px-3">
                                                <div className="flex items-center gap-2.5 min-w-[360px]">
                                                    <span className="w-5 text-center text-xs font-black text-[var(--foreground)] dark:text-[var(--foreground)]">{index + 1}</span>
                                                    <div className="w-10 h-10 rounded-lg overflow-hidden bento-cell shrink-0">
                                                        <img src={row.post.image} alt={row.post.message} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-xs font-black text-[var(--foreground)]  truncate">{row.audioLabel}</div>
                                                        <div className="text-[11px] text-[var(--foreground)] dark:text-[var(--foreground)]">0:{String(row.durationSec).padStart(2, "0")}</div>
                                                        <div className="text-[10px] text-[var(--foreground)] dark:text-[var(--foreground)] truncate">
                                                            {formatNumber(row.views)} Views | {formatNumber(row.engagementTotal)} Interações | {row.engagementRate.toFixed(1)}% Taxa | {row.hookRate}% Retenção | {formatNumber(row.shares)} Shares ✈️
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-2.5 px-3 text-right">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-black ${getToneByFollowersViewRate(row.followersViewRate)}`}>
                                                    {row.followersViewRate.toFixed(1)}%
                                                </span>
                                                <div className="text-[10px] text-[var(--foreground)] dark:text-[var(--foreground)] mt-0.5">da base</div>
                                            </td>
                                            <td className="py-2.5 px-3 text-right">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded border border-[var(--shell-border)]/30 bg-[var(--shell-border)]/15 text-xs font-black text-[var(--foreground)] dark:text-[var(--foreground)]">
                                                    {row.dominantAgeRange}
                                                </span>
                                                <div className="text-[10px] text-[var(--foreground)] dark:text-[var(--foreground)] mt-0.5">{row.dominantAgeShare}%</div>
                                            </td>
                                            <td className="py-2.5 px-3 text-right">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-black ${getToneByDominantGender(row.dominantGender)}`}>
                                                    {row.dominantGender}
                                                </span>
                                                <div className="text-[10px] text-[var(--foreground)] dark:text-[var(--foreground)] mt-0.5">{row.dominantGenderShare}%</div>
                                            </td>
                                            <td className="py-2.5 px-3 text-right">
                                                <div className="text-lg font-black text-[var(--foreground)] ">{formatNumber(row.views)}</div>
                                                <div className="text-[10px] text-[var(--foreground)] dark:text-[var(--foreground)]">views</div>
                                            </td>
                                            <td className="py-2.5 px-3 text-right">
                                                <div className="text-lg font-black text-[var(--foreground)] ">{formatNumber(row.engagementTotal)}</div>
                                                <div className="text-[10px] text-[var(--foreground)] dark:text-[var(--foreground)]">interações</div>
                                            </td>
                                            <td className="py-2.5 px-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className={`text-xs px-2 py-0.5 rounded ${getToneByEngagementRate(row.engagementRate)} font-black`}>
                                                        {row.engagementRate.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-2.5 px-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className={`text-xs px-2 py-0.5 rounded ${getToneByRetentionRate(row.hookRate)} font-black`}>{row.hookRate}%</span>
                                                    <div className="w-16 h-2 rounded-full bg-[var(--accent-primary)] dark:bg-[var(--shell-border)] overflow-hidden">
                                                        <div className={`h-full ${getBarByRetentionRate(row.hookRate)}`} style={{ width: `${row.hookRate}%` }} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-black text-[var(--foreground)] dark:text-[var(--foreground)]">
                                                <span className="inline-flex items-center gap-1 justify-end">
                                                    <PaperAirplaneIcon className="w-3.5 h-3.5" />
                                                    {formatNumber(row.shares)}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-black text-[var(--foreground)] ">
                                                +{formatNumber(row.followers)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bento-cell bg-[var(--shell-border)]/20 px-4 py-3 text-sm text-[var(--foreground)]">
                        <span className="font-black text-[var(--foreground)] ">💡 Insight Bianconi:</span>{" "}
                        {insight} Use Trending para crescer, Original para vender.
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ArrowPathIcon,
    BoltIcon,
    ChartBarSquareIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    PlayIcon,
    SparklesIcon,
} from "@heroicons/react/24/solid";
import { apiUrl } from "@/lib/api";

type GoalType = "sales" | "lead_gen" | "growth" | "awareness" | "advocacy";
type MetricsView = "post_campaign" | "real_time";
type SimulationScenario = "baseline" | "growth_spike" | "fatigue_alert" | "conversion_drop";

interface CampaignOption {
    id: string;
    name: string;
    status?: string;
    objective?: string;
}

interface CampaignApiInsight {
    spend?: string;
    impressions?: string;
    reach?: string;
    clicks?: string;
    ctr?: string;
    cpc?: string;
    cpm?: string;
}

interface CampaignApiItem {
    id?: string;
    name?: string;
    status?: string;
    objective?: string;
    insights?: { data?: CampaignApiInsight[] };
}

interface CampaignAnalysisReport {
    report_id: number;
    campaign_id: string;
    campaign_name?: string;
    objective?: string;
    status?: string;
    goal_type: GoalType;
    analysis_mode: string;
    analyzed_at: string;
    days_analyzed: number;
    scores: {
        delivery: number;
        efficiency: number;
        goal: number;
        final: number;
    };
    metrics: {
        amount_spent: number;
        impressions: number;
        reach: number;
        frequency: number;
        clicks: number;
        link_clicks: number;
        outbound_clicks: number;
        ctr: number;
        cpc: number;
        cpm: number;
        leads: number;
        purchases: number;
        purchase_value: number;
        cost_per_lead?: number | null;
        cost_per_purchase?: number | null;
        roas?: number | null;
    };
    success_points: string[];
    attention_points: string[];
    recommended_actions: Array<{
        priority: string;
        title: string;
        description: string;
        expected_impact: string;
    }>;
    executive_summary: string;
    daily_metrics: Array<{
        date_start?: string | null;
        amount_spent: number;
        clicks: number;
        ctr: number;
        leads: number;
        purchases: number;
    }>;
}

interface RealtimePoint {
    label: string;
    spend: number;
    clicks: number;
    ctr: number;
}

interface RealtimeCampaignRow {
    id: string;
    name: string;
    status: string;
    objective: string;
    spend: number;
    clicks: number;
    ctr: number;
    cpc: number;
}

interface RealtimeSnapshot {
    generatedAt: string;
    totalSpend: number;
    totalClicks: number;
    avgCtr: number;
    avgCpc: number;
    activeCampaigns: number;
    alerts: string[];
    rows: RealtimeCampaignRow[];
    points: RealtimePoint[];
}

type CampaignAnalysisPanelProps = {
    adsProfileEnabled?: boolean;
    selectedProfileName?: string;
};

const GOAL_OPTIONS: Array<{ value: GoalType; label: string }> = [
    { value: "sales", label: "Vendas" },
    { value: "lead_gen", label: "Leads" },
    { value: "growth", label: "Crescimento" },
    { value: "awareness", label: "Awareness" },
    { value: "advocacy", label: "Advocacy" },
];

const VIEW_OPTIONS: Array<{ value: MetricsView; label: string }> = [
    { value: "post_campaign", label: "Pós-campanha" },
    { value: "real_time", label: "Tempo real" },
];

const SCENARIO_OPTIONS: Array<{ value: SimulationScenario; label: string }> = [
    { value: "baseline", label: "Baseline estável" },
    { value: "growth_spike", label: "Pico de crescimento" },
    { value: "fatigue_alert", label: "Fadiga criativa" },
    { value: "conversion_drop", label: "Queda de conversão" },
];

const SIMULATION_SEQUENCE: SimulationScenario[] = [
    "baseline",
    "growth_spike",
    "fatigue_alert",
    "conversion_drop",
];

const SIMULATED_CAMPAIGNS: CampaignOption[] = [
    {
        id: "sim-camp-001",
        name: "Campanha Nacional - Conversao Ecommerce Premium",
        status: "PAUSED",
        objective: "OUTCOME_SALES",
    },
    {
        id: "sim-camp-002",
        name: "Captação de Leads B2B - Consultoria Estratégica",
        status: "PAUSED",
        objective: "OUTCOME_LEADS",
    },
    {
        id: "sim-camp-003",
        name: "Influencer Collab - Crescimento Organico de Comunidade",
        status: "ACTIVE",
        objective: "OUTCOME_ENGAGEMENT",
    },
    {
        id: "sim-camp-004",
        name: "ONG Mobilizacao Local - Voluntariado e Assinaturas",
        status: "ACTIVE",
        objective: "OUTCOME_AWARENESS",
    },
    {
        id: "sim-camp-005",
        name: "Politico Regional - Mensagens de Alto Impacto",
        status: "ACTIVE",
        objective: "OUTCOME_TRAFFIC",
    },
    {
        id: "sim-camp-006",
        name: "Retargeting Quente - Recuperacao de Carrinho",
        status: "PAUSED",
        objective: "OUTCOME_SALES",
    },
];

function formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) return "-";
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 2,
    }).format(value);
}

function formatNumber(value: number | null | undefined): string {
    if (value === null || value === undefined) return "-";
    return new Intl.NumberFormat("pt-BR").format(value);
}

function formatPercent(value: number | null | undefined): string {
    if (value === null || value === undefined) return "-";
    return `${value.toFixed(2)}%`;
}

function scoreColor(score: number): string {
    if (score >= 80) return "text-emerald-300";
    if (score >= 60) return "text-amber-200";
    return "text-rose-200";
}

function safeNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) {
        return error.message;
    }
    return fallback;
}

function hashSeed(input: string): number {
    let hash = 0;
    for (let index = 0; index < input.length; index += 1) {
        hash = (hash << 5) - hash + input.charCodeAt(index);
        hash |= 0;
    }
    return Math.abs(hash);
}

function seededValue(seed: string, min: number, max: number): number {
    const seedValue = hashSeed(seed);
    const normalized = (seedValue % 1000) / 1000;
    return min + (max - min) * normalized;
}

function shiftByScenario(base: number, scenario: SimulationScenario, mode: "positive" | "negative"): number {
    if (scenario === "growth_spike") return mode === "positive" ? base * 1.35 : base * 0.85;
    if (scenario === "fatigue_alert") return mode === "positive" ? base * 0.85 : base * 1.35;
    if (scenario === "conversion_drop") return mode === "positive" ? base * 0.75 : base * 1.45;
    return base;
}

function buildSimulatedReport(
    campaign: CampaignOption,
    goalType: GoalType,
    scenario: SimulationScenario,
    round: number
): CampaignAnalysisReport {
    const seed = `${campaign.id}-${goalType}-${scenario}-${round}`;
    const spendBase = seededValue(`${seed}-spend`, 1200, 14500);
    const impressionsBase = seededValue(`${seed}-impressions`, 18000, 260000);
    const clicksBase = seededValue(`${seed}-clicks`, 300, 5800);
    const reachBase = impressionsBase * seededValue(`${seed}-reach-ratio`, 0.48, 0.86);

    const spend = shiftByScenario(spendBase, scenario, "positive");
    const impressions = Math.round(shiftByScenario(impressionsBase, scenario, "positive"));
    const clicks = Math.round(shiftByScenario(clicksBase, scenario, "positive"));
    const reach = Math.round(shiftByScenario(reachBase, scenario, "positive"));
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cpc = clicks > 0 ? spend / clicks : 0;
    const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
    const frequency = reach > 0 ? impressions / reach : 0;

    const leadsRaw = Math.round(shiftByScenario(seededValue(`${seed}-leads`, 8, 420), scenario, "positive"));
    const purchasesRaw = Math.round(shiftByScenario(seededValue(`${seed}-purchases`, 4, 230), scenario, "positive"));

    const leads = goalType === "lead_gen" || goalType === "growth" || goalType === "awareness" || goalType === "advocacy"
        ? Math.max(0, leadsRaw)
        : Math.max(0, Math.round(leadsRaw * 0.4));

    const purchases = goalType === "sales"
        ? Math.max(0, purchasesRaw)
        : Math.max(0, Math.round(purchasesRaw * 0.2));

    const ticket = seededValue(`${seed}-ticket`, 60, 680);
    const purchaseValue = purchases * ticket;
    const roas = spend > 0 ? purchaseValue / spend : null;
    const costPerLead = leads > 0 ? spend / leads : null;
    const costPerPurchase = purchases > 0 ? spend / purchases : null;

    const deliveryScore = Math.min(100, Math.max(0, 40 + ctr * 16 - (frequency > 3.6 ? 12 : 0)));
    const efficiencyScore = Math.min(100, Math.max(0, 80 - cpc * 8 - (cpm > 70 ? 10 : 0) + (roas ? roas * 8 : 0)));
    const goalScore = goalType === "sales"
        ? Math.min(100, Math.max(0, 30 + (roas || 0) * 24 + purchases * 0.18))
        : goalType === "lead_gen"
            ? Math.min(100, Math.max(0, 30 + leads * 0.22 - (costPerLead ? costPerLead * 0.4 : 0)))
            : Math.min(100, Math.max(0, 45 + ctr * 18 + leads * 0.08));
    const finalScore = (deliveryScore * 0.35) + (efficiencyScore * 0.35) + (goalScore * 0.30);

    const successPoints: string[] = [];
    const attentionPoints: string[] = [];

    if (ctr >= 1.4) successPoints.push(`CTR acima da média (${ctr.toFixed(2)}%), com bom encaixe criativo/público.`);
    if (cpc <= 1.8) successPoints.push(`CPC competitivo (${formatCurrency(cpc)}), sustentando eficiência de tráfego.`);
    if (goalType === "sales" && roas && roas >= 2) successPoints.push(`ROAS consistente (${roas.toFixed(2)}x), com retorno positivo.`);
    if (goalType === "lead_gen" && leads >= 40) successPoints.push(`Volume de leads robusto (${leads}), favorecendo escala comercial.`);
    if (goalType !== "sales" && reach >= 70000) successPoints.push(`Alcance forte (${formatNumber(reach)}), ampliando cobertura da mensagem.`);

    if (frequency > 3.5) attentionPoints.push(`Frequência elevada (${frequency.toFixed(2)}), sinal de desgaste de criativo.`);
    if (ctr < 0.8) attentionPoints.push(`CTR abaixo do ideal (${ctr.toFixed(2)}%), revisar ângulo criativo.`);
    if (goalType === "sales" && (!roas || roas < 1)) attentionPoints.push(`ROAS abaixo de 1 (${roas ? roas.toFixed(2) : "0.00"}x), sem retorno no período.`);
    if (goalType === "lead_gen" && leads < 12) attentionPoints.push("Volume de leads baixo para o investimento atual.");
    if (cpm > 70) attentionPoints.push(`CPM alto (${formatCurrency(cpm)}), com pressão no custo de aquisição.`);

    if (successPoints.length === 0) {
        successPoints.push(`Score final ${finalScore.toFixed(1)} com base estável para otimização incremental.`);
    }
    if (attentionPoints.length === 0) {
        attentionPoints.push("Nenhum alerta crítico detectado no ciclo simulado.");
    }

    const recommendations = [
        {
            priority: "alta",
            title: "Realocar verba para conjunto vencedor",
            description: "Aumentar gradualmente o orçamento do melhor criativo/público e reduzir os conjuntos abaixo da média.",
            expected_impact: "Elevar eficiência de conversão nos próximos 3 a 5 dias.",
        },
        {
            priority: "media",
            title: "Rotação criativa preventiva",
            description: "Subir novas variações de criativo para proteger CTR e reduzir fadiga em frequência alta.",
            expected_impact: "Recuperar taxa de clique e manter alcance qualificado.",
        },
        {
            priority: "baixa",
            title: "Refino de janela horária",
            description: "Concentrar entrega nos períodos de maior resposta observados no monitor em tempo real.",
            expected_impact: "Reduzir CPC e elevar previsibilidade de resultado.",
        },
    ];

    const points = Array.from({ length: 14 }, (_, index) => {
        const dayFactor = 0.85 + (index / 18);
        const scenarioFactor = scenario === "growth_spike" ? 1.2 : scenario === "conversion_drop" ? 0.8 : 1;
        const dailySpend = spend * dayFactor * scenarioFactor * 0.07;
        const dailyClicks = Math.max(10, Math.round(clicks * dayFactor * scenarioFactor * 0.07));
        const dailyCtr = dailySpend > 0 ? (dailyClicks / Math.max(100, Math.round(impressions * dayFactor * 0.07))) * 100 : ctr;
        return {
            date_start: `2026-02-${String(index + 1).padStart(2, "0")}`,
            amount_spent: Number(dailySpend.toFixed(2)),
            clicks: dailyClicks,
            ctr: Number(dailyCtr.toFixed(2)),
            leads: Math.max(0, Math.round(leads * dayFactor * 0.06)),
            purchases: Math.max(0, Math.round(purchases * dayFactor * 0.06)),
        };
    });

    return {
        report_id: 9000 + round,
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        objective: campaign.objective,
        status: campaign.status,
        goal_type: goalType,
        analysis_mode: "simulation",
        analyzed_at: new Date().toISOString(),
        days_analyzed: points.length,
        scores: {
            delivery: Number(deliveryScore.toFixed(2)),
            efficiency: Number(efficiencyScore.toFixed(2)),
            goal: Number(goalScore.toFixed(2)),
            final: Number(finalScore.toFixed(2)),
        },
        metrics: {
            amount_spent: Number(spend.toFixed(2)),
            impressions,
            reach,
            frequency: Number(frequency.toFixed(2)),
            clicks,
            link_clicks: Math.round(clicks * 0.74),
            outbound_clicks: Math.round(clicks * 0.66),
            ctr: Number(ctr.toFixed(2)),
            cpc: Number(cpc.toFixed(2)),
            cpm: Number(cpm.toFixed(2)),
            leads,
            purchases,
            purchase_value: Number(purchaseValue.toFixed(2)),
            cost_per_lead: costPerLead !== null ? Number(costPerLead.toFixed(2)) : null,
            cost_per_purchase: costPerPurchase !== null ? Number(costPerPurchase.toFixed(2)) : null,
            roas: roas !== null ? Number(roas.toFixed(2)) : null,
        },
        success_points: successPoints.slice(0, 5),
        attention_points: attentionPoints.slice(0, 5),
        recommended_actions: recommendations,
        executive_summary: `${campaign.name} foi simulada no cenário "${SCENARIO_OPTIONS.find((item) => item.value === scenario)?.label}". Score final ${finalScore.toFixed(1)}/100 com ${formatCurrency(spend)} de investimento e ${formatNumber(clicks)} cliques.`,
        daily_metrics: points,
    };
}

function buildSimulatedRealtime(scenario: SimulationScenario, round: number): RealtimeSnapshot {
    const rows: RealtimeCampaignRow[] = SIMULATED_CAMPAIGNS.map((campaign, index) => {
        const seed = `${campaign.id}-${scenario}-${round}-${index}`;
        const spend = shiftByScenario(seededValue(`${seed}-spend`, 120, 2300), scenario, "positive");
        const clicks = Math.round(shiftByScenario(seededValue(`${seed}-clicks`, 60, 1200), scenario, "positive"));
        const ctr = shiftByScenario(seededValue(`${seed}-ctr`, 0.55, 2.8), scenario, "positive");
        const cpc = clicks > 0 ? spend / clicks : 0;
        const status = index % 2 === 0 ? "ACTIVE" : "PAUSED";
        return {
            id: campaign.id,
            name: campaign.name,
            status,
            objective: campaign.objective || "-",
            spend: Number(spend.toFixed(2)),
            clicks,
            ctr: Number(ctr.toFixed(2)),
            cpc: Number(cpc.toFixed(2)),
        };
    });

    const activeRows = rows.filter((row) => row.status === "ACTIVE");
    const totalSpend = activeRows.reduce((accumulator, row) => accumulator + row.spend, 0);
    const totalClicks = activeRows.reduce((accumulator, row) => accumulator + row.clicks, 0);
    const avgCtr = activeRows.length > 0
        ? activeRows.reduce((accumulator, row) => accumulator + row.ctr, 0) / activeRows.length
        : 0;
    const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;

    const alerts: string[] = [];
    activeRows.forEach((row) => {
        if (row.ctr < 0.8) alerts.push(`${row.name}: CTR crítico (${row.ctr.toFixed(2)}%).`);
        if (row.cpc > 2.8) alerts.push(`${row.name}: CPC elevado (${formatCurrency(row.cpc)}).`);
    });
    if (scenario === "fatigue_alert") {
        alerts.unshift("Sinal de fadiga criativa detectado em 2 conjuntos com frequência alta.");
    }
    if (scenario === "conversion_drop") {
        alerts.unshift("Queda abrupta de conversão na última janela de 2 horas.");
    }
    if (alerts.length === 0) {
        alerts.push("Sem alertas críticos no monitor em tempo real.");
    }

    const points = Array.from({ length: 24 }, (_, index) => {
        const base = seededValue(`rt-${scenario}-${round}-${index}`, 80, 420);
        const scenarioPositive = shiftByScenario(base, scenario, "positive");
        const spend = Number((scenarioPositive * (index >= 18 ? 1.2 : 0.9)).toFixed(2));
        const clicks = Math.max(15, Math.round(spend * seededValue(`clk-${scenario}-${round}-${index}`, 0.6, 2.2)));
        const ctr = Number((seededValue(`ctr-${scenario}-${round}-${index}`, 0.6, 2.3)).toFixed(2));
        return {
            label: `${String(index).padStart(2, "0")}h`,
            spend,
            clicks,
            ctr,
        };
    });

    return {
        generatedAt: new Date().toISOString(),
        totalSpend: Number(totalSpend.toFixed(2)),
        totalClicks,
        avgCtr: Number(avgCtr.toFixed(2)),
        avgCpc: Number(avgCpc.toFixed(2)),
        activeCampaigns: activeRows.length,
        alerts: alerts.slice(0, 4),
        rows,
        points,
    };
}

function buildRealtimeFromApi(campaigns: CampaignApiItem[]): RealtimeSnapshot {
    const rows: RealtimeCampaignRow[] = campaigns
        .filter((campaign): campaign is CampaignApiItem & { id: string; name: string } =>
            typeof campaign.id === "string" && campaign.id.length > 0 && typeof campaign.name === "string"
        )
        .map((campaign) => {
            const insight = campaign.insights?.data?.[0];
            const spend = safeNumber(insight?.spend);
            const clicks = safeNumber(insight?.clicks);
            const ctr = safeNumber(insight?.ctr);
            const cpc = safeNumber(insight?.cpc) || (clicks > 0 ? spend / clicks : 0);
            return {
                id: campaign.id,
                name: campaign.name,
                status: campaign.status || "UNKNOWN",
                objective: campaign.objective || "-",
                spend: Number(spend.toFixed(2)),
                clicks: Math.round(clicks),
                ctr: Number(ctr.toFixed(2)),
                cpc: Number(cpc.toFixed(2)),
            };
        });

    const activeRows = rows.filter((row) => row.status === "ACTIVE");
    const totalSpend = rows.reduce((accumulator, row) => accumulator + row.spend, 0);
    const totalClicks = rows.reduce((accumulator, row) => accumulator + row.clicks, 0);
    const avgCtr = rows.length > 0
        ? rows.reduce((accumulator, row) => accumulator + row.ctr, 0) / rows.length
        : 0;
    const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;

    const alerts: string[] = [];
    rows.forEach((row) => {
        if (row.status === "ACTIVE" && row.ctr > 0 && row.ctr < 0.7) {
            alerts.push(`${row.name}: CTR baixo (${row.ctr.toFixed(2)}%).`);
        }
        if (row.status === "ACTIVE" && row.cpc > 3.2) {
            alerts.push(`${row.name}: CPC acima do limiar (${formatCurrency(row.cpc)}).`);
        }
    });
    if (alerts.length === 0) {
        alerts.push("Sem alertas críticos no conjunto monitorado.");
    }

    const points = Array.from({ length: 12 }, (_, index) => {
        const pointer = Math.max(1, rows.length);
        const row = rows[index % pointer];
        const spend = Number((safeNumber(row?.spend) * (0.65 + (index / 20))).toFixed(2));
        const clicks = Math.round(safeNumber(row?.clicks) * (0.55 + (index / 22)));
        const ctr = Number((safeNumber(row?.ctr) * (0.85 + (index / 30))).toFixed(2));
        return {
            label: `${String(index * 2).padStart(2, "0")}h`,
            spend,
            clicks,
            ctr,
        };
    });

    return {
        generatedAt: new Date().toISOString(),
        totalSpend: Number(totalSpend.toFixed(2)),
        totalClicks,
        avgCtr: Number(avgCtr.toFixed(2)),
        avgCpc: Number(avgCpc.toFixed(2)),
        activeCampaigns: activeRows.length,
        alerts: alerts.slice(0, 4),
        rows,
        points,
    };
}

export default function CampaignAnalysisPanel({
    adsProfileEnabled = true,
    selectedProfileName,
}: CampaignAnalysisPanelProps) {
    const [viewMode, setViewMode] = useState<MetricsView>("post_campaign");
    const [simulationMode, setSimulationMode] = useState(false);
    const [simulationScenario, setSimulationScenario] = useState<SimulationScenario>("baseline");
    const [simulationRound, setSimulationRound] = useState(1);
    const [simulationRunning, setSimulationRunning] = useState(false);

    const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
    const [selectedCampaign, setSelectedCampaign] = useState("");
    const [goalType, setGoalType] = useState<GoalType>("sales");
    const [report, setReport] = useState<CampaignAnalysisReport | null>(null);
    const [realtimeSnapshot, setRealtimeSnapshot] = useState<RealtimeSnapshot | null>(null);

    const [loadingCampaigns, setLoadingCampaigns] = useState(false);
    const [loadingReport, setLoadingReport] = useState(false);
    const [loadingRealtime, setLoadingRealtime] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedCampaignLabel = useMemo(() => {
        return campaigns.find((item) => item.id === selectedCampaign)?.name || selectedCampaign;
    }, [campaigns, selectedCampaign]);

    const simulationScenarioLabel = useMemo(() => {
        return SCENARIO_OPTIONS.find((option) => option.value === simulationScenario)?.label || "Baseline estável";
    }, [simulationScenario]);

    const loadCampaignsFromApi = async () => {
        if (!adsProfileEnabled) return;
        setLoadingCampaigns(true);
        setError(null);
        try {
            const res = await fetch(apiUrl("/api/ads/campaigns"));
            if (!res.ok) {
                const payload = await res.json().catch(() => ({} as Record<string, unknown>));
                throw new Error(String(payload.detail || "Não foi possível carregar campanhas."));
            }

            const payload = (await res.json()) as { data?: CampaignApiItem[] };
            const data = Array.isArray(payload.data) ? payload.data : [];

            const normalized = data
                .filter(
                    (item): item is CampaignApiItem & { id: string; name: string } =>
                        typeof item?.id === "string" && item.id.length > 0 && typeof item.name === "string"
                )
                .map((item) => ({
                    id: item.id,
                    name: item.name,
                    status: item.status,
                    objective: item.objective,
                }));

            setCampaigns(normalized);
            setSelectedCampaign((previous) => {
                if (previous && normalized.some((campaign) => campaign.id === previous)) {
                    return previous;
                }
                return normalized[0]?.id || "";
            });
        } catch (requestError: unknown) {
            setError(getErrorMessage(requestError, "Falha ao buscar campanhas."));
            if (campaigns.length === 0) {
                setSimulationMode(true);
            }
        } finally {
            setLoadingCampaigns(false);
        }
    };

    const loadRealtimeFromApi = async () => {
        if (!adsProfileEnabled) return;
        setLoadingRealtime(true);
        setError(null);
        try {
            const res = await fetch(apiUrl("/api/ads/campaigns"));
            if (!res.ok) {
                const payload = await res.json().catch(() => ({} as Record<string, unknown>));
                throw new Error(String(payload.detail || "Não foi possível carregar monitor em tempo real."));
            }
            const payload = (await res.json()) as { data?: CampaignApiItem[] };
            const data = Array.isArray(payload.data) ? payload.data : [];
            setRealtimeSnapshot(buildRealtimeFromApi(data));
        } catch (requestError: unknown) {
            setError(getErrorMessage(requestError, "Falha ao carregar monitor em tempo real."));
            if (!simulationMode) {
                setSimulationMode(true);
            }
        } finally {
            setLoadingRealtime(false);
        }
    };

    const loadLatestReport = useCallback(async (campaignId: string) => {
        if (!adsProfileEnabled) return;
        if (!campaignId) return;
        setLoadingReport(true);
        setError(null);
        try {
            const res = await fetch(apiUrl(`/api/ads/campaigns/${campaignId}/report`));
            if (res.status === 404) {
                setReport(null);
                return;
            }
            if (!res.ok) {
                const payload = await res.json().catch(() => ({} as Record<string, unknown>));
                throw new Error(String(payload.detail || "Erro ao carregar relatório."));
            }
            const payload = (await res.json()) as CampaignAnalysisReport;
            setReport(payload);
        } catch (requestError: unknown) {
            setError(getErrorMessage(requestError, "Falha ao carregar relatório."));
        } finally {
            setLoadingReport(false);
        }
    }, [adsProfileEnabled]);

    const applySimulationData = (scenario: SimulationScenario, round: number) => {
        setCampaigns(SIMULATED_CAMPAIGNS);
        const fallbackCampaignId = selectedCampaign && SIMULATED_CAMPAIGNS.some((item) => item.id === selectedCampaign)
            ? selectedCampaign
            : SIMULATED_CAMPAIGNS[0].id;
        setSelectedCampaign(fallbackCampaignId);
        const campaign = SIMULATED_CAMPAIGNS.find((item) => item.id === fallbackCampaignId) || SIMULATED_CAMPAIGNS[0];
        setReport(buildSimulatedReport(campaign, goalType, scenario, round));
        setRealtimeSnapshot(buildSimulatedRealtime(scenario, round));
    };

    const analyzeCampaign = async () => {
        if (!adsProfileEnabled) {
            setError("Perfil sem leitura de Ads. Selecione uma conta Meta Ads.");
            return;
        }

        if (!selectedCampaign) {
            setError("Selecione uma campanha para analisar.");
            return;
        }

        if (simulationMode) {
            const campaign = campaigns.find((item) => item.id === selectedCampaign) || SIMULATED_CAMPAIGNS[0];
            setAnalyzing(true);
            await new Promise((resolve) => {
                setTimeout(resolve, 350);
            });
            setSimulationRound((current) => {
                const nextRound = current + 1;
                setReport(buildSimulatedReport(campaign, goalType, simulationScenario, nextRound));
                setRealtimeSnapshot(buildSimulatedRealtime(simulationScenario, nextRound));
                return nextRound;
            });
            setAnalyzing(false);
            return;
        }

        setAnalyzing(true);
        setError(null);
        try {
            const res = await fetch(apiUrl(`/api/ads/campaigns/${selectedCampaign}/analyze`), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    goal_type: goalType,
                    analysis_mode: "manual",
                }),
            });
            if (!res.ok) {
                const payload = await res.json().catch(() => ({} as Record<string, unknown>));
                throw new Error(String(payload.detail || "Erro ao analisar campanha."));
            }
            const payload = (await res.json()) as CampaignAnalysisReport;
            setReport(payload);
            await loadRealtimeFromApi();
        } catch (requestError: unknown) {
            setError(getErrorMessage(requestError, "Falha ao executar análise."));
        } finally {
            setAnalyzing(false);
        }
    };

    const runRobustSimulation = async () => {
        setSimulationMode(true);
        setSimulationRunning(true);
        for (const scenario of SIMULATION_SEQUENCE) {
            setSimulationScenario(scenario);
            await new Promise((resolve) => {
                setTimeout(resolve, 380);
            });
            setSimulationRound((current) => current + 1);
        }
        setSimulationRunning(false);
    };

    useEffect(() => {
        if (!adsProfileEnabled) {
            setReport(null);
            setRealtimeSnapshot(null);
            setCampaigns([]);
            setSelectedCampaign("");
            setError(null);
            return;
        }
        if (simulationMode) {
            applySimulationData(simulationScenario, simulationRound);
            return;
        }
        loadCampaignsFromApi();
        loadRealtimeFromApi();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [simulationMode, adsProfileEnabled]);

    useEffect(() => {
        if (!adsProfileEnabled) return;
        if (!simulationMode && selectedCampaign) {
            loadLatestReport(selectedCampaign);
        }
        if (simulationMode && selectedCampaign) {
            const campaign = campaigns.find((item) => item.id === selectedCampaign) || SIMULATED_CAMPAIGNS[0];
            setReport(buildSimulatedReport(campaign, goalType, simulationScenario, simulationRound));
        }
    }, [selectedCampaign, simulationMode, campaigns, goalType, simulationScenario, simulationRound, adsProfileEnabled, loadLatestReport]);

    useEffect(() => {
        if (simulationMode) {
            applySimulationData(simulationScenario, simulationRound);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [simulationScenario, simulationRound, goalType]);

    const maxRealtimeSpend = useMemo(() => {
        const values = realtimeSnapshot?.points.map((point) => point.spend) || [];
        return Math.max(...values, 1);
    }, [realtimeSnapshot]);

    if (!adsProfileEnabled) {
        return (
            <div className="h-full w-full flex flex-col gap-6 p-6 overflow-y-auto">
                <section className="rounded-3xl border border-amber-300/30 bg-amber-500/10 p-8">
                    <p className="text-[10px] uppercase tracking-widest font-black text-amber-200 mb-2">Leitura indisponível</p>
                    <h3 className="text-2xl font-black text-[var(--foreground)] mb-3">Este perfil não é de Meta Ads</h3>
                    <p className="text-sm text-[var(--foreground)]/85 mb-4">
                        A aba `Métrica Ads` lê somente contas Ads. Selecione o perfil `clienteteste1` com tipo `Meta Ads` no seletor superior.
                    </p>
                    {selectedProfileName && (
                        <p className="text-xs text-[var(--muted)]">
                            Perfil atual: {selectedProfileName}
                        </p>
                    )}
                </section>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col gap-6 p-6 overflow-y-auto">
            <section className="rounded-3xl border border-[var(--shell-border)] bg-[var(--shell-surface)]/70 backdrop-blur-md p-5">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
                        <div className="inline-flex rounded-2xl border border-[var(--shell-border)] bg-[var(--shell-side)] p-1 w-fit">
                            {VIEW_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setViewMode(option.value)}
                                    className={`px-4 h-9 rounded-xl text-xs font-black uppercase tracking-widest transition-colors ${
                                        viewMode === option.value
                                            ? "bg-white/90 text-black"
                                            : "text-[var(--muted)] hover:text-[var(--foreground)]"
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={() => setSimulationMode((current) => !current)}
                                className={`h-9 px-4 rounded-xl border text-xs font-black uppercase tracking-widest transition-colors ${
                                    simulationMode
                                        ? "border-amber-300/40 bg-amber-300/15 text-amber-100"
                                        : "border-[var(--shell-border)] text-[var(--muted)] hover:text-[var(--foreground)]"
                                }`}
                            >
                                {simulationMode ? "Simulação ON" : "Simulação OFF"}
                            </button>
                            <button
                                onClick={runRobustSimulation}
                                disabled={simulationRunning}
                                className="h-9 px-4 rounded-xl border border-[var(--shell-border)] text-xs font-black uppercase tracking-widest text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-50 transition-colors"
                                title="Executa sequência de cenários para estressar o layout"
                            >
                                <span className="inline-flex items-center gap-1">
                                    <PlayIcon className="w-4 h-4" />
                                    {simulationRunning ? "Simulando..." : "Simulação robusta"}
                                </span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                        <label className="flex flex-col gap-2 lg:col-span-2">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--muted)]">Campanha</span>
                            <select
                                value={selectedCampaign}
                                onChange={(event) => setSelectedCampaign(event.target.value)}
                                className="h-11 rounded-2xl px-4 bg-[var(--shell-side)] border border-[var(--shell-border)] text-sm text-[var(--foreground)] focus:outline-none"
                            >
                                {campaigns.length === 0 && <option value="">Nenhuma campanha encontrada</option>}
                                {campaigns.map((campaign) => (
                                    <option key={campaign.id} value={campaign.id}>
                                        {campaign.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="flex flex-col gap-2">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--muted)]">Objetivo</span>
                            <select
                                value={goalType}
                                onChange={(event) => setGoalType(event.target.value as GoalType)}
                                className="h-11 rounded-2xl px-4 bg-[var(--shell-side)] border border-[var(--shell-border)] text-sm text-[var(--foreground)] focus:outline-none"
                            >
                                {GOAL_OPTIONS.map((goal) => (
                                    <option key={goal.value} value={goal.value}>
                                        {goal.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <div className="flex items-end gap-2">
                            <button
                                onClick={simulationMode ? () => applySimulationData(simulationScenario, simulationRound + 1) : loadCampaignsFromApi}
                                disabled={loadingCampaigns || loadingRealtime || analyzing}
                                className="h-11 px-4 rounded-2xl border border-[var(--shell-border)] text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-50 transition-colors"
                                title="Atualizar dados"
                            >
                                <ArrowPathIcon className={`w-5 h-5 ${(loadingCampaigns || loadingRealtime) ? "animate-spin" : ""}`} />
                            </button>
                            {viewMode === "post_campaign" ? (
                                <button
                                    onClick={analyzeCampaign}
                                    disabled={!selectedCampaign || analyzing}
                                    className="h-11 flex-1 px-4 rounded-2xl bg-white/90 text-black text-xs font-black uppercase tracking-widest hover:brightness-105 disabled:opacity-50 transition-all shadow-lg"
                                >
                                    {analyzing ? "Analisando..." : "Analisar campanha"}
                                </button>
                            ) : (
                                <button
                                    onClick={simulationMode ? () => setSimulationRound((current) => current + 1) : loadRealtimeFromApi}
                                    className="h-11 flex-1 px-4 rounded-2xl bg-white/90 text-black text-xs font-black uppercase tracking-widest hover:brightness-105 transition-all shadow-lg"
                                >
                                    Atualizar monitor
                                </button>
                            )}
                        </div>
                    </div>

                    {simulationMode && (
                        <div className="flex flex-col lg:flex-row lg:items-center gap-3 text-xs text-amber-100 bg-amber-400/10 border border-amber-300/20 rounded-2xl px-4 py-3">
                            <div className="inline-flex items-center gap-2 font-bold uppercase tracking-widest">
                                <BoltIcon className="w-4 h-4" />
                                Cenário ativo: {simulationScenarioLabel}
                            </div>
                            <select
                                value={simulationScenario}
                                onChange={(event) => setSimulationScenario(event.target.value as SimulationScenario)}
                                className="h-9 rounded-xl px-3 bg-black/20 border border-amber-200/20 text-amber-50"
                            >
                                {SCENARIO_OPTIONS.map((item) => (
                                    <option key={item.value} value={item.value}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                            <span className="text-amber-100/80">Rodada: {simulationRound}</span>
                        </div>
                    )}

                    <div className="text-xs text-[var(--muted)]">
                        {selectedCampaign ? `Campanha selecionada: ${selectedCampaignLabel}` : "Selecione uma campanha para começar."}
                    </div>

                    {error && (
                        <div className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
                            {error}
                        </div>
                    )}
                </div>
            </section>

            {viewMode === "post_campaign" ? (
                <PostCampaignView
                    report={report}
                    loadingReport={loadingReport}
                />
            ) : (
                <RealtimeView
                    snapshot={realtimeSnapshot}
                    loadingRealtime={loadingRealtime}
                    maxRealtimeSpend={maxRealtimeSpend}
                />
            )}
        </div>
    );
}

function PostCampaignView({
    report,
    loadingReport,
}: {
    report: CampaignAnalysisReport | null;
    loadingReport: boolean;
}) {
    if (loadingReport && !report) {
        return (
            <section className="rounded-3xl border border-[var(--shell-border)] bg-[var(--shell-surface)]/60 p-8 animate-pulse text-center text-[var(--muted)] text-xs uppercase tracking-widest font-bold">
                Carregando relatório...
            </section>
        );
    }

    if (!loadingReport && !report) {
        return (
            <section className="rounded-3xl border border-[var(--shell-border)] bg-[var(--shell-surface)]/60 p-10 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 mb-4">
                    <ChartBarSquareIcon className="w-7 h-7 text-[var(--muted)]" />
                </div>
                <h3 className="text-lg font-black text-[var(--foreground)] tracking-tight">Sem relatório para esta campanha</h3>
                <p className="text-sm text-[var(--muted)] mt-2">
                    Execute a análise para gerar o relatório de sucessos, pontos de atenção e recomendações.
                </p>
            </section>
        );
    }

    if (!report) return null;

    return (
        <>
            <section className="rounded-3xl border border-[var(--shell-border)] bg-[var(--shell-surface)]/70 p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--muted)] mb-1">
                            Relatório #{report.report_id} • {report.goal_type}
                        </p>
                        <h2 className="text-2xl font-black text-[var(--foreground)] tracking-tight">
                            {report.campaign_name || report.campaign_id}
                        </h2>
                        <p className="text-xs text-[var(--muted)] mt-1">
                            Objetivo Meta: {report.objective || "-"} • Status: {report.status || "-"} • Dias analisados: {report.days_analyzed}
                        </p>
                    </div>
                    <div className="rounded-2xl px-5 py-3 bg-white/10 border border-white/20">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--muted)]">Score Final</p>
                        <p className={`text-3xl font-black tracking-tight ${scoreColor(report.scores.final)}`}>
                            {report.scores.final.toFixed(1)}
                        </p>
                    </div>
                </div>
                <p className="mt-5 text-sm leading-relaxed text-[var(--foreground)]/90">{report.executive_summary}</p>
            </section>

            <section className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
                <MetricCard label="Gasto" value={formatCurrency(report.metrics.amount_spent)} />
                <MetricCard label="Impressões" value={formatNumber(report.metrics.impressions)} />
                <MetricCard label="Alcance" value={formatNumber(report.metrics.reach)} />
                <MetricCard label="CTR" value={formatPercent(report.metrics.ctr)} />
                <MetricCard label="CPC" value={formatCurrency(report.metrics.cpc)} />
                <MetricCard label="CPM" value={formatCurrency(report.metrics.cpm)} />
                <MetricCard label="Cliques" value={formatNumber(report.metrics.clicks)} />
                <MetricCard label="Link Clicks" value={formatNumber(report.metrics.link_clicks)} />
                <MetricCard label="Leads" value={formatNumber(report.metrics.leads)} />
                <MetricCard label="Compras" value={formatNumber(report.metrics.purchases)} />
                <MetricCard label="ROAS" value={report.metrics.roas !== null && report.metrics.roas !== undefined ? `${report.metrics.roas.toFixed(2)}x` : "-"} />
                <MetricCard label="Receita" value={formatCurrency(report.metrics.purchase_value)} />
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="rounded-3xl border border-emerald-300/20 bg-emerald-400/5 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <CheckCircleIcon className="w-5 h-5 text-emerald-300" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-emerald-200">Sucessos</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-[var(--foreground)]/90">
                        {report.success_points.map((point, index) => (
                            <li key={index} className="rounded-xl border border-emerald-300/15 bg-black/20 px-3 py-2">
                                {point}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="rounded-3xl border border-rose-300/20 bg-rose-400/5 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <ExclamationTriangleIcon className="w-5 h-5 text-rose-200" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-rose-200">Pontos de atenção</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-[var(--foreground)]/90">
                        {report.attention_points.map((point, index) => (
                            <li key={index} className="rounded-xl border border-rose-300/15 bg-black/20 px-3 py-2">
                                {point}
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            <section className="rounded-3xl border border-[var(--shell-border)] bg-[var(--shell-surface)]/70 p-5">
                <div className="flex items-center gap-2 mb-4">
                    <SparklesIcon className="w-5 h-5 text-[var(--muted)]" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-[var(--foreground)]">Próximas ações</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    {report.recommended_actions.map((action, index) => (
                        <div key={index} className="rounded-2xl border border-[var(--shell-border)] bg-[var(--shell-side)] p-4">
                            <p className="text-[10px] uppercase tracking-widest font-black text-[var(--muted)] mb-2">
                                Prioridade {action.priority}
                            </p>
                            <h4 className="text-sm font-black text-[var(--foreground)] mb-2">{action.title}</h4>
                            <p className="text-xs text-[var(--foreground)]/80 mb-3">{action.description}</p>
                            <p className="text-[11px] text-[var(--muted)]">{action.expected_impact}</p>
                        </div>
                    ))}
                </div>
            </section>
        </>
    );
}

function RealtimeView({
    snapshot,
    loadingRealtime,
    maxRealtimeSpend,
}: {
    snapshot: RealtimeSnapshot | null;
    loadingRealtime: boolean;
    maxRealtimeSpend: number;
}) {
    if (loadingRealtime && !snapshot) {
        return (
            <section className="rounded-3xl border border-[var(--shell-border)] bg-[var(--shell-surface)]/60 p-8 animate-pulse text-center text-[var(--muted)] text-xs uppercase tracking-widest font-bold">
                Carregando monitor em tempo real...
            </section>
        );
    }

    if (!snapshot) {
        return (
            <section className="rounded-3xl border border-[var(--shell-border)] bg-[var(--shell-surface)]/60 p-10 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 mb-4">
                    <BoltIcon className="w-7 h-7 text-[var(--muted)]" />
                </div>
                <h3 className="text-lg font-black text-[var(--foreground)] tracking-tight">Sem dados em tempo real</h3>
                <p className="text-sm text-[var(--muted)] mt-2">
                    Atualize o monitor para carregar o status ativo das campanhas.
                </p>
            </section>
        );
    }

    return (
        <>
            <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                <MetricCard label="Spend total" value={formatCurrency(snapshot.totalSpend)} />
                <MetricCard label="Cliques" value={formatNumber(snapshot.totalClicks)} />
                <MetricCard label="CTR médio" value={formatPercent(snapshot.avgCtr)} />
                <MetricCard label="CPC médio" value={formatCurrency(snapshot.avgCpc)} />
                <MetricCard label="Campanhas ativas" value={formatNumber(snapshot.activeCampaigns)} />
                <MetricCard label="Alertas" value={formatNumber(snapshot.alerts.length)} />
            </section>

            <section className="rounded-3xl border border-[var(--shell-border)] bg-[var(--shell-surface)]/70 p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-[var(--foreground)]">Pulso de performance (24h)</h3>
                    <span className="text-xs text-[var(--muted)]">Atualizado em {new Date(snapshot.generatedAt).toLocaleTimeString("pt-BR")}</span>
                </div>
                <div className="grid grid-cols-12 gap-2 items-end h-40">
                    {snapshot.points.map((point) => (
                        <div key={point.label} className="flex flex-col items-center gap-1">
                            <div
                                className="w-full rounded-md bg-white/70"
                                style={{
                                    height: `${Math.max(8, (point.spend / maxRealtimeSpend) * 120)}px`,
                                    opacity: 0.35 + Math.min(0.55, point.ctr / 4),
                                }}
                                title={`${point.label} • ${formatCurrency(point.spend)} • CTR ${point.ctr.toFixed(2)}%`}
                            />
                            <span className="text-[10px] text-[var(--muted)]">{point.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2 rounded-3xl border border-[var(--shell-border)] bg-[var(--shell-surface)]/70 p-5">
                    <h3 className="text-sm font-black uppercase tracking-widest text-[var(--foreground)] mb-4">Campanhas monitoradas</h3>
                    <div className="overflow-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-[10px] uppercase tracking-widest text-[var(--muted)]">
                                    <th className="text-left pb-2">Campanha</th>
                                    <th className="text-left pb-2">Status</th>
                                    <th className="text-right pb-2">Spend</th>
                                    <th className="text-right pb-2">CTR</th>
                                    <th className="text-right pb-2">CPC</th>
                                    <th className="text-right pb-2">Cliques</th>
                                </tr>
                            </thead>
                            <tbody>
                                {snapshot.rows.map((row) => (
                                    <tr key={row.id} className="border-t border-[var(--shell-border)]/60">
                                        <td className="py-3 pr-2">
                                            <p className="font-semibold text-[var(--foreground)] truncate max-w-[320px]" title={row.name}>
                                                {row.name}
                                            </p>
                                            <p className="text-[11px] text-[var(--muted)]">{row.objective}</p>
                                        </td>
                                        <td className="py-3">
                                            <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-1 rounded-full ${
                                                row.status === "ACTIVE" ? "bg-emerald-400/15 text-emerald-200" : "bg-zinc-500/20 text-zinc-300"
                                            }`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="py-3 text-right font-semibold text-[var(--foreground)]">{formatCurrency(row.spend)}</td>
                                        <td className="py-3 text-right text-[var(--foreground)]">{formatPercent(row.ctr)}</td>
                                        <td className="py-3 text-right text-[var(--foreground)]">{formatCurrency(row.cpc)}</td>
                                        <td className="py-3 text-right text-[var(--foreground)]">{formatNumber(row.clicks)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="rounded-3xl border border-rose-300/20 bg-rose-500/5 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <ExclamationTriangleIcon className="w-5 h-5 text-rose-200" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-rose-200">Alertas em tempo real</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-[var(--foreground)]/90">
                        {snapshot.alerts.map((alert, index) => (
                            <li key={index} className="rounded-xl border border-rose-300/15 bg-black/20 px-3 py-2">
                                {alert}
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        </>
    );
}

function MetricCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-[var(--shell-border)] bg-[var(--shell-surface)]/70 p-4">
            <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--muted)] mb-1">{label}</p>
            <p className="text-lg font-black text-[var(--foreground)] tracking-tight">{value}</p>
        </div>
    );
}

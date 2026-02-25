"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";

interface DashboardData {
    client: {
        id: string;
        name: string;
        email: string;
    };
    summary: {
        total_campaigns: number;
        active_campaigns: number;
        paused_campaigns: number;
        total_spend: number;
        total_impressions: number;
        total_clicks: number;
        total_conversions: number;
        avg_ctr: number;
        avg_cpc: number;
    };
    ad_accounts: any[];
    recent_campaigns: any[];
}

export default function Dashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [clientId, setClientId] = useState<string | null>(null);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            // Verificar se está autenticado
            const storedClientId = localStorage.getItem('bstudio_client_id');
            
            if (!storedClientId) {
                // Redirecionar para login/OAuth
                window.location.href = '/auth/facebook';
                return;
            }

            setClientId(storedClientId);

            // Verificar status da autenticação
            const res = await fetch(apiUrl(`/auth/status?client_id=${storedClientId}`));
            const data = await res.json();

            if (data.authorized) {
                setAuthorized(true);
                loadDashboard(storedClientId);
            } else {
                window.location.href = '/auth/facebook';
            }
        } catch (error) {
            console.error("Auth error:", error);
            window.location.href = '/auth/facebook';
        }
    };

    const loadDashboard = async (clientId: string) => {
        try {
            setLoading(true);
            const res = await fetch(apiUrl(`/dashboard?client_id=${clientId}`));
            const data = await res.json();
            setDashboard(data);
        } catch (error) {
            console.error("Dashboard error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleConnectFacebook = () => {
        window.location.href = '/auth/facebook';
    };

    const handleCreateCampaign = () => {
        router.push('/dashboard/campaigns/new');
    };

    const handleLogout = () => {
        localStorage.removeItem('bstudio_client_id');
        window.location.href = '/';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-[var(--foreground)]/20 border-t-[var(--foreground)] rounded-full animate-spin mx-auto" />
                    <p className="text-[var(--muted)] font-semibold">Carregando dashboard...</p>
                </div>
            </div>
        );
    }

    if (!authorized || !dashboard) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="text-center space-y-6 max-w-md">
                    <h1 className="text-4xl font-black text-[var(--foreground)]">B-Studio Ads</h1>
                    <p className="text-[var(--muted)]">Gerencie suas campanhas do Meta Ads de forma simples e eficiente.</p>
                    <button
                        onClick={handleConnectFacebook}
                        className="w-full bg-[#1877F2] text-white px-6 py-4 rounded-xl font-bold text-lg hover:bg-[#166fe5] transition-colors flex items-center justify-center gap-3"
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        Conectar com Facebook
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)]">
            {/* Header */}
            <header className="border-b border-[var(--shell-border)] bg-[var(--shell-side)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-black text-[var(--foreground)]">B-Studio Ads</h1>
                            <nav className="hidden md:flex gap-6">
                                <a href="/dashboard" className="text-[var(--foreground)] font-semibold">Dashboard</a>
                                <a href="/dashboard/campaigns" className="text-[var(--muted)] hover:text-[var(--foreground)]">Campanhas</a>
                                <a href="/dashboard/audience" className="text-[var(--muted)] hover:text-[var(--foreground)]">Público</a>
                                <a href="/dashboard/settings" className="text-[var(--muted)] hover:text-[var(--foreground)]">Configurações</a>
                            </nav>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-sm font-bold text-[var(--foreground)]">{dashboard.client.name}</p>
                                <p className="text-xs text-[var(--muted)]">{dashboard.client.email}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="text-[var(--muted)] hover:text-[var(--foreground)]"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h2 className="text-3xl font-black text-[var(--foreground)] mb-2">
                        Olá, {dashboard.client.name.split(' ')[0]}! 👋
                    </h2>
                    <p className="text-[var(--muted)]">
                        Aqui está o resumo das suas campanhas do Meta Ads.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Campanhas Ativas"
                        value={dashboard.summary.active_campaigns.toString()}
                        subtitle={`${dashboard.summary.paused_campaigns} pausadas`}
                        icon="📊"
                        color="bg-green-500/10 text-green-500"
                    />
                    <StatCard
                        title="Investimento Total"
                        value={`R$ ${dashboard.summary.total_spend.toFixed(2)}`}
                        subtitle="Todos os tempos"
                        icon="💰"
                        color="bg-blue-500/10 text-blue-500"
                    />
                    <StatCard
                        title="Impressões"
                        value={formatNumber(dashboard.summary.total_impressions)}
                        subtitle={`${formatNumber(dashboard.summary.total_clicks)} cliques`}
                        icon="👁️"
                        color="bg-purple-500/10 text-purple-500"
                    />
                    <StatCard
                        title="CTR Médio"
                        value={`${dashboard.summary.avg_ctr.toFixed(2)}%`}
                        subtitle={`CPC: R$ ${dashboard.summary.avg_cpc.toFixed(2)}`}
                        icon="📈"
                        color="bg-orange-500/10 text-orange-500"
                    />
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <button
                        onClick={handleCreateCampaign}
                        className="liquid-glass p-6 rounded-2xl border border-[var(--shell-border)] hover:border-[var(--foreground)]/30 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center text-3xl">
                                ➕
                            </div>
                            <div className="text-left">
                                <h3 className="text-xl font-black text-[var(--foreground)] group-hover:underline">
                                    Criar Nova Campanha
                                </h3>
                                <p className="text-[var(--muted)] text-sm">
                                    Configure e publique sua campanha em minutos
                                </p>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => router.push('/dashboard/audience')}
                        className="liquid-glass p-6 rounded-2xl border border-[var(--shell-border)] hover:border-[var(--foreground)]/30 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center text-3xl">
                                🎯
                            </div>
                            <div className="text-left">
                                <h3 className="text-xl font-black text-[var(--foreground)] group-hover:underline">
                                    Analisar Público
                                </h3>
                                <p className="text-[var(--muted)] text-sm">
                                    Veja insights e dados demográficos
                                </p>
                            </div>
                        </div>
                    </button>
                </div>

                {/* Recent Campaigns */}
                <div className="liquid-glass rounded-2xl border border-[var(--shell-border)] overflow-hidden mb-8">
                    <div className="px-6 py-4 border-b border-[var(--shell-border)] bg-[var(--shell-side)]">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-[var(--foreground)]">Campanhas Recentes</h3>
                            <button
                                onClick={() => router.push('/dashboard/campaigns')}
                                className="text-sm font-bold text-[var(--foreground)] hover:underline"
                            >
                                Ver todas →
                            </button>
                        </div>
                    </div>
                    <div className="divide-y divide-[var(--shell-border)]">
                        {dashboard.recent_campaigns.length > 0 ? (
                            dashboard.recent_campaigns.map((campaign) => (
                                <div
                                    key={campaign.id}
                                    className="px-6 py-4 hover:bg-[var(--shell-side)] transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-3 h-3 rounded-full ${
                                                campaign.status === 'ACTIVE' ? 'bg-green-500' : 'bg-yellow-500'
                                            }`} />
                                            <div>
                                                <h4 className="font-bold text-[var(--foreground)]">{campaign.name}</h4>
                                                <p className="text-sm text-[var(--muted)]">
                                                    {campaign.objective} • R$ {campaign.budget_total.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-[var(--foreground)]">
                                                    {campaign.metrics?.impressions ? formatNumber(campaign.metrics.impressions) : '-'}
                                                </p>
                                                <p className="text-xs text-[var(--muted)]">impressões</p>
                                            </div>
                                            <button
                                                onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}
                                                className="text-sm font-bold text-[var(--foreground)] hover:underline"
                                            >
                                                Ver →
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="px-6 py-12 text-center">
                                <p className="text-[var(--muted)] mb-4">Nenhuma campanha criada ainda.</p>
                                <button
                                    onClick={handleCreateCampaign}
                                    className="px-6 py-3 bg-[var(--foreground)] text-[var(--background)] rounded-xl font-bold hover:opacity-90 transition-opacity"
                                >
                                    Criar Primeira Campanha
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Ad Accounts */}
                {dashboard.ad_accounts.length > 0 && (
                    <div className="liquid-glass rounded-2xl border border-[var(--shell-border)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-[var(--shell-border)] bg-[var(--shell-side)]">
                            <h3 className="text-lg font-black text-[var(--foreground)]">Contas de Anúncios</h3>
                        </div>
                        <div className="divide-y divide-[var(--shell-border)]">
                            {dashboard.ad_accounts.map((account) => (
                                <div
                                    key={account.id}
                                    className="px-6 py-4 hover:bg-[var(--shell-side)] transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-[var(--foreground)]">{account.name}</h4>
                                            <p className="text-sm text-[var(--muted)]">{account.id}</p>
                                        </div>
                                        <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                                            account.account_status === 1
                                                ? 'bg-green-500/20 text-green-500'
                                                : 'bg-yellow-500/20 text-yellow-500'
                                        }`}>
                                            {account.account_status === 1 ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function StatCard({ title, value, subtitle, icon, color }: {
    title: string;
    value: string;
    subtitle: string;
    icon: string;
    color: string;
}) {
    return (
        <div className="liquid-glass p-6 rounded-2xl border border-[var(--shell-border)]">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <p className="text-sm font-bold text-[var(--muted)] mb-1">{title}</p>
                    <p className="text-3xl font-black text-[var(--foreground)]">{value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-2xl`}>
                    {icon}
                </div>
            </div>
            <p className="text-xs text-[var(--muted)]">{subtitle}</p>
        </div>
    );
}

function formatNumber(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
}

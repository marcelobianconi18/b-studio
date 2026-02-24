"use client";

import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

export interface FacebookPage {
    id: string;
    name: string;
    username: string;
    followers: number;
    has_instagram: boolean;
    instagram_id: string | null;
}

export interface InstagramAccount {
    id: string;
    username: string;
    name: string;
    followers: number;
    page_id: string;
    page_name: string;
}

export interface AdAccount {
    id: string;
    name: string;
    status: string;
}

export interface AvailableAccounts {
    facebook_pages: FacebookPage[];
    instagram_accounts: InstagramAccount[];
    ad_accounts: AdAccount[];
    total: {
        facebook_pages: number;
        instagram_accounts: number;
        ad_accounts: number;
    };
}

interface AccountSelectorProps {
    onAccountSelect?: (pageId: string, instagramId?: string) => void;
    selectedPageId?: string;
    selectedInstagramId?: string;
}

export default function AccountSelector({ 
    onAccountSelect, 
    selectedPageId, 
    selectedInstagramId 
}: AccountSelectorProps) {
    const [accounts, setAccounts] = useState<AvailableAccounts | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'facebook' | 'instagram' | 'ads'>('facebook');

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const res = await fetch(apiUrl("/api/social/accounts"));
            if (res.ok) {
                const data = await res.json();
                setAccounts(data);
            }
        } catch (error) {
            console.error("Failed to fetch accounts:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePageSelect = (page: FacebookPage) => {
        if (onAccountSelect) {
            onAccountSelect(page.id, page.instagram_id || undefined);
        }
    };

    const handleInstagramSelect = (ig: InstagramAccount) => {
        if (onAccountSelect) {
            onAccountSelect(ig.page_id, ig.id);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center space-y-2">
                    <div className="w-8 h-8 border-2 border-[var(--foreground)]/20 border-t-[var(--foreground)] rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-[var(--muted)]">Carregando contas...</p>
                </div>
            </div>
        );
    }

    if (!accounts) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center space-y-2">
                    <p className="text-sm text-red-500">Falha ao carregar contas</p>
                    <button 
                        onClick={fetchAccounts}
                        className="px-4 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-lg text-sm font-semibold"
                    >
                        Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="liquid-glass rounded-2xl border border-[var(--shell-border)] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--shell-border)] bg-[var(--shell-side)]">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-[var(--foreground)]">🔧 Modo de Testes</h3>
                        <p className="text-[10px] text-[var(--muted)]">Selecione uma conta para visualizar insights</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[var(--muted)]">
                            {accounts.total.facebook_pages} páginas • {accounts.total.instagram_accounts} Instagrams • {accounts.total.ad_accounts} ads
                        </span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[var(--shell-border)]">
                <button
                    onClick={() => setActiveTab('facebook')}
                    className={`flex-1 px-4 py-2 text-xs font-bold transition-colors ${
                        activeTab === 'facebook'
                            ? 'bg-[var(--foreground)] text-[var(--background)]'
                            : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                    }`}
                >
                    📘 Facebook
                </button>
                <button
                    onClick={() => setActiveTab('instagram')}
                    className={`flex-1 px-4 py-2 text-xs font-bold transition-colors ${
                        activeTab === 'instagram'
                            ? 'bg-[var(--foreground)] text-[var(--background)]'
                            : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                    }`}
                >
                    📷 Instagram
                </button>
                <button
                    onClick={() => setActiveTab('ads')}
                    className={`flex-1 px-4 py-2 text-xs font-bold transition-colors ${
                        activeTab === 'ads'
                            ? 'bg-[var(--foreground)] text-[var(--background)]'
                            : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                    }`}
                >
                    📊 Ads
                </button>
            </div>

            {/* Content */}
            <div className="max-h-[400px] overflow-y-auto">
                {/* Facebook Pages */}
                {activeTab === 'facebook' && (
                    <div className="divide-y divide-[var(--shell-border)]">
                        {accounts.facebook_pages.map((page) => (
                            <button
                                key={page.id}
                                onClick={() => handlePageSelect(page)}
                                className={`w-full px-6 py-4 flex items-center justify-between hover:bg-[var(--shell-side)] transition-colors ${
                                    selectedPageId === page.id ? 'bg-[var(--foreground)]/10' : ''
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">📘</span>
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-[var(--foreground)]">{page.name}</p>
                                        <p className="text-[10px] text-[var(--muted)]">@{page.username} • {page.followers.toLocaleString()} seguidores</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {page.has_instagram && (
                                        <span className="text-[10px] px-2 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 font-bold">
                                            📷 Instagram
                                        </span>
                                    )}
                                    {selectedPageId === page.id && (
                                        <span className="text-[10px] px-2 py-1 rounded-full bg-[var(--foreground)] text-[var(--background)] font-bold">
                                            Selecionado
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Instagram Accounts */}
                {activeTab === 'instagram' && (
                    <div className="divide-y divide-[var(--shell-border)]">
                        {accounts.instagram_accounts.map((ig) => (
                            <button
                                key={ig.id}
                                onClick={() => handleInstagramSelect(ig)}
                                className={`w-full px-6 py-4 flex items-center justify-between hover:bg-[var(--shell-side)] transition-colors ${
                                    selectedInstagramId === ig.id ? 'bg-[var(--foreground)]/10' : ''
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">📷</span>
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-[var(--foreground)]">@{ig.username}</p>
                                        <p className="text-[10px] text-[var(--muted)]">{ig.name} • {ig.followers.toLocaleString()} seguidores</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] px-2 py-1 rounded-full bg-[var(--shell-surface)] text-[var(--muted)] font-bold">
                                        🔗 {ig.page_name}
                                    </span>
                                    {selectedInstagramId === ig.id && (
                                        <span className="text-[10px] px-2 py-1 rounded-full bg-[var(--foreground)] text-[var(--background)] font-bold">
                                            Selecionado
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Ad Accounts */}
                {activeTab === 'ads' && (
                    <div className="divide-y divide-[var(--shell-border)]">
                        {accounts.ad_accounts.map((ad) => (
                            <div
                                key={ad.id}
                                className="w-full px-6 py-4 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">📊</span>
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-[var(--foreground)]">{ad.name}</p>
                                        <p className="text-[10px] text-[var(--muted)]">{ad.id}</p>
                                    </div>
                                </div>
                                <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                                    ad.status === 1 || ad.status === '1' || ad.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                    {ad.status === 1 || ad.status === '1' || ad.status === 'Active' ? 'Ativo' : 'Inativo'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

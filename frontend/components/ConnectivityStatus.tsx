"use client";

import { useState, useEffect } from "react";
import { CheckCircleIcon, ArrowPathIcon, ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import { apiUrl } from "@/lib/api";

interface SystemStatus {
    database: "connected" | "disconnected" | "error";
    meta_api: "connected" | "expired" | "error" | "missing_config";
    ai_model: "connected" | "disconnected" | "error";
    meta_token_expiry_days: number;
}

import CredentialsModal from "./CredentialsModal";

export default function ConnectivityStatus() {
    const [status, setStatus] = useState<SystemStatus | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        let isActive = true;

        const checkStatus = async () => {
            try {
                const res = await fetch(apiUrl("/api/system/status"), { cache: "no-store" });
                if (!res.ok) {
                    if (isActive) setStatus(null);
                    return;
                }
                const payload = await res.json();
                if (isActive) setStatus(payload);
            } catch {
                if (isActive) setStatus(null);
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 60000);
        return () => {
            isActive = false;
            clearInterval(interval);
        };
    }, []);

    if (!status) return null;

    return (
        <>
            <div className="flex gap-4 mb-6 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800">
                {/* Meta Ads Card */}
                <div
                    onClick={() => setIsModalOpen(true)}
                    className={`flex items-center gap-3 px-4 py-2 rounded-full border shadow-sm text-sm min-w-fit transition-all cursor-pointer hover:opacity-80
                    ${status.meta_api === 'connected'
                            ? 'bg-white border-zinc-200 text-[var(--foreground)]'
                            : 'bg-white/10/10 border-white/20/30 text-[var(--foreground)]'
                        }`}>
                    <div className="relative">
                        <div className={`w-2 h-2 rounded-full absolute top-0 right-0 ${status.meta_api === 'connected' ? 'bg-white/10 animate-pulse' : 'bg-white/10'}`} />
                        <svg className="w-5 h-5 opacity-80" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2.04c-5.5 0-10 4.49-10 10.02c0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.53-3.88 3.77-3.88c1.08 0 2.2.19 2.2.19v2.47h-1.24c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02z" />
                        </svg>
                    </div>
                    <span className="font-bold">Meta Ads</span>
                    {status.meta_api === 'connected' ? (
                        <CheckCircleIcon className="w-4 h-4 text-[var(--foreground)] ml-auto" />
                    ) : (
                        <ExclamationTriangleIcon className="w-4 h-4 text-[var(--foreground)] ml-auto" />
                    )}
                </div>

                {/* TikTok Card (Mock - Always Expired as per request logic to show 'reconnect') */}
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-3 px-4 py-2 bg-zinc-900 rounded-full border border-zinc-700/50 shadow-sm text-sm min-w-fit cursor-pointer hover:bg-zinc-800 hover:border-zinc-600 transition-colors group">
                    <svg className="w-5 h-5 opacity-80 fill-white" viewBox="0 0 24 24">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                    </svg>
                    <span className="text-zinc-400 font-medium group-hover:text-[var(--foreground)] transition-colors">TikTok Ads</span>
                    <ArrowPathIcon className="w-4 h-4 text-zinc-600 group-hover:text-[var(--foreground)] ml-auto" />
                </button>

                {/* AI Core Status */}
                <div
                    onClick={() => setIsModalOpen(true)}
                    className={`flex items-center gap-3 px-4 py-2 rounded-full border shadow-sm text-sm min-w-fit transition-all cursor-pointer hover:opacity-80
                    ${status.ai_model === 'connected'
                            ? 'bg-white/10/10 border-white/20/30 text-[var(--foreground)]'
                            : 'bg-white/10/10 border-white/20/30 text-[var(--foreground)]'
                        }`}>
                    <div className="relative">
                        <div className={`w-2 h-2 rounded-full absolute top-0 right-0 ${status.ai_model === 'connected' ? 'bg-white/10 animate-pulse' : 'bg-white/10'}`} />
                        <span className="font-black text-xs">AI</span>
                    </div>
                    <span className="font-bold">Guardian Core</span>
                    {status.ai_model === 'connected' ? (
                        <CheckCircleIcon className="w-4 h-4 text-[var(--foreground)] ml-auto" />
                    ) : (
                        <ExclamationTriangleIcon className="w-4 h-4 text-[var(--foreground)] ml-auto" />
                    )}
                </div>
            </div>

            <CredentialsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
    );
}

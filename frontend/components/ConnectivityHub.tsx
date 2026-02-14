"use client";

import { useState, useEffect } from "react";
import {
    SignalIcon,
    ServerStackIcon,
    CpuChipIcon,
    ExclamationCircleIcon
} from "@heroicons/react/24/solid";

interface SystemStatus {
    database: "connected" | "disconnected" | "error";
    meta_api: "connected" | "expired" | "error" | "missing_config";
    ai_model: "connected" | "disconnected" | "error";
    meta_token_expiry_days: number;
}

export default function ConnectivityHub() {
    const [status, setStatus] = useState<SystemStatus | null>(null);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch("http://localhost:8001/api/system/status");
                if (res.ok) {
                    setStatus(await res.json());
                }
            } catch (e) {
                console.error("Status check failed", e);
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (s: string) => {
        if (s === "connected") return "bg-emerald-500";
        if (s === "expired") return "bg-yellow-500";
        return "bg-red-500";
    };

    if (!status) return null;

    return (
        <div className="flex items-center gap-4 bg-black/40 border border-zinc-800 rounded-full px-4 py-1.5 backdrop-blur-md">
            {/* Meta API Status */}
            <div className="flex items-center gap-2 group relative cursor-help">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(status.meta_api)} animate-pulse`} />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Meta API</span>

                {/* Tooltip */}
                <div className="absolute top-8 left-1/2 -translate-x-1/2 w-48 bg-zinc-900 border border-zinc-700 p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    <p className="text-[10px] text-zinc-400 mb-1">Token Status:</p>
                    <p className={`text-xs font-bold ${status.meta_api === 'connected' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {status.meta_api.toUpperCase()}
                    </p>
                    {status.meta_token_expiry_days < 7 && status.meta_token_expiry_days > 0 && (
                        <p className="text-[10px] text-yellow-500 mt-2 flex items-center gap-1">
                            <ExclamationCircleIcon className="w-3 h-3" /> Expires in {status.meta_token_expiry_days} days
                        </p>
                    )}
                </div>
            </div>

            <div className="w-[1px] h-3 bg-zinc-800" />

            {/* Database Status */}
            <div className="flex items-center gap-2" title="PostgreSQL Database">
                <ServerStackIcon className={`w-3 h-3 ${status.database === 'connected' ? 'text-zinc-600' : 'text-red-500'}`} />
            </div>

            <div className="w-[1px] h-3 bg-zinc-800" />

            {/* AI Core Status */}
            <div className="flex items-center gap-2" title="Qwen2.5 Local Inference">
                <CpuChipIcon className={`w-3 h-3 ${status.ai_model === 'connected' ? 'text-blue-500' : 'text-red-500'}`} />
            </div>
        </div>
    );
}

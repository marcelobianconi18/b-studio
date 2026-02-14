"use client";

import { useEffect, useRef, useState } from "react";
import { ShieldCheckIcon, SignalIcon, ExclamationTriangleIcon } from "@heroicons/react/24/solid";

interface LogEntry {
    time: string;
    type: "success" | "warning" | "info";
    msg: string;
}

const mockLogs: LogEntry[] = [
    { time: '02:14 AM', type: 'success', msg: 'Monitoramento: Orçamento da campanha "Verão" ajustado (+10%)' },
    { time: '04:30 AM', type: 'info', msg: 'Análise: Criativo #45 detectado com fadiga (CTR < 0.8%)' },
    { time: '06:00 AM', type: 'success', msg: 'Automação: Relatório diário gerado e enviado.' },
    { time: '09:15 AM', type: 'warning', msg: 'Alerta: Token do Instagram expira em 3 dias.' },
];

export default function GuardianTerminal() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial Scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, []);

    // 1. Fetch Real Logs from Backend
    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await fetch("http://localhost:8001/api/intelligence/history");
                if (res.ok) {
                    const data = await res.json();

                    // Transform backend format to Terminal format
                    const formattedLogs = data.map((item: any) => ({
                        time: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        type: item.action_type === 'PAUSE' ? 'warning' : 'success',
                        msg: `${item.action_type}: ${item.reason} (${item.campaign_id})`
                    }));

                    setLogs(formattedLogs.reverse()); // Show newest at bottom? Actually terminal usually appends.
                    // If backend returns newest first, we might want to reverse them to show chronological order depending on UI preference.
                    // Let's assume we want chronological at the bottom.
                }
            } catch (e) {
                console.error("Failed to fetch logs", e);
            }
        }

        fetchLogs();
        const interval = setInterval(fetchLogs, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    // Auto-scroll on new logs
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="bg-black border border-zinc-800 rounded-xl p-4 h-[300px] flex flex-col shadow-2xl relative overflow-hidden group">

            {/* Header */}
            <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-2 text-emerald-400">
                    <ShieldCheckIcon className="w-5 h-5" />
                    <span className="font-mono text-xs font-bold tracking-wider">GUARDIAN_AI ACTIVE</span>
                </div>
                <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500/50" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                    <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
                </div>
            </div>

            {/* Terminal Body */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto font-mono text-xs space-y-3 pr-2 scrollbar-thin scrollbar-thumb-zinc-800"
            >
                {logs.map((log, i) => (
                    <div key={i} className="flex gap-3 opacity-90 hover:opacity-100 transition-opacity">
                        <span className="text-zinc-500 shrink-0 select-none">{log.time}</span>
                        <span className={`
                            ${log.type === 'success' ? 'text-emerald-400' : ''}
                            ${log.type === 'warning' ? 'text-amber-400' : ''}
                            ${log.type === 'info' ? 'text-blue-400' : ''}
                        `}>
                            {log.type === 'success' && '>> '}
                            {log.type === 'warning' && '!! '}
                            {log.type === 'info' && 'ii '}
                            {log.msg}
                        </span>
                    </div>
                ))}
                <div className="animate-pulse text-emerald-500">_</div>
            </div>
        </div>
    );
}

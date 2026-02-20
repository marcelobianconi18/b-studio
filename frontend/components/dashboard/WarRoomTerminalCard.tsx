"use client";

import { useRef, useEffect, useState } from "react";
import { ExclamationTriangleIcon, ShieldCheckIcon, SparklesIcon, InformationCircleIcon } from "@heroicons/react/24/outline";

interface LogEntry {
    time: string;
    type: "CRITICAL" | "GUARDIAN" | "OPPORTUNITY" | "SYSTEM";
    message: string;
}

const initialLogs: LogEntry[] = [
    { time: "10:42 AM", type: "CRITICAL", message: "Token do Facebook expirou. Reconecte agora para não parar os ads." },
    { time: "10:30 AM", type: "GUARDIAN", message: 'Anúncio "Promoção Verão" pausado. CPA > R$ 50,00. Economia: R$ 200,00.' },
    { time: "09:15 AM", type: "OPPORTUNITY", message: "Criativo #4 está com ROAS 5x. Sugestão: Aumentar orçamento em 20%." },
    { time: "08:00 AM", type: "SYSTEM", message: "Relatório diário enviado para o seu e-mail." },
    { time: "07:30 AM", type: "GUARDIAN", message: "Verificação de segurança concluída. Nenhuma anomalia detectada." },
    { time: "06:00 AM", type: "SYSTEM", message: "Backup do sistema realizado com sucesso." },
];

export default function WarRoomTerminalCard() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [logs, setLogs] = useState(initialLogs);

    useEffect(() => {
        const interval = setInterval(() => {
            if (scrollRef.current) {
                // Smooth auto-scroll logic or simply append new logs simulation could go here
            }
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-full w-full p-6 flex flex-col overflow-hidden relative group transition-all duration-300 bento-cell hover-spring">
            <div className="absolute inset-0 bg-[white]/5 pointer-events-none rounded-3xl" />

            {/* Header */}
            <div
                className="flex justify-between items-center mb-4 z-10 border-b pb-4"
                style={{ borderColor: "var(--shell-border)" }}
            >
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[white] animate-pulse shadow-sm"></span>
                    <h1 className="text-sm font-black uppercase tracking-widest text-[white] drop-shadow-sm">WAR ROOM TERMINAL</h1>
                </div>
                <div className="text-[10px] font-mono text-[var(--muted)]">
                    LIVE FEED • GUARDIAN ACTIVE
                </div>
            </div>

            {/* Terminal Feed */}
            <div className="flex-1 overflow-y-auto font-mono text-xs space-y-3 pr-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent z-10" ref={scrollRef}>
                {logs.map((log, index) => (
                    <div
                        key={index}
                        className="flex gap-3 p-2 rounded transition-colors hover:bg-[var(--shell-side)]"
                    >
                        <span className="text-[var(--muted)] shrink-0">[{log.time}]</span>
                        <div className="flex-1">
                            {log.type === "CRITICAL" && (
                                <span className="flex items-start gap-2 text-[white] font-bold">
                                    <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
                                    <span>[CRÍTICO] {log.message}</span>
                                </span>
                            )}
                            {log.type === "GUARDIAN" && (
                                <span className="flex items-start gap-2 text-[white] font-bold">
                                    <ShieldCheckIcon className="w-4 h-4 shrink-0" />
                                    <span>[GUARDIAN] {log.message}</span>
                                </span>
                            )}
                            {log.type === "OPPORTUNITY" && (
                                <span className="flex items-start gap-2 text-[var(--muted)] font-bold">
                                    <SparklesIcon className="w-4 h-4 shrink-0" />
                                    <span>[OPPORTUNITY] {log.message}</span>
                                </span>
                            )}
                            {log.type === "SYSTEM" && (
                                <span className="flex items-start gap-2 text-[var(--muted)]">
                                    <InformationCircleIcon className="w-4 h-4 shrink-0" />
                                    <span>[SISTEMA] {log.message}</span>
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Matrix/Scanline Effect Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(var(--foreground-rgb),0.02)_50%,rgba(0,0,0,0)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[1] bg-[length:100%_2px,3px_100%] opacity-20"></div>
        </div>
    );
}

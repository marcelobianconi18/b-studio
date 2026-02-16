"use client";

import { useState } from "react";
import { ChevronDownIcon, CalendarDaysIcon, ArrowLeftIcon } from "@heroicons/react/24/solid";

const OPTIONS = [
    { label: "Últimos 7 dias", value: "7d" },
    { label: "Últimos 14 dias", value: "14d" },
    { label: "Últimos 30 dias", value: "30d" },
    { label: "Este Mês", value: "this_month" },
    { label: "Mês Passado", value: "last_month" },
    { label: "Este Ano", value: "this_year" },
    { label: "Todo o período", value: "all" },
];

export default function PeriodSelector() {
    const [selected, setSelected] = useState(OPTIONS[2]); // Default: Últimos 30 dias
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<"list" | "custom">("list");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const handleApplyCustom = () => {
        if (startDate && endDate) {
            const start = new Date(startDate).toLocaleDateString('pt-BR');
            const end = new Date(endDate).toLocaleDateString('pt-BR');
            setSelected({ label: `${start} - ${end}`, value: "custom" });
            setIsOpen(false);
            setView("list");
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) setView("list");
                }}
                className="flex items-center gap-2 bg-[var(--shell-side)] hover:bg-[var(--shell-border)] border border-[var(--shell-border)] rounded-full pl-3 pr-4 py-1.5 transition-all text-sm font-medium text-[var(--foreground)] min-w-[160px] justify-between"
            >
                <div className="flex items-center gap-2">
                    <CalendarDaysIcon className="w-4 h-4 text-zinc-500" />
                    <span className="text-xs font-bold whitespace-nowrap">{selected.label}</span>
                </div>
                <ChevronDownIcon className={`w-3 h-3 text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    {view === "list" ? (
                        <>
                            <div className="text-[9px] uppercase font-black tracking-widest text-zinc-500 px-3 py-2">Selecionar Período</div>
                            <div className="space-y-1">
                                {OPTIONS.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => {
                                            setSelected(option);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors text-xs font-medium ${selected.value === option.value ? "bg-blue-500/10 text-blue-500" : "hover:bg-[var(--shell-side)] text-zinc-400 hover:text-zinc-200"}`}
                                    >
                                        <span>{option.label}</span>
                                        {selected.value === option.value && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                    </button>
                                ))}
                                <div className="h-px bg-[var(--shell-border)] my-1" />
                                <button
                                    onClick={() => setView("custom")}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-[var(--shell-side)]"
                                >
                                    <span>Personalizado...</span>
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="p-2">
                            <button
                                onClick={() => setView("list")}
                                className="flex items-center gap-1 text-[10px] font-bold uppercase text-zinc-500 hover:text-zinc-300 mb-4 px-1"
                            >
                                <ArrowLeftIcon className="w-3 h-3" /> Voltar
                            </button>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1 ml-1">Data Inicial</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full bg-[var(--shell-side)] border border-[var(--shell-border)] rounded-lg px-3 py-2 text-xs text-[var(--foreground)] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-bold uppercase text-zinc-500 mb-1 ml-1">Data Final</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full bg-[var(--shell-side)] border border-[var(--shell-border)] rounded-lg px-3 py-2 text-xs text-[var(--foreground)] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                                <button
                                    onClick={handleApplyCustom}
                                    disabled={!startDate || !endDate}
                                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-bold text-xs py-2 rounded-lg transition-colors mt-2"
                                >
                                    Aplicar Período
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

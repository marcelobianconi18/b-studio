"use client";

import { useState } from "react";
import { ChevronDownIcon, UserCircleIcon } from "@heroicons/react/24/solid";

const PROFILES = [
    { id: "1", name: "Marcelo Bianconi", role: "Admin" },
    { id: "2", name: "B-Studio Enterprise", role: "Organization" },
    { id: "3", name: "Cliente VIP", role: "Client" },
];

export default function ProfileSelector() {
    const [selected, setSelected] = useState(PROFILES[0]);
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 bg-[var(--shell-side)] hover:bg-[var(--shell-border)] border border-[var(--shell-border)] rounded-full pl-2 pr-4 py-1.5 transition-all text-sm font-medium text-[var(--foreground)]"
            >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-[2px]">
                    <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center">
                        <UserCircleIcon className="w-5 h-5 text-zinc-400" />
                    </div>
                </div>
                <div className="flex flex-col items-start leading-none gap-0.5">
                    <span className="text-xs font-bold">{selected.name}</span>
                    <span className="text-[9px] text-zinc-500 uppercase tracking-wider">{selected.role}</span>
                </div>
                <ChevronDownIcon className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-[var(--shell-surface)] border border-[var(--shell-border)] rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="text-[10px] uppercase font-black tracking-widest text-zinc-500 px-3 py-2">Selecionar Perfil</div>
                    <div className="space-y-1">
                        {PROFILES.map((profile) => (
                            <button
                                key={profile.id}
                                onClick={() => {
                                    setSelected(profile);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${selected.id === profile.id ? "bg-blue-500/10 text-blue-500" : "hover:bg-[var(--shell-side)] text-zinc-400 hover:text-zinc-200"}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selected.id === profile.id ? "bg-blue-500 text-white" : "bg-zinc-800"}`}>
                                    <span className="text-xs font-bold">{profile.name.charAt(0)}</span>
                                </div>
                                <div className="flex flex-col leading-none gap-0.5">
                                    <span className="text-xs font-bold">{profile.name}</span>
                                    <span className="text-[9px] opacity-70">{profile.role}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

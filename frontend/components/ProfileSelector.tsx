"use client";

import { useState } from "react";
import { ChevronDownIcon, UserCircleIcon } from "@heroicons/react/24/solid";

export type InsightPlatform = "facebook" | "instagram";

export type InsightProfile = {
    id: string;
    name: string;
    role: string;
    platform: InsightPlatform;
};

const PROFILES: InsightProfile[] = [
    { id: "facebook-client-1", name: "clientedeteste1", role: "Facebook Insight", platform: "facebook" },
    { id: "instagram-client-1", name: "@clienteteste1", role: "Instagram Insight", platform: "instagram" },
];

type ProfileSelectorProps = {
    selectedProfile?: InsightProfile;
    onChange?: (profile: InsightProfile) => void;
    variant?: "default" | "flat-red" | "shell-brand";
};

export default function ProfileSelector({ selectedProfile, onChange, variant = "default" }: ProfileSelectorProps) {
    const [internalSelected, setInternalSelected] = useState(PROFILES[0]);
    const selected = selectedProfile ?? internalSelected;
    const [isOpen, setIsOpen] = useState(false);
    const isFlatRed = variant === "flat-red";
    const isShellBrand = variant === "shell-brand";
    const selectedName = selected.name.replace(/^@/, "");
    const selectedNetwork = selected.platform === "instagram" ? "instagram" : "facebook";

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={isFlatRed
                    ? "w-[220px] h-[44px] flex items-center gap-3 border-2 border-white/20 bg-white/90 rounded-none pl-3 pr-3 transition-all text-black hover:bg-white"
                    : isShellBrand
                        ? "w-[264px] h-[41px] flex items-center gap-2 border border-[var(--shell-border)] bg-[var(--shell-side-btn)] hover:bg-[oklch(from_var(--shell-side-btn)_l_c_h_/_0.8)] rounded-xl pl-3 pr-3 transition-all text-[var(--foreground)] shadow-sm"
                        : "flex items-center gap-3 bg-[var(--shell-side)] hover:bg-[oklch(from_var(--shell-side)_l_c_h_/_0.8)] border border-[var(--shell-border)] rounded-full pl-2 pr-4 py-1.5 transition-all text-sm font-medium text-[var(--foreground)]"}
            >
                <div className={isFlatRed ? "w-7 h-7 rounded-full border-[3px] border-white/20 bg-white" : isShellBrand ? "w-6.5 h-6.5 rounded-full bg-gradient-to-tr from-pink-500 via-fuchsia-500 to-orange-400 p-[2px]" : "w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-[2px]"}>
                    <div className={isFlatRed ? "hidden" : isShellBrand ? "w-full h-full rounded-full bg-[var(--shell-side-btn)]/90 flex items-center justify-center" : "w-full h-full rounded-full bg-[var(--shell-side-btn)] flex items-center justify-center"}>
                        <UserCircleIcon className={isShellBrand ? "w-3.5 h-3.5 text-[var(--muted)]" : "w-5 h-5 text-[var(--muted)]"} />
                    </div>
                </div>
                <div className={isFlatRed ? "flex items-center leading-none flex-1" : isShellBrand ? "flex flex-col items-start leading-none gap-0 flex-1 min-w-0" : "flex flex-col items-start leading-none gap-0.5"}>
                    <span className={isFlatRed ? "text-lg leading-none font-bold" : "hidden"} style={{ fontFamily: "Georgia, Times New Roman, serif" }}>
                        {selected.name.startsWith("@") ? "@" : ""}
                    </span>
                    <span className={isFlatRed ? "text-[16px] leading-none font-black ml-1" : isShellBrand ? "hidden" : "text-xs font-bold"} style={isFlatRed ? { fontFamily: "Georgia, Times New Roman, serif" } : undefined}>{selected.name.replace(/^@/, "")}</span>
                    {isShellBrand && <span className="text-[13px] leading-tight font-black truncate max-w-[155px]">{selectedName}</span>}
                    {isShellBrand && <span className="text-[9px] leading-tight uppercase tracking-wider text-[var(--muted)] font-bold">{selectedNetwork}</span>}
                    {!isFlatRed && !isShellBrand && <span className="text-[9px] text-[var(--muted)] uppercase tracking-wider">{selected.role}</span>}
                </div>
                <ChevronDownIcon className={`${isFlatRed ? "w-4 h-4 text-[var(--foreground)]" : "w-4 h-4 text-[var(--muted)]"} transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div
                    className="absolute right-0 top-full mt-2 w-64 border border-[var(--shell-border)] rounded-xl shadow-2xl p-2 z-[9999] bg-[var(--shell-surface)] backdrop-blur-xl"
                >
                    <div className="text-[10px] uppercase font-black tracking-widest text-[var(--muted)] px-3 py-2">Selecionar Perfil</div>
                    <div className="space-y-1">
                        {PROFILES.map((profile) => (
                            <button
                                key={profile.id}
                                onClick={() => {
                                    if (!selectedProfile) {
                                        setInternalSelected(profile);
                                    }
                                    onChange?.(profile);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${selected.id === profile.id ? "bg-white/10/10 text-[var(--foreground)]" : "hover:bg-[var(--shell-side)] text-[var(--muted)] hover:text-[var(--foreground)]"}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selected.id === profile.id ? "bg-white/10 text-[var(--foreground)]" : "bg-[var(--shell-side-btn)]"}`}>
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

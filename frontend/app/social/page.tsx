"use client";

import { useState } from "react";
import LiquidShell from "@/components/LiquidShell";
import ProfileSelector, { type InsightProfile } from "@/components/ProfileSelector";
import PeriodSelector, { type PeriodValue } from "@/components/PeriodSelector";
import FacebookInsightsAnalysis from "@/components/social/FacebookInsightsAnalysis";
import InstagramInsightsAnalysis from "@/components/social/InstagramInsightsAnalysis";

export default function SocialMetricsPage() {
    const [selectedProfile, setSelectedProfile] = useState<InsightProfile>({
        id: "416436651784721",
        name: "Professor Lemos",
        role: "Facebook & Meta Ads",
        platform: "facebook",
    });
    const [period, setPeriod] = useState<PeriodValue>("30d");
    const [platform, setPlatform] = useState<"facebook" | "instagram">("facebook");

    return (
        <LiquidShell
            title="MÉTRICA SOCIAL"
            subtitle="ANÁLISE DE REDES SOCIAIS"
            headerCenter={
                <div className="flex items-center gap-3">
                    <ProfileSelector
                        selectedProfile={selectedProfile}
                        onChange={setSelectedProfile}
                        variant="default"
                    />
                    <PeriodSelector
                        value={period}
                        onChange={setPeriod}
                    />
                </div>
            }
        >
            {/* Platform Tabs */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setPlatform("facebook")}
                    className={`px-6 py-3 rounded-xl font-bold transition-all ${
                        platform === "facebook"
                            ? "bg-[#1877F2] text-white shadow-lg"
                            : "bg-[var(--shell-side)] text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                >
                    📘 Facebook
                </button>
                <button
                    onClick={() => setPlatform("instagram")}
                    className={`px-6 py-3 rounded-xl font-bold transition-all ${
                        platform === "instagram"
                            ? "bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#515BD4] text-white shadow-lg"
                            : "bg-[var(--shell-side)] text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                >
                    📷 Instagram
                </button>
            </div>

            {/* Platform Content */}
            {platform === "facebook" ? (
                <FacebookInsightsAnalysis />
            ) : (
                <InstagramInsightsAnalysis />
            )}
        </LiquidShell>
    );
}

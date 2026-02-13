
"use client";

import { useState, useEffect } from "react";
import Dashboard from "./page";
import UnifiedInbox from "@/components/UnifiedInbox";
import {
    ChartBarIcon,
    ChatBubbleLeftRightIcon,
    HashtagIcon,
    HomeIcon,
} from "@heroicons/react/24/solid";

export default function Layout({ children }: { children: React.ReactNode }) {
    const [activeTab, setActiveTab] = useState("ads");

    return (
        <div className="flex min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30">
            {/* Sidebar Navigation */}
            <aside className="w-20 lg:w-64 border-r border-zinc-800 flex flex-col items-center lg:items-start py-8 fixed h-full bg-[#050505] z-50">
                <div className="px-6 mb-12">
                    <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <span className="font-black text-xl italic tracking-tighter">B</span>
                    </div>
                </div>

                <nav className="flex-1 w-full space-y-2 px-3">
                    <NavItem
                        icon={<HomeIcon className="w-5 h-5" />}
                        label="Ads Manager"
                        isActive={activeTab === "ads"}
                        onClick={() => setActiveTab("ads")}
                    />
                    <NavItem
                        icon={<HashtagIcon className="w-5 h-5" />}
                        label="Social Studio"
                        isActive={activeTab === "social"}
                        onClick={() => setActiveTab("social")}
                    />
                    <div className="pt-8 pb-4 px-4">
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest hidden lg:block">Communication</p>
                    </div>
                    <NavItem
                        icon={<ChatBubbleLeftRightIcon className="w-5 h-5" />}
                        label="Unified Inbox"
                        isActive={activeTab === "inbox"}
                        onClick={() => setActiveTab("inbox")}
                    />
                </nav>

                <div className="px-6 w-full">
                    <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800 hidden lg:block">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-bold text-zinc-400">API Status</span>
                        </div>
                        <p className="text-[10px] text-zinc-600 font-mono">META: Connected</p>
                        <p className="text-[10px] text-zinc-600 font-mono">Qwen: Online</p>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 ml-20 lg:ml-64">
                {activeTab === "ads" && <Dashboard />}
                {activeTab === "social" && <SocialStudio />}
                {activeTab === "inbox" && <UnifiedInbox />}
            </main>
        </div>
    );
}

const NavItem = ({ icon, label, isActive, onClick }: any) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive
            ? "bg-white text-black shadow-lg shadow-white/10"
            : "text-zinc-500 hover:bg-zinc-900 hover:text-white"
            }`}
    >
        {icon}
        <span className="text-xs font-bold hidden lg:block">{label}</span>
        {isActive && (
            <div className="ml-auto w-1 h-1 rounded-full bg-black hidden lg:block" />
        )}
    </button>
);

function SocialStudio() {
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        const fetchSocial = async () => {
            try {
                const res = await fetch("http://localhost:8001/api/intelligence/social-analysis");
                setStats(await res.json());
            } catch (e) {
                console.error("Failed to fetch social stats", e);
            }
        }
        fetchSocial();
    }, []);

    if (!stats) return <div className="p-20 text-center animate-pulse text-zinc-600">Loading Social Intelligence...</div>

    return (
        <div className="p-8">
            <header className="mb-12">
                <h1 className="text-3xl font-black italic tracking-tighter mb-2">SOCIAL STUDIO</h1>
                <p className="text-zinc-500 text-sm">Organic Growth & "The Bridge" Analysis</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-3xl flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden group hover:border-blue-500/50 transition-all">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 blur-[80px] opacity-20 absolute" />
                    <h3 className="text-xl font-bold relative z-10">Blended Reach</h3>
                    <p className="text-5xl font-black text-white relative z-10">{stats.blended_reach?.toLocaleString() || "--"}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest relative z-10 border border-zinc-800 px-3 py-1 rounded-full">Organic + Paid (28d)</p>
                </div>

                <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-3xl flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden group hover:border-emerald-500/50 transition-all">
                    <div className="w-32 h-32 rounded-full bg-emerald-500 blur-[80px] opacity-10 absolute" />
                    <h3 className="text-xl font-bold relative z-10">Organic Growth</h3>
                    <p className="text-5xl font-black text-emerald-400 relative z-10">{stats.organic_growth_rate || "0%"}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest relative z-10 border border-zinc-800 px-3 py-1 rounded-full">vs Previous Period</p>
                </div>
            </div>

            <section className="bg-zinc-900/20 border border-zinc-800/50 rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-black text-xs">AI</div>
                    <h2 className="text-lg font-bold">Growth Strategist Insight</h2>
                </div>

                <div className="space-y-6">
                    <div className="prose prose-invert">
                        <p className="text-lg leading-relaxed text-zinc-300">"{stats.insight}"</p>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl">
                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-2">Recommended Action</p>
                        <p className="text-blue-100 font-medium">{stats.suggestion}</p>
                        <div className="flex gap-4 mt-4">
                            <button className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors">
                                Launch Boost Campaign
                            </button>
                            <button onClick={() => window.location.href = '/social/publisher'} className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg transition-colors">
                                Create New Post
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

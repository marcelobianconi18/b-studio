
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
    BoltIcon,
    ArrowTrendingUpIcon,
    PauseIcon,
    PlayIcon,
    CurrencyDollarIcon,
    ChartPieIcon,
    ClockIcon
} from "@heroicons/react/24/solid";
import TrueRoiDashboard from "@/components/TrueRoiDashboard";
import FatigueMonitor from "@/components/FatigueMonitor";
import ViralMonitor from "@/components/ViralMonitor";

export default function Dashboard() {
    const [agentMode, setAgentMode] = useState("manual");
    const [recommendations, setRecommendations] = useState([]);
    const [history, setHistory] = useState([]);
    const [isAuditing, setIsAuditing] = useState(false);
    const [audits, setAudits] = useState([]);

    const fetchData = async () => {
        try {
            const configRes = await fetch("http://localhost:8001/api/intelligence/config");
            const config = await configRes.json();
            setAgentMode(config.mode);

            const recRes = await fetch("http://localhost:8001/api/intelligence/recommendations");
            setRecommendations(await recRes.json());

            const histRes = await fetch("http://localhost:8001/api/intelligence/history");
            setHistory(await histRes.json());

            const auditRes = await fetch("http://localhost:8001/api/intelligence/audits");
            setAudits(await auditRes.json());
        } catch (e) {
            console.error("Failed to connect to backend", e);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    const toggleMode = async (newMode: string) => {
        await fetch("http://localhost:8001/api/intelligence/mode", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mode: newMode })
        });
        setAgentMode(newMode);
    };

    const triggerAudit = async () => {
        setIsAuditing(true);
        try {
            await fetch("http://localhost:8001/api/intelligence/generate-audit?days=365", { method: "POST" });
            fetchData();
        } finally {
            setIsAuditing(false);
        }
    };

    return (
        <div className="p-8">
            <header className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-4xl font-black italic tracking-tighter mb-2">WAR ROOM</h1>
                    <p className="text-zinc-500 text-sm">Real-time Ads Command Center</p>
                </div>

                <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
                    {["manual", "hybrid", "automatic"].map((m) => (
                        <button
                            key={m}
                            onClick={() => toggleMode(m)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${agentMode === m ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-white"
                                }`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </header>

            {/* True ROI Dashboard Component */}
            <TrueRoiDashboard />

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Recommendations & Fatigue Monitor */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Top Row: Monitoring Widgets */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-64">
                        <FatigueMonitor />
                        <ViralMonitor />
                    </div>

                    <section>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <BoltIcon className="w-5 h-5 text-yellow-500" />
                            Agent Recommendations
                        </h2>
                        <div className="grid gap-4">
                            {recommendations.length === 0 ? (
                                <div className="p-8 border border-dashed border-zinc-800 rounded-xl text-center text-zinc-600">
                                    No active recommendations. The agent is analyzing...
                                </div>
                            ) : (
                                recommendations.map((rec: any) => (
                                    <div key={rec.id} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl hover:border-zinc-700 transition-all group">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-lg text-zinc-200">{rec.title}</h3>
                                            <span className="bg-yellow-500/10 text-yellow-500 text-xs px-2 py-1 rounded font-bold">
                                                Impact: {rec.impact_score}/10
                                            </span>
                                        </div>
                                        <p className="text-sm text-zinc-400 mb-4">{rec.content}</p>
                                        <div className="flex gap-3">
                                            <button className="flex-1 py-2 bg-white text-black font-bold rounded-lg text-xs hover:bg-zinc-200">
                                                Approve Action
                                            </button>
                                            <button className="px-4 py-2 border border-zinc-700 rounded-lg text-xs font-bold hover:bg-zinc-800">
                                                Dismiss
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>

                {/* Right Column: Activity & History */}
                <div className="space-y-8">
                    {/* Bot Activity Log */}
                    <section className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-3xl h-[400px] overflow-y-auto">
                        <h2 className="text-sm font-bold uppercase text-zinc-500 mb-4 tracking-widest">Live Activity Log</h2>
                        <div className="space-y-4">
                            {history.length === 0 ? (
                                <p className="text-xs text-zinc-600 italic">Agent haven't taken any action yet.</p>
                            ) : (
                                history.map((action: any) => (
                                    <div key={action.id} className="flex gap-3 text-xs border-b border-zinc-800/50 pb-3 last:border-0">
                                        <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${action.action_type === 'PAUSE' ? 'bg-red-500' : 'bg-emerald-500'
                                            }`} />
                                        <div>
                                            <p className="font-bold text-zinc-300">
                                                {action.action_type} campaign {action.campaign_id}
                                            </p>
                                            <p className="text-zinc-500 mt-1">{action.reason}</p>
                                            <p className="text-[10px] text-zinc-700 mt-2 font-mono">
                                                {new Date(action.created_time).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    {/* Historical Audit Section */}
                    <section className="bg-gradient-to-br from-indigo-900/20 to-black border border-indigo-500/20 p-6 rounded-3xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-sm font-bold uppercase text-indigo-400 tracking-widest flex items-center gap-2">
                                <ClockIcon className="w-4 h-4" />
                                Strategic Audit
                            </h2>
                            <button
                                onClick={triggerAudit}
                                disabled={isAuditing}
                                className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-full font-bold transition-all disabled:opacity-50"
                            >
                                {isAuditing ? "Analyzing..." : "Generate New Audit"}
                            </button>
                        </div>

                        <div className="space-y-3">
                            {audits.length === 0 ? (
                                <p className="text-xs text-zinc-500 italic">No historical audits generated yet.</p>
                            ) : (
                                audits.slice(0, 3).map((audit: any) => (
                                    <div key={audit.id} className="bg-black/50 p-4 rounded-xl border border-zinc-800/50">
                                        <div className="flex justify-between text-[10px] text-zinc-500 mb-2 font-mono">
                                            <span>ID: {audit.id.substring(0, 8)}</span>
                                            <span>{new Date(audit.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs text-zinc-300 line-clamp-3 leading-relaxed">
                                            {audit.summary_text}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

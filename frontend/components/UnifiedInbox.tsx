"use client";

import { useState, useEffect } from "react";
import {
    InboxArrowDownIcon,
    CheckBadgeIcon,
    FireIcon,
    QuestionMarkCircleIcon,
    BanknotesIcon
} from "@heroicons/react/24/outline";

export default function UnifiedInbox() {
    const [interactions, setInteractions] = useState<any>({ comments: [], messages: [] });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all"); // 'all', 'paid', 'hot'

    useEffect(() => {
        const fetchInbox = async () => {
            try {
                const res = await fetch("http://localhost:8001/api/social/inbox");
                setInteractions(await res.json());
            } catch (e) {
                console.error("Failed to fetch inbox", e);
            } finally {
                setLoading(false);
            }
        };

        fetchInbox();
        // Poll every 30 seconds
        const interval = setInterval(fetchInbox, 30000);
        return () => clearInterval(interval);
    }, []);

    const getSentimentIcon = (sentiment: string) => {
        switch (sentiment) {
            case "HOT": return <FireIcon className="w-4 h-4 text-red-500" />;
            case "WARM": return <QuestionMarkCircleIcon className="w-4 h-4 text-yellow-500" />;
            case "PAID": return <BanknotesIcon className="w-4 h-4 text-emerald-500" />;
            default: return <InboxArrowDownIcon className="w-4 h-4 text-zinc-500" />;
        }
    };

    const sortedComments = interactions.comments?.sort((a: any, b: any) => {
        // Priority: PAID > HOT > WARM > OTHERS
        const priority = { "PAID": 4, "HOT": 3, "WARM": 2, "COLD": 1, "NEUTRAL": 0 };
        // @ts-ignore
        return (priority[b.sentiment] || 0) - (priority[a.sentiment] || 0);
    }).filter((c: any) => {
        if (filter === "paid") return c.sentiment === "PAID";
        if (filter === "hot") return c.sentiment === "HOT";
        return true;
    });

    return (
        <div className="p-8 h-screen flex flex-col">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black italic tracking-tighter mb-2">SALES DESK</h1>
                    <p className="text-zinc-500 text-sm">Priority Inbox: Money First, Noise Later</p>
                </div>
                <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
                    <button
                        onClick={() => setFilter("all")}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${filter === "all" ? "bg-white text-black" : "text-zinc-500 hover:text-white"}`}
                    >
                        ALL
                    </button>
                    <button
                        onClick={() => setFilter("paid")}
                        className={`px-3 py-1 text-xs font-bold rounded-lg flex items-center gap-1 transition-all ${filter === "paid" ? "bg-emerald-500 text-white" : "text-emerald-600 hover:text-emerald-400"}`}
                    >
                        <BanknotesIcon className="w-3 h-3" /> PAID ONLY
                    </button>
                    <button
                        onClick={() => setFilter("hot")}
                        className={`px-3 py-1 text-xs font-bold rounded-lg flex items-center gap-1 transition-all ${filter === "hot" ? "bg-red-500 text-white" : "text-red-500 hover:text-red-400"}`}
                    >
                        <FireIcon className="w-3 h-3" /> HOT LEADS
                    </button>
                </div>
            </header>

            <div className="flex-1 bg-zinc-900/30 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between text-xs font-bold text-zinc-500 uppercase tracking-widest">
                    <span>From</span>
                    <span>Message</span>
                    <span>Priority Tag</span>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-10 text-center text-zinc-500 italic">Scanning Active Ads & Organic Posts...</div>
                    ) : sortedComments?.length === 0 ? (
                        <div className="p-10 text-center text-zinc-500 italic">No interactions found for this filter.</div>
                    ) : (
                        sortedComments?.map((item: any) => (
                            <div key={item.id} className={`px-6 py-4 border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors flex items-center justify-between group
                                ${item.sentiment === 'PAID' ? 'bg-emerald-900/10' : ''}
                            `}>
                                <div className="flex items-center gap-3 w-1/4">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-600 flex items-center justify-center font-bold text-xs relative">
                                        {item.from_name[0]}
                                        {item.source === 'paid' && (
                                            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-[8px] px-1 rounded-full border border-black">
                                                $
                                            </div>
                                        )}
                                    </div>
                                    <span className="font-bold text-sm text-zinc-300">{item.from_name}</span>
                                </div>

                                <div className="flex-1 pr-8">
                                    <p className="text-sm text-zinc-400 group-hover:text-white transition-colors line-clamp-2">{item.message}</p>
                                    <span className="text-[10px] text-zinc-600 block mt-1 flex items-center gap-2">
                                        {new Date(item.created_time).toLocaleString()}
                                        {item.source === 'paid' && <span className="text-emerald-500 font-bold uppercase tracking-widest text-[8px]">Via Active Ad</span>}
                                    </span>
                                </div>

                                <div className="w-24 flex justify-end">
                                    <div className={`px-3 py-1 rounded-full border flex items-center gap-2 text-[10px] font-bold uppercase
                                        ${item.sentiment === 'PAID' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                            item.sentiment === 'HOT' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                                item.sentiment === 'WARM' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
                                                    'bg-zinc-800 border-zinc-700 text-zinc-500'}
                                    `}>
                                        {getSentimentIcon(item.sentiment)}
                                        {item.sentiment}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Reply Area (Placeholder for now) */}
                <div className="p-4 bg-black border-t border-zinc-800">
                    <input type="text" placeholder="Select a message to reply..." disabled className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none cursor-not-allowed opacity-50" />
                </div>
            </div>
        </div>
    );
}

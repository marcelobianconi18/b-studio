"use client";

import { useState, useEffect } from "react";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

export default function UnifiedInboxPreview() {
    const [counts, setCounts] = useState({ hot: 0, unread: 0 });

    useEffect(() => {
        const fetchInbox = async () => {
            try {
                const res = await fetch("http://localhost:8001/api/social/inbox");
                if (res.ok) {
                    const data = await res.json();

                    // Simple logic to count HOT and Unread (all considered unread for now in preview)
                    const hotCount = data.comments?.filter((c: any) => c.sentiment === 'HOT').length || 0;
                    const totalUnread = data.comments?.length || 0;

                    setCounts({ hot: hotCount, unread: totalUnread });
                }
            } catch (e) {
                console.error("Failed to fetch inbox preview", e);
            }
        };

        fetchInbox();
        const interval = setInterval(fetchInbox, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm h-[300px] flex flex-col">
            <h3 className="font-bold text-zinc-900 mb-3 flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-zinc-600" />
                Leads Quentes (Inbox)
            </h3>

            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl font-black text-red-500">{counts.hot}</span>
                    </div>
                    {counts.unread > 0 && (
                        <div className="absolute -top-1 -right-1 bg-zinc-900 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
                            {counts.unread}
                        </div>
                    )}
                </div>

                <div className="text-sm text-zinc-500">
                    <p className="font-medium text-zinc-900">{counts.hot} leads perguntando preço...</p>
                    <p className="text-xs mt-1">Última mensagem há 5 min.</p>
                </div>

                <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors w-full">
                    Responder Agora
                </button>
            </div>
        </div>
    );
}

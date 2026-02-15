import { ArrowRightIcon, BellAlertIcon, ChatBubbleLeftIcon, ClockIcon } from "@heroicons/react/24/solid";

interface TimelineItem {
    id: string;
    time: string;
    title: string;
    platform: "Instagram" | "Meta Ads" | "TikTok";
    status: "scheduled" | "processing" | "urgent" | "draft";
    description?: string;
}

const timeline: TimelineItem[] = [
    { id: "1", time: "14:00", platform: "Instagram", title: "Post Carrossel", status: "scheduled", description: "Agendado" },
    { id: "2", time: "16:30", platform: "Meta Ads", title: "Escalar Campanha Vencedores", status: "processing", description: "Regra Automática" },
    { id: "3", time: "19:00", platform: "TikTok", title: "Vídeo Reels", status: "draft", description: "Rascunho - Falta Mídia" },
];

export default function ActionTimelineCard() {
    return (
        <div
            className="h-full w-full rounded-3xl p-6 shadow-sm border flex flex-col group hover:border-[#CE6969]/30 transition-all duration-300"
            style={{ backgroundColor: "var(--shell-surface)", borderColor: "var(--shell-border)" }}
        >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">Timeline</h2>
                    <h1 className="text-xl font-black italic tracking-tighter" style={{ color: "var(--foreground)" }}>PRÓXIMAS 24H</h1>
                </div>
                <div className="relative">
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    <BellAlertIcon className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
                </div>
            </div>

            {/* Urgência */}
            <div className="mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center justify-between">
                <div>
                    <div className="px-2 py-1 bg-red-500 text-white rounded-md text-[9px] font-black uppercase tracking-widest inline-block mb-1">Urgente</div>
                    <p className="text-xs font-bold text-red-600 dark:text-red-400">3 Aprovações Pendentes</p>
                    <p className="text-[10px] text-red-500/70">Campanha Black Friday</p>
                </div>
                <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs font-bold shadow-md shadow-red-500/20">
                    Revisar
                </button>
            </div>

            {/* Timeline Vertical */}
            <div
                className="flex-1 space-y-0 relative border-l-2 ml-2 pl-6 pb-2"
                style={{ borderColor: "var(--shell-border)" }}
            >
                {timeline.map((item, index) => (
                    <div key={item.id} className="relative mb-6 last:mb-0 group/item">
                        {/* Dot */}
                        <div
                            className="absolute -left-[31px] w-3 h-3 rounded-full border-2 z-10"
                            style={{
                                borderColor: "var(--shell-surface)",
                                backgroundColor: item.platform === 'Instagram' ? '#A855F7' : // purple-500
                                    item.platform === 'Meta Ads' ? '#3B82F6' : // blue-500
                                        "var(--foreground)"
                            }}
                        ></div>

                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{item.time}</span>
                            <span
                                className={`text-[9px] px-2 py-0.5 rounded-full uppercase font-black tracking-widest ${item.status === 'processing' ? 'bg-blue-500/10 text-blue-500 animate-pulse' : item.status === 'draft' ? 'text-zinc-400' : 'bg-emerald-500/10 text-emerald-500'}`}
                                style={item.status === 'draft' ? { backgroundColor: "var(--shell-side)" } : {}}
                            >
                                {item.platform}
                            </span>
                        </div>
                        <h3 className="text-sm font-bold mt-1" style={{ color: "var(--foreground)" }}>{item.title}</h3>
                        <p className="text-xs text-zinc-500">{item.description}</p>
                    </div>
                ))}
            </div>

            <div
                className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-zinc-400 font-bold uppercase tracking-widest"
                style={{ borderColor: "var(--shell-border)" }}
            >
                <span>Upload em progresso...</span>
                <span className="text-blue-500 animate-pulse">5 arquivos</span>
            </div>
        </div>
    );
}

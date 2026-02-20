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
        <div className="h-full w-full p-6 flex flex-col group transition-all duration-300 bento-cell hover-spring">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-[var(--muted)] text-xs font-bold uppercase tracking-widest mb-1">Timeline</h2>
                    <h1 className="text-xl font-black tracking-tighter text-[var(--foreground)]">PRÓXIMAS 24H</h1>
                </div>
                <div className="relative">
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white/10 animate-pulse"></span>
                    <BellAlertIcon className="w-5 h-5 text-[var(--muted)] dark:text-[var(--muted)]" />
                </div>
            </div>

            {/* Urgência */}
            <div className="mb-6 bg-[white]/10 border border-[white]/20 p-4 rounded-2xl flex items-center justify-between">
                <div>
                    <div className="px-2 py-1 bg-[white] text-[var(--foreground)] rounded-md text-[9px] font-black uppercase tracking-widest inline-block mb-1 shadow-sm">Urgente</div>
                    <p className="text-xs font-bold text-[white]">3 Aprovações Pendentes</p>
                    <p className="text-[10px] text-[white]/70">Campanha Black Friday</p>
                </div>
                <button className="px-4 py-2 bg-[white] text-[var(--foreground)] rounded-lg hover:brightness-110 transition-all text-xs font-bold shadow-md shadow-[white]/20">
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
                                backgroundColor: item.platform === 'Instagram' ? 'var(--muted)' :
                                    item.platform === 'Meta Ads' ? 'white' :
                                        "white"
                            }}
                        ></div>

                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">{item.time}</span>
                            <span
                                className={`text-[9px] px-2 py-0.5 rounded-full uppercase font-black tracking-widest ${item.status === 'processing' ? 'bg-[white]/10 text-[white] animate-pulse' : item.status === 'draft' ? 'text-[var(--muted)]' : 'bg-[var(--muted)]/10 text-[var(--muted)]'}`}
                                style={item.status === 'draft' ? { backgroundColor: "var(--shell-side)" } : {}}
                            >
                                {item.platform}
                            </span>
                        </div>
                        <h3 className="text-sm font-bold mt-1 text-[var(--foreground)]">{item.title}</h3>
                        <p className="text-xs text-[var(--muted)]">{item.description}</p>
                    </div>
                ))}
            </div>

            <div
                className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-[var(--muted)] font-bold uppercase tracking-widest"
                style={{ borderColor: "var(--shell-border)" }}
            >
                <span>Upload em progresso...</span>
                <span className="text-[white] animate-pulse">5 arquivos</span>
            </div>
        </div>
    );
}

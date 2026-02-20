import { ArrowTrendingUpIcon, HeartIcon } from "@heroicons/react/24/solid";

interface AudienceStat {
    type: string;
    value: string;
    growth: string;
    icon: any;
    color: string;
}

const stats: AudienceStat[] = [
    { type: "Instagram", value: "245k", growth: "+1.2%", icon: HeartIcon, color: "text-rose-500" },
    { type: "TikTok", value: "110k", growth: "+3.5%", icon: ArrowTrendingUpIcon, color: "text-pink-500" },
    { type: "YouTube", value: "52k", growth: "+0.8%", icon: ArrowTrendingUpIcon, color: "text-[var(--foreground)]" },
];

export default function AudienceRadarCard() {
    return (
        <div className="h-full w-full p-6 flex flex-col justify-between group transition-all duration-300 bento-cell hover-spring">
            {/* Header */}
            <div>
                <h2 className="text-[var(--muted)] text-xs font-bold uppercase tracking-widest mb-1">Radar de Audiência</h2>
                <h1 className="text-xl font-black tracking-tighter text-[var(--foreground)]">SENTIMENTO IA</h1>
            </div>

            {/* Total Followers */}
            <div className="flex items-baseline gap-2 mt-4">
                <span className="text-3xl font-black text-[var(--foreground)]">407.000</span>
                <span className="text-xs text-[white] font-bold bg-[white]/10 px-2 py-0.5 rounded-full shadow-sm">+1.2% Hoje</span>
            </div>

            {/* Sentiment Thermometer */}
            <div className="my-6">
                <div className="my-6">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-2">
                        <span className="text-[white]">Positivo (80%)</span>
                        <span className="text-[var(--muted)]">Neutro (15%)</span>
                        <span className="text-[white]">Negativo (5%)</span>
                    </div>
                    <div
                        className="h-2 w-full rounded-full flex overflow-hidden shadow-inner"
                        style={{ backgroundColor: "var(--shell-side)" }}
                    >
                        <div className="h-full bg-[white] w-[80%] rounded-l-full shadow-sm"></div>
                        <div className="h-full bg-[var(--muted)] w-[15%]"></div>
                        <div className="h-full bg-[white] w-[5%] rounded-r-full shadow-sm"></div>
                    </div>
                    <p className="text-[10px] text-[var(--muted)] mt-2 text-right">Baseado em NLP das últimas 24h</p>
                </div>

                {/* Insight */}
                <div className="p-3 bg-[var(--muted)]/5 border border-[var(--muted)]/20 rounded-xl relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-1 relative z-10">
                        <ClockIcon className="w-4 h-4 text-[var(--muted)]" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Melhor Horário Hoje</span>
                    </div>
                    <p className="text-lg font-black text-[var(--muted)] relative z-10 drop-shadow-sm">18:45</p>
                    <p className="text-[10px] text-[var(--muted)]/70 relative z-10">Pico de atividade previsto. Sugestão: Postar Story.</p>
                    <div className="absolute -right-10 -top-10 w-24 h-24 bg-[var(--muted)]/20 rounded-full blur-2xl pointer-events-none"></div>
                </div>
            </div>
        </div>
    );
}

function ClockIcon(props: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
        </svg>
    );
}

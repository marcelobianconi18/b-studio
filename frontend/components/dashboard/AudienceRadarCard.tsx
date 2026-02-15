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
    { type: "YouTube", value: "52k", growth: "+0.8%", icon: ArrowTrendingUpIcon, color: "text-red-600" },
];

export default function AudienceRadarCard() {
    return (
        <div
            className="h-full w-full rounded-3xl p-6 shadow-sm border flex flex-col justify-between group hover:border-[#F472B6]/30 transition-all duration-300"
            style={{ backgroundColor: "var(--shell-surface)", borderColor: "var(--shell-border)" }}
        >
            {/* Header */}
            <div>
                <h2 className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">Radar de Audiência</h2>
                <h1 className="text-xl font-black italic tracking-tighter" style={{ color: "var(--foreground)" }}>SENTIMENTO IA</h1>
            </div>

            {/* Total Followers */}
            <div className="flex items-baseline gap-2 mt-4">
                <span className="text-3xl font-black" style={{ color: "var(--foreground)" }}>407.000</span>
                <span className="text-xs text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">+1.2% Hoje</span>
            </div>

            {/* Sentiment Thermometer */}
            <div className="my-6">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
                    <span>Positivo (80%)</span>
                    <span>Neutro (15%)</span>
                    <span className="text-red-500">Negativo (5%)</span>
                </div>
                <div
                    className="h-2 w-full rounded-full flex overflow-hidden"
                    style={{ backgroundColor: "var(--shell-side)" }}
                >
                    <div className="h-full bg-emerald-500 w-[80%] rounded-l-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div>
                    <div className="h-full bg-yellow-500 w-[15%]"></div>
                    <div className="h-full bg-red-500 w-[5%] rounded-r-full shadow-[0_0_5px_rgba(239,68,68,0.5)]"></div>
                </div>
                <p className="text-[10px] text-zinc-500/80 mt-2 text-right italic">Baseado em NLP das últimas 24h</p>
            </div>

            {/* Insight */}
            <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                    <ClockIcon className="w-4 h-4 text-blue-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Melhor Horário Hoje</span>
                </div>
                <p className="text-lg font-black text-blue-500">18:45</p>
                <p className="text-[10px] text-blue-400/70">Pico de atividade previsto. Sugestão: Postar Story.</p>
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

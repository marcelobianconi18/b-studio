"use client";

import {
    HomeIcon,
    ChartBarIcon,
    HashtagIcon,
    ChatBubbleLeftRightIcon,
    Cog6ToothIcon
} from "@heroicons/react/24/solid";

interface SidebarProps {
    activeTab: string;
    onNavigate: (tab: string) => void;
}

export default function Sidebar({ activeTab, onNavigate }: SidebarProps) {
    return (
        <aside className="fixed left-0 top-0 h-full w-64 bg-[#050505] border-r border-zinc-800 flex flex-col z-50">
            {/* Logo Area */}
            <div className="p-6 mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <span className="font-black text-white text-xl italic tracking-tighter">B</span>
                    </div>
                    <div>
                        <h1 className="font-bold text-white tracking-tight">B-Studio</h1>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Enterprise</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-2">
                <NavItem
                    icon={<HomeIcon className="w-5 h-5" />}
                    label="Centro de Comando"
                    isActive={activeTab === "home"}
                    onClick={() => onNavigate("home")}
                />

                <div className="pt-6 pb-2 px-4">
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Gestão de Tráfego</p>
                </div>
                <NavItem
                    icon={<ChartBarIcon className="w-5 h-5" />}
                    label="Gestor de Anúncios"
                    isActive={activeTab === "ads"}
                    onClick={() => onNavigate("ads")}
                />

                <div className="pt-6 pb-2 px-4">
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Estúdio Social</p>
                </div>
                <NavItem
                    icon={<HashtagIcon className="w-5 h-5" />}
                    label="Crescimento Orgânico"
                    isActive={activeTab === "social"}
                    onClick={() => onNavigate("social")}
                />
                <NavItem
                    icon={<ChatBubbleLeftRightIcon className="w-5 h-5" />}
                    label="Inbox Unificado"
                    isActive={activeTab === "inbox"}
                    onClick={() => onNavigate("inbox")}
                />
            </nav>

            {/* Footer / Settings */}
            <div className="p-4 mt-auto border-t border-zinc-900">
                <NavItem
                    icon={<Cog6ToothIcon className="w-5 h-5" />}
                    label="Configurações"
                    isActive={activeTab === "settings"}
                    onClick={() => onNavigate("settings")}
                />

                {/* System Status */}
                <div className="mt-6 bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold text-zinc-400">Sistema Online</span>
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
                            <span>META API</span>
                            <span className="text-emerald-500">Conectado</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
                            <span>AI MODEL</span>
                            <span className="text-blue-500">Qwen2.5</span>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}

const NavItem = ({ icon, label, isActive, onClick }: any) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive
            ? "bg-white text-black shadow-lg shadow-white/5 font-bold"
            : "text-zinc-500 hover:bg-zinc-900 hover:text-white font-medium"
            }`}
    >
        {icon}
        <span className="text-xs">{label}</span>
        {isActive && (
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
        )}
    </button>
);

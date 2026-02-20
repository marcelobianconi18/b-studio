"use client";

import {
    ChartBarSquareIcon,
    Cog6ToothIcon,
    MegaphoneIcon,
    PresentationChartLineIcon,
    UserGroupIcon,
    InboxArrowDownIcon,
    HomeIcon,
    MoonIcon,
    SunIcon
} from "@heroicons/react/24/outline";

interface SidebarProps {
    activeTab: string;
    onNavigate: (tab: string) => void;
    collapsed: boolean;
    onToggleCollapse: () => void;
    theme: "light" | "dark";
    onThemeChange: (theme: "light" | "dark") => void;
}

const NAV_ITEMS = [
    { id: "home", label: "Dashboard", icon: HomeIcon },
    { id: "social", label: "Métrica Social", icon: ChartBarSquareIcon },
    { id: "concorrentes", label: "Concorrentes", icon: UserGroupIcon },
    { id: "ads_metrics", label: "Métrica Ads", icon: PresentationChartLineIcon },
    { id: "ads", label: "Tráfego Pago", icon: MegaphoneIcon },
    { id: "inbox", label: "Mesa de Vendas", icon: InboxArrowDownIcon },
];

export default function Sidebar({
    activeTab,
    onNavigate,
    collapsed,
    onToggleCollapse,
    theme,
    onThemeChange
}: SidebarProps) {
    return (
        <aside className="fixed left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center py-6 gap-5 w-[68px] rounded-[40px] glass-capsule">
            {/* Nav Icons */}
            <nav className="flex-1 flex flex-col items-center gap-4">
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 relative group
                                ${isActive
                                    ? "bg-black/30 text-white shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)]"
                                    : "text-white/60 hover:text-white hover:bg-white/10"
                                }
                            `}
                            title={item.label}
                        >
                            <Icon className={`w-6 h-6 transition-transform ${isActive ? "scale-105" : ""}`} strokeWidth={1.5} />

                            {/* Tooltip */}
                            <span className="absolute left-[60px] bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[999] shadow-xl">
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="flex flex-col items-center gap-4 mt-8">
                <button
                    onClick={() => onNavigate("settings")}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 relative group
                        ${activeTab === "settings"
                            ? "bg-black/30 text-white shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)]"
                            : "text-white/60 hover:text-white hover:bg-white/10"
                        }
                    `}
                    title="Configurações"
                >
                    <Cog6ToothIcon className="w-6 h-6" strokeWidth={1.5} />
                    <span className="absolute left-[60px] bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[999] shadow-xl">
                        Configurações
                    </span>
                </button>

                {/* Dark Mode */}
                <button
                    onClick={() => onThemeChange("dark")}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 relative group
                        ${theme === "dark"
                            ? "bg-black/30 text-white shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)]"
                            : "text-white/60 hover:text-white hover:bg-white/10"
                        }
                    `}
                    title="Modo escuro"
                >
                    <MoonIcon className="w-6 h-6" strokeWidth={1.5} />
                    <span className="absolute left-[60px] bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[999] shadow-xl">
                        Dark Mode
                    </span>
                </button>

                {/* Light Mode */}
                <button
                    onClick={() => onThemeChange("light")}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 relative group
                        ${theme === "light"
                            ? "bg-black/30 text-white shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)]"
                            : "text-white/60 hover:text-white hover:bg-white/10"
                        }
                    `}
                    title="Modo claro"
                >
                    <SunIcon className="w-6 h-6" strokeWidth={1.5} />
                    <span className="absolute left-[60px] bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[999] shadow-xl">
                        Day Light
                    </span>
                </button>
            </div>
        </aside>
    );
}

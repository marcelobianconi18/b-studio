"use client";

import {
    ChartBarSquareIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    Cog6ToothIcon,
    MegaphoneIcon,
    MoonIcon,
    SunIcon,
    PresentationChartLineIcon
} from "@heroicons/react/24/outline";

interface SidebarProps {
    activeTab: string;
    onNavigate: (tab: string) => void;
    collapsed: boolean;
    onToggleCollapse: () => void;
    theme: "light" | "dark";
    onThemeChange: (theme: "light" | "dark") => void;
}


function DashboardIcon(props: React.ComponentProps<"svg">) {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <rect x="3.5" y="3.5" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
            <rect x="13" y="3" width="8" height="8" rx="2.5" fill="currentColor" stroke="none" />
            <rect x="3" y="13" width="8" height="8" rx="2.5" fill="currentColor" stroke="none" />
            <rect x="13.5" y="13.5" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
    );
}

const NAV_ITEMS = [
    { id: "home", label: "Dashboard", icon: DashboardIcon },
    { id: "social", label: "Métrica Social", icon: ChartBarSquareIcon },
    { id: "ads_metrics", label: "Métrica Ads", icon: PresentationChartLineIcon },
    { id: "ads", label: "Tráfego Pago", icon: MegaphoneIcon },
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
        <aside className={`fixed left-0 top-24 h-[calc(100vh-96px)] z-50 flex flex-col bg-transparent transition-all duration-300 items-center ${collapsed ? "w-16" : "w-60"}`}>
            <nav className="pt-5 flex-1 flex flex-col items-center gap-3 w-full">
                <button
                    type="button"
                    onClick={onToggleCollapse}
                    className="w-12 h-12 rounded-full flex items-center justify-center transition-colors"
                    style={{
                        backgroundColor: "var(--shell-side-btn)",
                        color: "var(--foreground)",
                        boxShadow: "0 1px 4px rgba(12,17,27,0.08)"
                    }}
                    title={collapsed ? "Abrir menu" : "Recolher menu"}
                >
                    {collapsed ? <ChevronRightIcon className="w-5 h-5" /> : <ChevronLeftIcon className="w-5 h-5" />}
                </button>

                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`flex items-center transition-all duration-200 
                                ${collapsed
                                    ? "w-12 h-12 rounded-full justify-center"
                                    : "w-52 h-12 rounded-xl justify-start px-4 gap-3"
                                }`}
                            title={item.label}
                            style={{
                                backgroundColor: isActive
                                    ? (theme === "dark" ? "#ffffff" : "var(--ink)")
                                    : "var(--shell-side-btn)",
                                color: isActive
                                    ? (theme === "dark" ? "#000000" : "#ffffff")
                                    : "var(--foreground)",
                                border: theme === "dark"
                                    ? "1px solid rgba(255,255,255,0.12)"
                                    : "1px solid rgba(0,0,0,0.05)",
                                boxShadow: theme === "dark"
                                    ? "0 2px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)"
                                    : "0 1px 2px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.5)"
                            }}
                        >
                            <Icon className="w-5 h-5 shrink-0" />
                            {!collapsed && (
                                <span className="text-xs font-bold uppercase tracking-widest whitespace-nowrap">
                                    {item.label}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            <div className="pb-5 flex flex-col items-center gap-3 w-full">
                <button
                    onClick={() => onThemeChange("dark")}
                    className={`flex items-center transition-all duration-200 
                        ${collapsed
                            ? "w-12 h-12 rounded-full justify-center"
                            : "w-52 h-12 rounded-xl justify-start px-4 gap-3"
                        }`}
                    title="Modo escuro"
                    style={{
                        backgroundColor: theme === "dark" ? "#ffffff" : "var(--shell-side-btn)",
                        color: theme === "dark" ? "#000000" : "var(--foreground)",
                        border: theme === "dark"
                            ? "1px solid rgba(255,255,255,0.12)"
                            : "1px solid rgba(0,0,0,0.05)",
                        boxShadow: theme === "dark"
                            ? "0 2px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)"
                            : "0 1px 2px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.5)"
                    }}
                >
                    <MoonIcon className="w-5 h-5" />
                    {!collapsed && <span className="text-xs font-bold uppercase tracking-widest">Dark Mode</span>}
                </button>

                <button
                    onClick={() => onThemeChange("light")}
                    className={`flex items-center transition-all duration-200 
                        ${collapsed
                            ? "w-12 h-12 rounded-full justify-center"
                            : "w-52 h-12 rounded-xl justify-start px-4 gap-3"
                        }`}
                    title="Modo claro"
                    style={{
                        backgroundColor: theme === "light" ? "var(--ink)" : "var(--shell-side-btn)",
                        color: theme === "light" ? "#ffffff" : "var(--foreground)",
                        border: theme === "dark"
                            ? "1px solid rgba(255,255,255,0.12)"
                            : "1px solid rgba(0,0,0,0.05)",
                        boxShadow: theme === "dark"
                            ? "0 2px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)"
                            : "0 1px 2px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.5)"
                    }}
                >
                    <SunIcon className="w-5 h-5" />
                    {!collapsed && <span className="text-xs font-bold uppercase tracking-widest">Day Light</span>}
                </button>
            </div>
        </aside>
    );
}

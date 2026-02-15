"use client";

import {
    ChartBarSquareIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    Cog6ToothIcon,
    HomeIcon,
    MegaphoneIcon,
    MoonIcon,
    SunIcon,
    UserCircleIcon
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
    { id: "social", label: "Analises", icon: ChartBarSquareIcon },
    { id: "ads", label: "Trafego Pago", icon: MegaphoneIcon },
    { id: "settings", label: "Configuracoes", icon: Cog6ToothIcon },
    { id: "profile", label: "Perfil", icon: UserCircleIcon },
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
        <aside className={`fixed left-0 top-0 h-full z-50 flex flex-col bg-transparent transition-all duration-300 ${collapsed ? "w-[88px]" : "w-64"}`}>
            <div className="px-4 pt-5 pb-4">
                <button
                    type="button"
                    onClick={() => onNavigate("home")}
                    className="flex items-center gap-3"
                    title="B-Studio"
                >
                    <span
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-lg"
                        style={{ backgroundColor: "var(--ink)", boxShadow: "0 2px 6px rgba(12,17,27,0.12)" }}
                    >
                        B
                    </span>
                    {!collapsed && <span className="text-lg font-bold" style={{ color: "var(--foreground)" }}>bstudio</span>}
                </button>
            </div>

            <nav className="px-4 flex-1 flex flex-col gap-3">
                <button
                    type="button"
                    onClick={onToggleCollapse}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${collapsed ? "self-center" : ""}`}
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
                            className={`flex items-center text-left transition-all duration-200 ${collapsed
                                ? "w-12 h-12 rounded-full justify-center self-center"
                                : "w-full h-12 rounded-xl justify-start px-4 gap-3"
                                }`}
                            title={item.label}
                            style={{
                                backgroundColor: isActive ? "var(--ink)" : "var(--shell-side-btn)",
                                color: isActive ? "#ffffff" : "var(--foreground)",
                                boxShadow: "0 1px 4px rgba(12,17,27,0.08)"
                            }}
                        >
                            <Icon className="w-5 h-5 shrink-0" />
                            {!collapsed && (
                                <span className="text-sm font-semibold">
                                    {item.label}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            <div className="px-4 pb-5 flex flex-col gap-3">
                <button
                    onClick={() => onThemeChange("dark")}
                    className="flex items-center gap-3"
                    title="Modo escuro"
                >
                    <span
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{
                            backgroundColor: theme === "dark" ? "var(--ink)" : "var(--shell-side-btn)",
                            color: theme === "dark" ? "#ffffff" : "var(--foreground)",
                            boxShadow: "0 1px 4px rgba(12,17,27,0.08)"
                        }}
                    >
                        <MoonIcon className="w-5 h-5" />
                    </span>
                    {!collapsed && <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Dark</span>}
                </button>

                <button
                    onClick={() => onThemeChange("light")}
                    className="flex items-center gap-3"
                    title="Modo claro"
                >
                    <span
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{
                            backgroundColor: theme === "light" ? "var(--ink)" : "var(--shell-side-btn)",
                            color: theme === "light" ? "#ffffff" : "var(--foreground)",
                            boxShadow: "0 1px 4px rgba(12,17,27,0.08)"
                        }}
                    >
                        <SunIcon className="w-5 h-5" />
                    </span>
                    {!collapsed && <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Day Light</span>}
                </button>
            </div>
        </aside>
    );
}

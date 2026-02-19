import ConnectivityHub from "@/components/ConnectivityHub";

interface LiquidShellProps {
    title: string;
    subtitle: string;
    children: React.ReactNode;
    action?: React.ReactNode;
}

export default function LiquidShell({ title, subtitle, children, action }: LiquidShellProps) {
    return (
        <div className="flex-1 flex flex-col bg-transparent overflow-hidden px-1 pb-5">
            <div className="flex-1 mt-12 flex flex-col min-h-0 relative">
                {/* 
                  1. TOP BORDER ASSEMBLY 
                  Constructed from 3 parts for pixel-perfect liquid curves: 
                  [Left Shoulder] [Liquid Notch SVG] [Right Shoulder]
                */}
                <div className="flex w-full items-end h-[88px] shrink-0 relative z-[100] pointer-events-none">

                    {/* Left Shoulder - Now contains the Title (Transparent) */}
                    <div
                        className="flex-1 h-full rounded-tl-[3.5rem] border-t border-l pointer-events-auto transition-colors duration-300 flex items-end pl-10 pb-5"
                        style={{
                            backgroundColor: "transparent",
                            borderColor: "transparent",
                            borderRight: "none",
                            borderBottom: "1px solid var(--shell-border, rgba(63, 63, 70, 0.4))" // Keep bottom line for continuity with body? Or remove? User circled the area. Let's try transparent first.
                        }}
                    >
                        <div className="flex flex-col relative z-20">
                            <h1 className="text-4xl font-black tracking-tighter transition-colors uppercase" style={{ color: "var(--foreground, #ffffff)" }}>{title}</h1>
                            <p className="text-[10px] uppercase tracking-widest font-black ml-1 transition-colors" style={{ color: "var(--muted, #71717a)" }}>{subtitle}</p>
                        </div>
                    </div>

                    {/* Central Liquid Notch SVG - Visuals hidden as requested */}
                    <div className="relative shrink-0 -mx-[1px] z-40">
                        <svg
                            width="1200"
                            height="88"
                            viewBox="0 0 1200 88"
                            fill="none"
                            className="block transition-colors duration-300"
                            preserveAspectRatio="none"
                        >
                            <path
                                d="M0 0.5 C50 0.5 70 87.5 140 87.5 H1060 C1130 87.5 1150 0.5 1200 0.5 V88 H0 Z"
                                fill="transparent"
                            />
                            {/* Removed stroke to completely hide the "red X" areas */}
                        </svg>

                        {/* Notch Content Container */}
                        <div className="absolute inset-0 top-[12px] flex items-center justify-center pointer-events-auto">
                            <ConnectivityHub />
                        </div>
                    </div>

                    {/* Right Shoulder - Empty as requested (Transparent) */}
                    <div
                        className="flex-1 h-full rounded-tr-[3.5rem] border-t border-r pointer-events-auto transition-colors duration-300 flex items-end justify-end pr-10 pb-5 relative z-[100]"
                        style={{
                            backgroundColor: "transparent",
                            borderColor: "transparent",
                            borderLeft: "none",
                            borderBottom: "none"
                        }}
                    >
                        <div className="relative z-50 w-full flex justify-end">
                            {action}
                        </div>
                    </div>
                </div>

                {/* 
                  2. MAIN BODY 
                  Detached from the top assembly as requested, forming a standalone glass box.
                */}
                <div
                    className="flex-1 border rounded-[2.5rem] p-10 flex flex-col min-h-0 relative mt-4 transition-colors duration-300 liquid-glass"
                    style={{
                        backgroundColor: "var(--shell-surface, #0a0a0a)",
                        borderColor: "var(--shell-border, rgba(63, 63, 70, 0.4))",
                    }}
                >
                    <div className="relative z-20 flex flex-col h-full">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

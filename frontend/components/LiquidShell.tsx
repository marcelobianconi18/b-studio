

interface LiquidShellProps {
    title: string;
    subtitle: string;
    children: React.ReactNode;
    action?: React.ReactNode;
    headerCenter?: React.ReactNode;
}

export default function LiquidShell({ title, subtitle, children, action, headerCenter }: LiquidShellProps) {
    return (
        <div className="flex-1 flex flex-col bg-transparent overflow-hidden pb-4">
            {/* Glass Content Panel */}
            <div className="flex-1 p-8 flex flex-col min-h-0 bento-cell w-full">
                {/* Panel Header */}
                <div className="flex items-end justify-between mb-6 shrink-0 gap-4 relative z-50">
                    <div className="flex flex-col">
                        <h1 className="text-3xl font-black tracking-tighter uppercase transition-colors text-[var(--foreground)] drop-shadow-sm">
                            {title}
                        </h1>
                        <p className="text-[10px] uppercase tracking-widest font-bold ml-0.5 transition-colors text-[var(--muted)]">
                            {subtitle}
                        </p>
                    </div>

                    {headerCenter && (
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 flex items-center justify-center">
                            {headerCenter}
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        {action && <div className="flex items-end">{action}</div>}
                    </div>
                </div>

                {/* Content */}
                <div className="relative z-20 flex flex-col flex-1 min-h-0 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}

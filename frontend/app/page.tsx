import LiquidShell from "@/components/LiquidShell";
import PlanStatusCard from "@/components/dashboard/PlanStatusCard";
import ActionTimelineCard from "@/components/dashboard/ActionTimelineCard";
import AudienceRadarCard from "@/components/dashboard/AudienceRadarCard";
import BlendedMetricsCard from "@/components/dashboard/BlendedMetricsCard";
import WarRoomTerminalCard from "@/components/dashboard/WarRoomTerminalCard";

interface DashboardProps {
    headerCenter?: React.ReactNode;
    action?: React.ReactNode;
}

export default function Dashboard({ headerCenter, action }: DashboardProps) {
    return (
        <LiquidShell title="DASHBOARD" subtitle="COMANDO CENTRAL B-STUDIO" headerCenter={headerCenter} action={action}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full w-full">
                {/* Coluna Esquerda: Status & Calendário */}
                <div className="flex flex-col gap-6 h-full">
                    <div className="flex-1">
                        <PlanStatusCard />
                    </div>
                    <div className="flex-1">
                        <ActionTimelineCard />
                    </div>
                </div>

                {/* Coluna Direita (Larga): Métricas & War Room */}
                <div className="lg:col-span-2 flex flex-col gap-6 h-full">
                    {/* Linha Superior: Social & Ads */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[55%]">
                        <AudienceRadarCard />
                        <BlendedMetricsCard />
                    </div>
                    {/* Linha Inferior: War Room */}
                    <div className="h-[45%]">
                        <WarRoomTerminalCard />
                    </div>
                </div>
            </div>
        </LiquidShell>
    );
}

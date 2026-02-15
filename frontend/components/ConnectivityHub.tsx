"use client";

import { useState, useEffect } from "react";
// PlusIcon removed as requested
import { apiUrl } from "@/lib/api";
import CredentialsModal from "./CredentialsModal";

interface SystemStatus {
    database: "connected" | "disconnected" | "error";
    meta_api: "connected" | "expired" | "error" | "missing_config";
    ai_model: "connected" | "disconnected" | "error";
    meta_token_expiry_days: number;
}

const GROUPS = [
    {
        name: "Meta",
        platforms: [
            {
                id: "meta_ads",
                name: "Meta Ads",
                color: "#0668E1",
                svg: <svg className="w-8 h-8 fill-white" viewBox="0 0 24 24"><path d="M11.944 17.893c-2.001 0-3.531-1.312-3.531-3.321 0-2.01 1.53-3.321 3.531-3.321 2.001 0 3.531 1.311 3.531 3.321 0 2.009-1.53 3.321-3.531 3.321m5.603-3.321c0-3.213-2.311-5.631-5.603-5.631-3.291 0-5.602 2.418-5.602 5.631 0 3.212 2.311 5.631 5.602 5.631 3.292 0 5.603-2.419 5.603-5.631M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0" /></svg>,
                isMain: true
            },
            {
                id: "instagram",
                name: "Instagram Insight",
                color: "#E4405F",
                svg: <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
            },
            {
                id: "facebook_insights",
                name: "Facebook Insights",
                color: "#1877F2",
                svg: <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24"><path d="M2 13h4v8H2v-8zM7 3h4v18H7V3zm5 10h4v8h-4v-8zm5-5h4v13h-4V8z" /></svg>
            }
        ]
    },
    {
        name: "Google",
        platforms: [
            {
                id: "google_analytics",
                name: "Google Analytics",
                color: "#E37400",
                svg: <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24"><path d="M6 20h4v-8H6v8zm7 0h4V4h-4v16zm7 0h4v-5h-4v5zm-14 0H2v-3h4v3z" /></svg>
            },
            {
                id: "google_business",
                name: "Google Meu Negócio",
                color: "#4285F4",
                svg: <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" /></svg>
            },
            {
                id: "google_ads",
                name: "Google Ads",
                color: "#4285F4",
                svg: <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24"><path d="M21.35 11.1h-9.35v2.73h5.39c-.23 1.25-.94 2.3-1.99 3l3.23 2.5a9 9 0 1 0-6.63-1.48L9.77 15.35a5.4 5.4 0 1 1 3.58-1.52h-1.35V11.1h9.35z" /></svg>
            },
            {
                id: "youtube_ads",
                name: "YouTube Ads",
                color: "#FF0000",
                svg: <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
            }
        ]
    },
    {
        name: "TikTok",
        platforms: [
            {
                id: "tiktok_business",
                name: "TikTok for Business",
                color: "#000000",
                svg: <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>
            },
            {
                id: "tiktok_organic",
                name: "TikTok Organic",
                color: "#000000",
                svg: <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.9-.32-1.89-.23-2.73.24-1.03.62-1.61 1.78-1.57 2.97.02 1.48.96 2.87 2.41 3.16.89.28 1.91.07 2.6-.48.65-.54 1.05-1.32 1.07-2.16.03-4.56.03-9.12.02-13.68z" /></svg>
            }
        ]
    },
    {
        name: "LinkedIn",
        platforms: [
            {
                id: "linkedin_ads",
                name: "LinkedIn Ads",
                color: "#0A66C2",
                svg: <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
            },
            {
                id: "linkedin_pages",
                name: "LinkedIn Company Pages",
                color: "#0A66C2",
                svg: <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24"><path d="M22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.454C23.208 24 24 23.227 24 22.271V1.729C24 .774 23.208 0 22.225 0zM7.12 20.452H3.558V9h3.562v11.452zM5.339 7.433c-1.139 0-2.062-.924-2.062-2.062 0-1.139.924-2.062 2.062-2.062 1.139 0 2.062.924 2.062 2.062 0 1.138-.923 2.062-2.062 2.062zM20.451 20.452h-3.563v-5.577c0-1.33-.025-3.045-1.855-3.045-1.859 0-2.142 1.45-2.142 2.95v5.672h-3.563V9h3.42V10.564h.048c.476-.9 1.637-1.851 3.367-1.851 3.605 0 4.27 2.371 4.27 5.456v7.283z" /></svg>
            }
        ]
    }
];

export default function ConnectivityHub() {
    const [status, setStatus] = useState<SystemStatus | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch(apiUrl("/api/system/status"));
                if (res.ok) {
                    setStatus(await res.json());
                }
            } catch (e) {
                console.error("Status check failed", e);
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 60000);
        return () => clearInterval(interval);
    }, []);

    const isConnected = (platformId: string) => {
        if (!status) return false;
        if (platformId === "meta_ads" || platformId === "facebook_insights" || platformId === "instagram") {
            return status.meta_api === "connected";
        }
        return false; // Default for others
    };

    return (
        <div className="flex items-center justify-center gap-3">
            {GROUPS.map((group, gIdx) => (
                <div key={group.name} className="flex items-center gap-2 no-shrink">
                    {group.platforms.map((platform) => (
                        <div key={platform.id} className="group relative">
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 relative shadow-md hover:shadow-xl
                                    ${isConnected(platform.id) ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-[#0a0a0a]' : ''}
                                `}
                                style={{ backgroundColor: platform.color }}
                                title={platform.name}
                            >
                                {/* Force SVG size if possible, or wrap */}
                                <div className="w-7 h-7 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:fill-white">
                                    {platform.svg}
                                </div>

                                {/* Status Bit */}
                                <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-[#050505] shadow-sm
                                    ${isConnected(platform.id) ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}
                                `} />
                            </button>

                            {/* Tooltip */}
                            <div className="absolute top-20 left-1/2 -translate-x-1/2 px-3 py-1 bg-zinc-900 border border-zinc-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap shadow-2xl">
                                <span className="text-[10px] font-black text-white uppercase tracking-tighter">{platform.name}</span>
                            </div>
                        </div>
                    ))}

                    {/* Minimal Visual Separator between groups except last */}
                    {gIdx < GROUPS.length - 1 && (
                        <div className="w-[1px] h-8 bg-zinc-800/20 mx-2" />
                    )}
                </div>
            ))}

            <CredentialsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}


"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { apiUrl } from "@/lib/api";

declare global {
    interface Window {
        FB: any;
        fbAsyncInit: () => void;
    }
}

export default function LoginPage() {
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");
    const [fbAppId, setFbAppId] = useState("");
    const [sdkReady, setSdkReady] = useState(false);
    const [manualCheckReady, setManualCheckReady] = useState(false);
    const exchangeInFlightRef = useRef(false);

    const fallbackAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || "";

    useEffect(() => {
        const loadAppConfig = async () => {
            try {
                const res = await fetch(apiUrl("/api/system/credentials"));
                const data = await res.json();
                const configuredAppId = typeof data?.meta_app_id === "string" ? data.meta_app_id.trim() : "";
                setFbAppId(configuredAppId || fallbackAppId);
            } catch {
                setFbAppId(fallbackAppId);
            }
        };

        loadAppConfig();
    }, [fallbackAppId]);

    useEffect(() => {
        if (!fbAppId || typeof window === "undefined") return;

        window.fbAsyncInit = function () {
            if (!window.FB) return;
            window.FB.init({
                appId: fbAppId,
                cookie: true,
                xfbml: true,
                version: "v19.0",
            });
            setSdkReady(true);
        };

        if (window.FB) {
            window.fbAsyncInit();
        }
    }, [fbAppId]);

    const completeLogin = async (token: string) => {
        if (!token || exchangeInFlightRef.current) return;
        exchangeInFlightRef.current = true;
        setStatus("loading");
        await exchangeToken(token);
        exchangeInFlightRef.current = false;
    };

    const checkExistingMetaSession = () => {
        if (!sdkReady || !window.FB || exchangeInFlightRef.current) return;
        window.FB.getLoginStatus((response: any) => {
            if (response?.status === "connected" && response?.authResponse?.accessToken) {
                completeLogin(response.authResponse.accessToken);
                return;
            }
            setManualCheckReady(true);
        });
    };

    useEffect(() => {
        if (!sdkReady) return;

        checkExistingMetaSession();

        const onFocus = () => checkExistingMetaSession();
        const onVisible = () => {
            if (document.visibilityState === "visible") {
                checkExistingMetaSession();
            }
        };

        window.addEventListener("focus", onFocus);
        document.addEventListener("visibilitychange", onVisible);

        return () => {
            window.removeEventListener("focus", onFocus);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, [sdkReady]);

    const handleLogin = () => {
        if (!fbAppId) {
            setStatus("error");
            setMessage("Meta App ID não configurado. Preencha no onboarding e tente novamente.");
            return;
        }

        if (!sdkReady || !window.FB) {
            setStatus("error");
            setMessage("SDK do Facebook ainda não carregou. Aguarde alguns segundos e tente novamente.");
            return;
        }

        setStatus("loading");
        setMessage("");
        window.FB.login(
            (response: any) => {
                if (response.authResponse) {
                    completeLogin(response.authResponse.accessToken);
                } else {
                    setStatus("error");
                    setMessage("Não foi possível concluir no Meta Login. Verifique se o OAuth Web está ativo e se os domínios do app incluem localhost.");
                }
            },
            {
                scope: "public_profile,email,ads_management,ads_read,pages_manage_posts,pages_read_engagement,business_management",
                auth_type: "rerequest",
                return_scopes: true,
            }
        );
    };

    const exchangeToken = async (token: string) => {
        try {
            const res = await fetch(apiUrl("/api/auth/facebook"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ access_token: token }),
            });

            const data = await res.json();
            if (data.status === "success") {
                setStatus("success");
                setMessage("Conexão estabelecida! O B-Studio agora tem acesso vitalício (60 dias).");
                const params = new URLSearchParams(window.location.search);
                const isOnboardingFlow = params.get("auth_flow") === "meta_onboarding";
                const destination = isOnboardingFlow ? "/?auth_success=true" : "/";
                setTimeout(() => {
                    window.location.href = destination;
                }, 900);
            } else {
                throw new Error(data.detail || "Erro ao trocar token");
            }
        } catch (err: any) {
            setStatus("error");
            setMessage(err.message);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] font-sans selection:bg-blue-500/30">
            <Script
                async
                defer
                crossOrigin="anonymous"
                src="https://connect.facebook.net/pt_BR/sdk.js"
                onLoad={() => {
                    if (window.fbAsyncInit) {
                        window.fbAsyncInit();
                    }
                }}
            />

            {/* Background Animated Gradients */}
            <div className="fixed inset-0 overflow-hidden -z-10">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full animate-pulse" />
            </div>

            <main className="relative w-full max-w-md p-8 bg-zinc-900/50 border border-zinc-800 rounded-3xl backdrop-blur-xl shadow-2xl">
                <div className="flex flex-col items-center text-center space-y-6">
                    <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <svg className="w-10 h-10 text-white fill-current" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight text-white bg-clip-text">
                            B-Studio Command
                        </h1>
                        <p className="text-zinc-400 text-sm">
                            Conecte sua conta Meta para começar a automação.
                        </p>
                    </div>

                    <div className="w-full space-y-4 pt-4">
                        {status === "idle" && (
                            <>
                                <button
                                    onClick={handleLogin}
                                    disabled={!fbAppId}
                                    className="group relative w-full h-14 bg-white text-black font-semibold rounded-2xl overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <span className="relative z-10 group-hover:text-white transition-colors flex items-center justify-center gap-3">
                                        Conectar com Facebook
                                    </span>
                                </button>
                                {manualCheckReady && (
                                    <button
                                        onClick={checkExistingMetaSession}
                                        className="text-xs text-zinc-500 hover:text-white transition-colors"
                                    >
                                        Ja autorizei na Meta, continuar
                                    </button>
                                )}
                            </>
                        )}

                        {status === "loading" && (
                            <div className="flex flex-col items-center gap-4 py-4">
                                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                <p className="text-zinc-400 text-sm font-medium">Autenticando...</p>
                            </div>
                        )}

                        {status === "success" && (
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-sm">
                                <p className="font-semibold mb-1">Conectado com sucesso!</p>
                                <p className="opacity-80 leading-relaxed text-xs">
                                    {message} Redirecionando para o Dashboard...
                                </p>
                            </div>
                        )}

                        {status === "error" && (
                            <div className="space-y-4">
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
                                    <p className="font-semibold mb-1">Falha na conexão</p>
                                    <p className="opacity-80 text-xs">{message}</p>
                                </div>
                                <button
                                    onClick={() => setStatus("idle")}
                                    className="text-zinc-500 text-xs hover:text-white transition-colors"
                                >
                                    Tentar novamente
                                </button>
                            </div>
                        )}
                    </div>

                    <footer className="pt-8 w-full border-t border-zinc-800/50">
                        <div className="flex justify-between items-center px-2">
                            <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Secure Auth v1</span>
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                <span className="text-[10px] text-zinc-500 font-medium">{fbAppId ? "App ID carregado" : "Configurar App ID"}</span>
                            </div>
                        </div>
                    </footer>
                </div>
            </main>
        </div>
    );
}

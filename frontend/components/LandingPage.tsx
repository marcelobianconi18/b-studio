"use client";

import Link from "next/link";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden relative flex flex-col">
            {/* Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[20%] w-[50vw] h-[50vw] bg-blue-900/15 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-20%] right-[10%] w-[40vw] h-[40vw] bg-purple-900/10 rounded-full blur-[120px]" />
            </div>

            {/* Nav */}
            <nav className="relative z-10 flex items-center justify-between px-8 md:px-16 py-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-black text-sm text-white shadow-lg">
                        bia
                    </div>
                    <span className="text-sm font-bold tracking-widest text-white/60 uppercase hidden sm:inline">
                        Bianconi Intelligence
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <a href="/privacy" className="text-xs text-white/40 hover:text-white/70 transition-colors">
                        Privacidade
                    </a>
                    <a
                        href="/#/dashboard"
                        className="px-5 py-2 bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-semibold rounded-xl transition-all"
                    >
                        Entrar
                    </a>
                </div>
            </nav>

            {/* Hero */}
            <main className="flex-1 flex flex-col items-center justify-center text-center px-6 relative z-10 -mt-16">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-8 border border-blue-500/20 bg-blue-900/10 text-blue-400 backdrop-blur-sm">
                    ✦ Plataforma de Inteligência para Marketing
                </div>

                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-6">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/60">
                        bia
                    </span>
                </h1>

                <p className="text-lg md:text-xl text-white/40 max-w-xl mx-auto leading-relaxed mb-4">
                    Bianconi Intelligence for Ads
                </p>

                <p className="text-sm text-white/25 max-w-md mx-auto mb-12">
                    Métricas sociais, análise de concorrentes, IA estrategista e gestão de campanhas — tudo em um único painel.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <a
                        href="/#/dashboard"
                        className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20"
                    >
                        Acessar Dashboard
                    </a>
                    <Link
                        href="/login"
                        className="px-8 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-sm font-semibold rounded-xl transition-all"
                    >
                        Conectar Conta Meta
                    </Link>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 text-center py-8">
                <p className="text-xs text-white/20">
                    &copy; {new Date().getFullYear()} Bianconi Estratégia &amp; Marketing
                </p>
            </footer>
        </div>
    );
}

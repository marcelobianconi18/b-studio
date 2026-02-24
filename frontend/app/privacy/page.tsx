"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function PrivacyPage() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const today = new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });

    return (
        <div className="min-h-screen bg-[#0f0518] text-white selection:bg-purple-500/30 overflow-x-hidden relative">
            {/* Background Atmosphere */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-purple-900/20 rounded-full blur-[120px]" style={{ animation: "pulse 4s ease-in-out infinite" }} />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-blue-900/10 rounded-full blur-[120px]" style={{ animation: "pulse 4s ease-in-out infinite 1s" }} />
                <div className="absolute top-[20%] right-[10%] w-[20vw] h-[20vw] bg-indigo-900/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 font-sans">
                {/* Simple Navbar */}
                <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#0f0518]/70 border-b border-white/5">
                    <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-black text-xs text-white shadow-lg">
                                bia
                            </div>
                            <span className="text-sm font-bold tracking-wider text-white/80 group-hover:text-white transition-colors">
                                BIANCONI INTELLIGENCE
                            </span>
                        </Link>
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                            </svg>
                            Voltar
                        </Link>
                    </div>
                </nav>

                <div className="max-w-4xl mx-auto px-6 pt-32 pb-24">

                    {/* Header */}
                    <div className="mb-16 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6 border border-emerald-500/20 bg-emerald-900/10 text-emerald-400 backdrop-blur-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                            </svg>
                            Compliance &amp; LGPD
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
                            Política de Privacidade e <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Soberania de Dados</span>
                        </h1>
                        <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
                            BIA - Bianconi Intelligence for Ads <br />
                            <span className="text-sm uppercase tracking-widest text-white/40 mt-2 block">Mantida por Bianconi Estratégia &amp; Marketing</span>
                        </p>
                        <p className="mt-8 text-xs font-mono text-white/30 uppercase tracking-widest">Última Atualização: {today}</p>
                    </div>

                    <div className="p-8 md:p-12 rounded-3xl border border-white/5 bg-[#030005]/60 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
                        {/* Glass Reflection */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                        <div className="space-y-16 relative z-10">

                            {/* 1. Introdução */}
                            <section>
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-4">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-white/80 text-sm font-mono border border-white/10">01</span>
                                    Introdução e Compromisso
                                </h2>
                                <div className="text-white/70 leading-relaxed space-y-4 text-justify">
                                    <p>
                                        A <strong className="text-white">BIA (Bianconi Intelligence for Ads)</strong> é uma plataforma SaaS de Inteligência para Marketing Digital projetada sob o princípio da Soberania de Dados. A BIA opera em uma arquitetura híbrida ou Self-Hosted (baseada em containers Docker), garantindo que a inteligência estratégica do seu negócio permaneça sob seu controle.
                                    </p>
                                    <p>
                                        Esta política descreve como tratamos os dados processados pelos nossos motores de inteligência (Estrategista IA, Meta Ads Insights e Análise de Concorrentes), assegurando transparência total.
                                    </p>
                                </div>
                            </section>

                            {/* 2. Dados Coletados */}
                            <section>
                                <h2 className="text-2xl font-bold mb-8 flex items-center gap-4">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-white/80 text-sm font-mono border border-white/10">02</span>
                                    Dados Que Coletamos
                                </h2>
                                <div className="grid gap-6">
                                    {/* Card 2.1 */}
                                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-3 font-bold text-lg mb-3 text-purple-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                            </svg>
                                            2.1. Credenciais de API e Tokens (O &quot;Cofre&quot;)
                                        </div>
                                        <p className="mb-4 text-white/60 text-sm">Para integrar com plataformas de terceiros, o sistema armazena localmente em seu ambiente seguro:</p>
                                        <ul className="list-disc list-inside space-y-2 ml-2 text-white/70 text-sm">
                                            <li><strong>Tokens de Acesso:</strong> Meta Ads, Google Ads, TikTok Ads e LinkedIn Ads.</li>
                                            <li><strong>Chaves de IA:</strong> Google Gemini API Key, OpenAI API Key ou Qwen API Key.</li>
                                        </ul>
                                        <div className="mt-4 pt-4 border-t border-white/10 text-xs text-white/40">
                                            <strong className="text-emerald-400">Segurança:</strong> Em Self-Hosted, residem no arquivo .env do seu container Docker privado.
                                        </div>
                                    </div>

                                    {/* Card 2.2 */}
                                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-3 font-bold text-lg mb-3 text-cyan-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                                            </svg>
                                            2.2. Dados de Redes Sociais e Anúncios
                                        </div>
                                        <ul className="list-disc list-inside space-y-2 ml-2 text-white/70 text-sm">
                                            <li><strong>Métricas Sociais:</strong> Insights de Instagram, Facebook, alcance, engajamento e crescimento de audiência.</li>
                                            <li><strong>Performance de Campanhas:</strong> Métricas de campanhas Meta Ads (CPM, CPC, ROAS, conversões).</li>
                                            <li><strong>Análise de Concorrentes:</strong> Dados públicos de perfis concorrentes para benchmarking.</li>
                                        </ul>
                                    </div>

                                    {/* Card 2.3 */}
                                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-3 font-bold text-lg mb-3 text-orange-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                                            </svg>
                                            2.3. Identidade (Auth)
                                        </div>
                                        <p className="text-white/70 text-sm">Informações de login (E-mail e Senha Criptografada) geridas pelo nosso serviço de autenticação seguro.</p>
                                    </div>
                                </div>
                            </section>

                            {/* 3. AI */}
                            <section>
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-4">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-white/80 text-sm font-mono border border-white/10">03</span>
                                    Uso de Inteligência Artificial
                                </h2>
                                <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20">
                                    <p className="mb-4 text-white/80">A BIA utiliza modelos de linguagem avançados (como Qwen, Google Gemini e OpenAI) para processar estratégias de marketing.</p>
                                    <ul className="space-y-3 text-sm">
                                        <li className="flex gap-3">
                                            <span className="text-emerald-400 font-bold whitespace-nowrap">O que é enviado:</span>
                                            <span className="text-white/60">Apenas o contexto do briefing (produto, objetivo, métricas agregadas) para geração de insights estratégicos.</span>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="text-red-400 font-bold whitespace-nowrap">O que NÃO é enviado:</span>
                                            <span className="text-white/60">Não enviamos dados pessoais sensíveis (PII) de clientes finais. A BIA atua com análise estatística agregada.</span>
                                        </li>
                                    </ul>
                                </div>
                            </section>

                            {/* 4. Terceiros */}
                            <section>
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-4">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-white/80 text-sm font-mono border border-white/10">04</span>
                                    Integração com Terceiros
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {[
                                        { title: "Meta Business", subtitle: "Ads & Insights" },
                                        { title: "Google Ads", subtitle: "Campanhas & Analytics" },
                                        { title: "TikTok Ads", subtitle: "Performance & Alcance" },
                                    ].map((item, i) => (
                                        <div key={i} className="p-4 rounded-xl text-center bg-white/5 border border-white/10">
                                            <div className="font-bold text-white">{item.title}</div>
                                            <div className="text-xs mt-1 text-white/40">{item.subtitle}</div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* 5. Armazenamento */}
                            <section>
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-4">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-white/80 text-sm font-mono border border-white/10">05</span>
                                    Armazenamento e Retenção
                                </h2>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="font-bold mb-3 flex items-center gap-2 text-white">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4.5 h-4.5 text-indigo-400">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-16.5-3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3m-19.5 0a4.5 4.5 0 0 1 .9-2.7L5.737 5.1a3.375 3.375 0 0 1 2.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 0 1 .9 2.7m0 0a3 3 0 0 1-3 3m0 3h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Zm-3 6h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Z" />
                                            </svg>
                                            Arquitetura Self-Hosted
                                        </h3>
                                        <p className="text-sm leading-relaxed text-white/60">
                                            Você é o controlador total. A Bianconi não tem acesso ao seu banco de dados, logs ou chaves. A exclusão depende da sua gestão do container.
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="font-bold mb-3 flex items-center gap-2 text-white">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4.5 h-4.5 text-indigo-400">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                            </svg>
                                            Arquitetura Cloud (Coolify)
                                        </h3>
                                        <p className="text-sm leading-relaxed text-white/60">
                                            Dados armazenados em bancos isolados com criptografia. Mantemos enquanto a assinatura estiver ativa. Após cancelamento, os dados são excluídos em até 30 dias.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* 6. Direitos */}
                            <section>
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-4">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-white/80 text-sm font-mono border border-white/10">06</span>
                                    Seus Direitos (LGPD)
                                </h2>
                                <ul className="list-disc list-inside space-y-3 ml-2 text-white/70">
                                    <li><strong>Acesso e Portabilidade:</strong> Exportar relatórios e dados (JSON/CSV) diretamente na plataforma.</li>
                                    <li><strong>Revogação:</strong> Remover chaves de API e desconectar integrações a qualquer momento.</li>
                                    <li><strong>Exclusão:</strong> Solicitar exclusão total da conta e dados em <a href="/profile/exclusao-de-dados" className="text-indigo-400 hover:text-indigo-300 underline transition-colors">Perfil → Exclusão de Dados</a>.</li>
                                </ul>
                            </section>

                            {/* 7. DPO Contact */}
                            <div className="mt-12 p-8 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 text-center">
                                <h3 className="text-lg font-bold mb-2 text-white">7. Encarregado de Dados (DPO)</h3>
                                <p className="text-sm mb-6 text-white/60">Para questões técnicas ou legais sobre seus dados:</p>
                                <div className="inline-block text-left bg-[#0f0518]/80 p-6 rounded-xl border border-white/10 backdrop-blur-md">
                                    <p className="font-bold text-indigo-300 mb-1">Bianconi - Estratégia &amp; Marketing</p>
                                    <p className="text-sm text-white/80">Email: <a href="mailto:suporte@bianconimkt.com" className="text-indigo-400 hover:text-indigo-300 transition-colors">suporte@bianconimkt.com</a></p>
                                    <p className="text-sm text-white/80">Assunto: Privacidade BIA</p>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="border-t border-white/5 py-12 text-center">
                    <p className="text-sm text-white/30">
                        &copy; {new Date().getFullYear()} Bianconi Estratégia &amp; Marketing. Todos os direitos reservados.
                    </p>
                    <p className="text-xs text-white/20 mt-2">
                        bia - Bianconi Intelligence for Ads
                    </p>
                </footer>
            </div>

            <style jsx>{`
                @keyframes pulse {
                    0%, 100% { opacity: 0.6; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.05); }
                }
            `}</style>
        </div>
    );
}

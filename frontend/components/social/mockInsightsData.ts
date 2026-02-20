/**
 * Mock data generators for Social Insights.
 *
 * All numbers are internally consistent:
 *   - engagements.value  === actions_split.reactions + comments + shares
 *   - total_reactions     === Σ reactions_by_type values
 *   - countries percentages sum ≈ 100%
 *   - cities percentages  ≤ top-country percentage
 *   - demographics age male+female uses %
 *
 * When real Meta APIs are connected the backend will serve live data and
 * these generators become the offline fallback only.
 */

import type { InsightsData, Competitor } from "./SocialInsights";

/* ------------------------------------------------------------------ */
/*  Helper: generate competitors                                       */
/* ------------------------------------------------------------------ */

export function generateMockCompetitors(): Competitor[] {
    const names = [
        { name: "Concept Art", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=CA" },
        { name: "Studio Design", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=SD" },
        { name: "Criativo Lab", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=CL" },
        { name: "Hotmart", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=HM" },
        { name: "Viver de Blog", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=VB" },
        { name: "Rock Content", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=RC" },
        { name: "Neil Patel Brasil", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=NP" },
        { name: "Méliuz", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=MZ" },
        { name: "Nubank", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=NB" },
        { name: "XP Investimentos", avatar: "https://api.dicebear.com/7.x/initials/svg?seed=XP" },
    ];

    // Rich data for the first 3 competitors
    const richData = [
        {
            swot: {
                strengths: [
                    "Alta taxa de engajamento em vídeos curtos (Reels)",
                    "Comunidade fiel e ativa nos comentários",
                    "Estética visual consistente e reconhecível"
                ],
                weaknesses: [
                    "Baixa frequência de postagem nos finais de semana",
                    "Pouca diversificação de formatos (foco excessivo em estático)",
                    "Tempo de resposta aos comentários é alto"
                ],
                opportunities: [
                    "Explorar mais lives para aumentar conexão",
                    "Colaborações com influenciadores do nicho",
                    "Utilizar mais recursos interativos nos Stories"
                ],
                threats: [
                    "Mudanças no algoritmo penalizando alcance orgânico",
                    "Saturação do tema principal de conteúdo"
                ]
            },
            strategicInsight: "📊 **Análise de Mercado:** A *Concept Art* se posicionou como a vitrine estética do setor, focando 100% em visual de alto impacto. Eles dominaram o nicho de 'inspiração', mas criaram uma barreira de distanciamento com a audiência.\n\n⚠️ **Ponto Cego (Blind Spot):** Eles ignoram completamente a etapa de 'educação' e 'conexão'. Seus posts têm muitos likes, mas baixíssima conversão em conversas reais (comentários são vazios de significado).\n\n🚀 **Sua Oportunidade de Ouro:**\nEnquanto eles buscam *admiradores*, você buscará *clientes*.\n1. **Conteúdo Híbrido:** Não poste apenas a foto bonita (como eles). Poste a foto E o bastidor 'feio' de como foi feito. Isso gera autoridade real e quebra a perfeição inalcançável deles.\n2. **Ciclo de Fim de Semana:** Eles 'desligam' na sexta-feira. Programe seus melhores conteúdos de engajamento (lives, caixinhas de pergunta) para Sábado às 10h e Domingo às 18h. Você nadará de braçada num oceano sem concorrentes por 48h."
        },
        {
            swot: {
                strengths: ["Design de alta qualidade", "Boa autoridade técnica"],
                weaknesses: ["Textos muito longos e técnicos", "Pouca humanização da marca"],
                opportunities: ["Simplificar a linguagem", "Mostrar o rosto nos stories"],
                threats: ["Perda de interesse do público iniciante"]
            },
            strategicInsight: "📊 **Análise de Mercado:** O *Studio Design* joga o jogo da 'autoridade técnica'. Seus posts são densos, cheios de jargões e focados em pares (outros designers), não em clientes finais.\n\n⚠️ **Ponto Cego (Blind Spot):** Eles sofrem da 'Maldição do Conhecimento'. O cliente leigo se sente intimidado e confuso ao consumir o conteúdo deles, o que gera admiração mas pouca venda direta.\n\n🚀 **Sua Oportunidade de Ouro:**\nSeja o tradutor do mercado.\n1. **Humanização Didática:** Pegue os temas complexos que eles abordam e explique com analogias do dia a dia. Use vídeos de 'rosto' (que eles não fazem) para gerar confiança.\n2. **Acolhimento na Bio:** Enquanto a bio deles diz 'Especialistas em UX/UI', a sua deve dizer 'Transformamos sua ideia em app'. Ataque a dor do cliente, não a técnica."
        },
        {
            swot: {
                strengths: ["Uso criativo de Reels", "Tendências em tempo real"],
                weaknesses: ["Identidade visual inconsistente", "Feed bagunçado"],
                opportunities: ["Criar quadros fixos", "Melhorar a bio"],
                threats: ["Cópia de conteúdo por outros"]
            },
            strategicInsight: "📊 **Análise de Mercado:** O *Criativo Lab* aposta tudo no viral e na tendência do momento. Eles crescem em 'picos' (viralização), mas sofrem para manter a audiência engajada quando o assunto esfria.\n\n⚠️ **Ponto Cego (Blind Spot):** Eles produzem muito *topo de funil* (atração) mas quase nada de *meio e fundo* (retenção e venda). O feed é uma vitrine de 'trends', não uma construção de autoridade sólida.\n\n🚀 **Sua Oportunidade de Ouro:**\n1. **Seja o Porto Seguro:** Enquanto eles entregam o 'caos criativo', entregue o 'método organizado'. Crie carrosséis que explicam o *porquê* das tendências, não apenas as replicam.\n2. **Converta a Audiência Deles:** Use anúncios direcionados para 'interesses em design/criatividade' com uma copy focada em 'Cansado de seguir trends? Aprenda a criar estratégia'. Você captará a fatia madura do público deles que busca profundidade."
        }
    ];

    return names.map((c, i) => {
        const followers = 500000 + (names.length - i) * 150000 + Math.floor(Math.random() * 50000);

        // Use rich data if available, otherwise generic
        const swot = richData[i]?.swot || {
            strengths: ["Boa presença digital", "Postagens frequentes"],
            weaknesses: ["Interação limitada", "Legendas curtas"],
            opportunities: ["Expandir para novas redes", "Parcerias locais"],
            threats: ["Novos entrantes", "Mudança de algoritmo"]
        };

        const strategicInsight = richData[i]?.strategicInsight || "📊 **Análise Geral:** Este concorrente mantém uma atuação estável. **Sua Ação:** Monitore as hashtags que eles usam e tente superar a qualidade visual dos posts deles nas mesmas temáticas.";

        // Generate 3 random posts for each competitor
        const topPosts = Array.from({ length: 3 }).map((_, pIdx) => {
            const isVideo = Math.random() > 0.6;
            const engagementBase = (Math.random() * 2000) + (15000 / (i + 1)); // Higher rank = higher engagement
            const likes = Math.floor(engagementBase);
            const comments = Math.floor(engagementBase * 0.05);
            const shares = Math.floor(engagementBase * 0.02);
            const reactions = likes + Math.floor(engagementBase * 0.1); // Likes + others
            const reach = Math.floor(engagementBase * (2 + Math.random() * 3));
            const impressions = Math.floor(reach * 1.2);
            const video_views = isVideo ? Math.floor(reach * 0.8) : 0;
            const link_clicks = Math.floor(reach * 0.01);

            return {
                id: `post-${i}-${pIdx}`,
                image: `https://placehold.co/400x400/png?text=Post+${pIdx + 1}`,
                message: `Conteúdo estratégico sobre ${["marketing", "vendas", "design", "tecnologia"][Math.floor(Math.random() * 4)]} focando em resultados...`,
                date: "12/02/2026",
                likes,
                comments,
                shares,
                reach,
                impressions,
                video_views,
                link_clicks,
                reactions,
                type: (isVideo ? "video" : "photo") as "video" | "photo" | "album"
            };
        });

        return {
            id: `comp-${i + 1}`,
            name: c.name,
            avatar: c.avatar,
            followers,
            followersChange: 1.2 + Math.random() * 2,
            engagementRate: 2.5 + Math.random() * 3,
            engagementChange: -5 + Math.random() * 15,
            totalPosts: 45 + Math.floor(Math.random() * 30),
            recentGrowth: 2000 + Math.floor(Math.random() * 5000),
            weeklyPosts: 3 + Math.floor(Math.random() * 10),
            totalLikes: 1000 + Math.floor(Math.random() * 50000),
            totalComments: 50 + Math.floor(Math.random() * 2000),
            avgInteractions: 50 + Math.floor(Math.random() * 500),
            swot,
            strategicInsight,
            topPosts: topPosts,
            audience: {
                age: [
                    { label: "-18", value: 0.15 },
                    { label: "18-24", value: 0.30 },
                    { label: "25-34", value: 0.25 },
                    { label: "35-44", value: 0.15 },
                    { label: "45-54", value: 0.08 },
                    { label: "55-64", value: 0.05 },
                    { label: "+65", value: 0.02 }
                ],
                gender: [
                    { label: "Mulheres", value: 0.60 + (Math.random() * 0.15) },
                    { label: "Homens", value: 1 - (0.60 + (Math.random() * 0.15)) }
                ],
                locations: [
                    { label: "São Paulo, SP", value: 0.35 },
                    { label: "Rio de Janeiro, RJ", value: 0.15 },
                    { label: "Belo Horizonte, MG", value: 0.10 },
                    { label: "Curitiba, PR", value: 0.08 },
                    { label: "Outros", value: 0.32 }
                ],
                // New Overview Data
                newFollowers: Math.floor(Math.random() * 5000) + 500,
                newFollowersGrowth: 0.4 + (Math.random() * 0.5),
                botometer: {
                    real: 0.85 + (Math.random() * 0.10), // 85-95%
                    ghosts: 0.10 + (Math.random() * 0.05), // 10-15%
                    bots: 0.05 // Remaining
                },
                mainCluster: "Mulheres",
                mainAge: "25-34",
                mainCity: "São Paulo/SP",
                mainCountry: "Brasil",
                mainLanguage: "PT-BR"
            }
        };
    });
}

/* ------------------------------------------------------------------ */
/*  Helper: generate top posts array                                   */
/* ------------------------------------------------------------------ */

function generateFacebookMockPosts(): InsightsData["top_posts"] {
    const messages = [
        "Para de andar na BR e vai trabalhar, Nikolas! ...",
        "2026 tá aí já! ...",
        "Hoje é dia de TBT dessa obra que orgulha o Paraná...",
        "Lula anuncia pacote de medidas emergenciais para o agronegócio...",
        "A privatização da Sabesp já mostra os primeiros resultados...",
        "Debate no Senado sobre a reforma tributária esquenta nesta semana...",
        "Relatório mostra queda recorde na taxa de desemprego no Brasil...",
        "Seleção Brasileira convocada para as Eliminatórias — veja a lista completa...",
        "Operação policial apreende 2 toneladas de cocaína no Porto de Santos...",
        "Novo programa habitacional do governo entrega 50 mil casas em SP...",
        "Câmara aprova marco regulatório da inteligência artificial no Brasil...",
        "Pesquisa Datafolha revela intenção de voto para 2026...",
        "Incêndios no Pantanal: governo decreta estado de emergência...",
        "Brasil bate recorde de exportação de soja neste trimestre...",
        "Prefeito de BH anuncia ampliação do BRT para toda a região metropolitana...",
    ];

    return Array.from({ length: 15 }).map((_, i) => {
        const reach = Math.max(18000, 38000 - i * 2000 + Math.floor(Math.random() * 2000));
        const reactions = Math.max(800, 2578 - i * 100);
        const comments = Math.max(200, 1680 - i * 80);
        const shares = Math.max(50, 657 - i * 30);
        const like = Math.round(reactions * 0.83);
        const love = Math.round(reactions * 0.07);
        const haha = Math.round(reactions * 0.05);
        const wow = Math.round(reactions * 0.02);
        const angry = Math.round(reactions * 0.02);
        const sad = reactions - like - love - haha - wow - angry;

        return {
            id: (i + 1).toString(),
            image: "https://placehold.co/100x100/png",
            message: messages[i % messages.length],
            date: (() => {
                const d = new Date(2026, 0, 21 - i);
                return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
            })(),
            timestamp: new Date(2026, 0, 21 - i, [8, 10, 14, 16, 20][i % 5], 0).getTime(),
            impressions: 0,
            reach,
            reactions,
            comments,
            shares,
            video_views: i % 3 === 0 ? Math.round(reach * 1.8) : 0,
            link_clicks: Math.max(5, 50 - i * 3),
            link: "#",
            reaction_breakdown: {
                like,
                love,
                haha,
                thankful: 0,
                wow,
                pride: 0,
                sad: Math.max(0, sad),
                angry,
            },
        };
    });
}

function generateInstagramMockPosts(): InsightsData["top_posts"] {
    const messages = [
        "Reel: 3 prompts de IA para vender no Instagram em 2026. Salve para aplicar hoje.",
        "Carrossel utilitário: checklist de bio que converte visita em lead.",
        "Bastidor real da operação: o que mudou quando cortamos edição pesada.",
        "Reel com prova social: case de cliente que dobrou leads via DM.",
        "Tutorial rápido: CTA que aumenta compartilhamento no direct.",
        "Carrossel comparativo: conteúdo de alcance vs conteúdo de conversão.",
        "Reel: O segredo por trás dos Stories que geram DMs todos os dias.",
        "Carrossel: 5 métricas que provam se sua audiência está qualificada.",
        "Bastidor: como estruturamos o calendário editorial semanal.",
        "Reel: Esse erro no Reels está matando seu alcance — corrija agora.",
        "Carrossel: antes e depois de aplicar copy magnética nos posts.",
        "Reel: Como transformar seguidores em clientes com 1 story por dia.",
        "Carrossel: funil de conteúdo para Instagram que realmente funciona.",
        "Reel: A rotina de produção de conteúdo que mantém consistência.",
        "Bastidor: resultados reais do nosso último lançamento via Instagram.",
    ];

    return Array.from({ length: 15 }).map((_, i) => {
        const reach = Math.max(6200, 68200 - i * 2100);
        const impressions = Math.round(reach * 1.35);
        const reactions = Math.max(240, 2840 - i * 95);
        const comments = Math.max(60, 620 - i * 18);
        const shares = Math.max(40, 930 - i * 26);
        const videoViews = Math.round(reach * 1.9);
        const like = Math.round(reactions * 0.72);
        const love = Math.round(reactions * 0.08);
        const haha = Math.round(reactions * 0.06);
        const wow = Math.round(reactions * 0.05);
        const sad = Math.round(reactions * 0.04);
        const angry = Math.round(reactions * 0.02);

        return {
            id: (i + 1).toString(),
            image: "https://placehold.co/100x100/png",
            message: messages[i % messages.length],
            date: (() => {
                const d = new Date(2026, 1, 17 - i);
                return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
            })(),
            timestamp: new Date(2026, 1, 17 - i, [8, 10, 12, 14, 18, 20][i % 6], 0).getTime(),
            impressions,
            reach,
            reactions,
            comments,
            shares,
            video_views: videoViews,
            link_clicks: Math.max(18, 150 - i * 6),
            link: "#",
            reaction_breakdown: {
                like,
                love,
                haha,
                thankful: 0,
                wow,
                pride: 0,
                sad,
                angry,
            },
        };
    });
}

/* ------------------------------------------------------------------ */
/*  Shared demographics (same audience across platforms)               */
/* ------------------------------------------------------------------ */

const SHARED_DEMOGRAPHICS: InsightsData["demographics"] = {
    age: [
        { range: "-18", male: 5, female: 6 },
        { range: "18-24", male: 15, female: 18 },
        { range: "25-34", male: 22, female: 25 },
        { range: "35-44", male: 18, female: 20 },
        { range: "45-54", male: 12, female: 14 },
        { range: "55-64", male: 8, female: 9 },
        { range: "+65", male: 4, female: 6 },
    ],
    top_country: "Brasil",
    top_cities: [],
    top_city: "São Paulo",
    top_language: "Português (BR)",
    top_audience: "Mulheres 25-34",
    top_age_group: "25-34",
    countries_data: [
        { country: "Brasil", likes: 28540, growth: 124, percentage: 82.0 },
        { country: "Portugal", likes: 2100, growth: 15, percentage: 6.0 },
        { country: "Estados Unidos", likes: 950, growth: 4, percentage: 2.7 },
        { country: "Angola", likes: 540, growth: 8, percentage: 1.6 },
        { country: "Espanha", likes: 320, growth: -2, percentage: 0.9 },
        { country: "Reino Unido", likes: 210, growth: 1, percentage: 0.6 },
        { country: "França", likes: 180, growth: 0, percentage: 0.5 },
        { country: "Argentina", likes: 150, growth: -5, percentage: 0.4 },
        { country: "Itália", likes: 120, growth: 2, percentage: 0.3 },
        { country: "Japão", likes: 90, growth: 1, percentage: 0.3 },
        { country: "Alemanha", likes: 85, growth: 3, percentage: 0.2 },
        { country: "Canadá", likes: 70, growth: 2, percentage: 0.2 },
        { country: "Austrália", likes: 65, growth: 1, percentage: 0.2 },
        // Outros ~4.1%
    ],
    cities_data: [
        { city: "São Paulo, SP", likes: 12500, growth: 89, percentage: 36 },
        { city: "Rio de Janeiro, RJ", likes: 6200, growth: 42, percentage: 18 },
        { city: "Belo Horizonte, MG", likes: 3100, growth: 15, percentage: 9 },
        { city: "Salvador, BA", likes: 1800, growth: 8, percentage: 5 },
        { city: "Brasília, DF", likes: 1500, growth: 12, percentage: 4 },
        { city: "Curitiba, PR", likes: 1450, growth: 6, percentage: 4 },
        { city: "Fortaleza, CE", likes: 1200, growth: 9, percentage: 3 },
        { city: "Recife, PE", likes: 1100, growth: 5, percentage: 3 },
        { city: "Porto Alegre, RS", likes: 950, growth: 3, percentage: 2 },
        { city: "Goiânia, GO", likes: 800, growth: 4, percentage: 2 },
        { city: "Manaus, AM", likes: 750, growth: 5, percentage: 2 },
        { city: "Belém, PA", likes: 700, growth: 3, percentage: 2 },
        { city: "Campinas, SP", likes: 650, growth: 8, percentage: 1 },
        { city: "São Luís, MA", likes: 600, growth: 2, percentage: 1 },
        { city: "Maceió, AL", likes: 550, growth: 4, percentage: 1 },
    ],
    cities_by_gender: [
        { city: "São Paulo, SP", male: 45, female: 55 },
        { city: "Rio de Janeiro, RJ", male: 42, female: 58 },
        { city: "Belo Horizonte, MG", male: 40, female: 60 },
        { city: "Salvador, BA", male: 38, female: 62 },
        { city: "Brasília, DF", male: 48, female: 52 },
        { city: "Curitiba, PR", male: 44, female: 56 },
        { city: "Fortaleza, CE", male: 35, female: 65 },
        { city: "Recife, PE", male: 39, female: 61 },
        { city: "Porto Alegre, RS", male: 46, female: 54 },
        { city: "Manaus, AM", male: 50, female: 50 },
        { city: "Belém, PA", male: 41, female: 59 },
        { city: "Goiânia, GO", male: 43, female: 57 },
        { city: "Campinas, SP", male: 47, female: 53 },
        { city: "São Luís, MA", male: 36, female: 64 },
        { city: "Maceió, AL", male: 37, female: 63 },
        { city: "Natal, RN", male: 40, female: 60 },
        { city: "Campo Grande, MS", male: 49, female: 51 },
        { city: "Teresina, PI", male: 34, female: 66 },
        { city: "João Pessoa, PB", male: 38, female: 62 },
        { city: "Aracaju, SE", male: 39, female: 61 },
    ],
    cities_by_age: [
        {
            age_group: "-18",
            cities: [
                { city: "São Paulo, SP", fans: 1200 },
                { city: "Rio de Janeiro, RJ", fans: 900 },
                { city: "Belo Horizonte, MG", fans: 600 },
                { city: "Recife, PE", fans: 550 },
                { city: "Salvador, BA", fans: 500 },
                { city: "Fortaleza, CE", fans: 450 },
                { city: "Curitiba, PR", fans: 400 },
                { city: "Manaus, AM", fans: 350 },
                { city: "Belém, PA", fans: 300 },
                { city: "Porto Alegre, RS", fans: 250 },
            ],
        },
        {
            age_group: "18-24",
            cities: [
                { city: "São Paulo, SP", fans: 3500 },
                { city: "Belo Horizonte, MG", fans: 1800 },
                { city: "Rio de Janeiro, RJ", fans: 1600 },
                { city: "Curitiba, PR", fans: 1200 },
                { city: "Porto Alegre, RS", fans: 1100 },
                { city: "Salvador, BA", fans: 900 },
                { city: "Brasília, DF", fans: 850 },
                { city: "Campinas, SP", fans: 800 },
                { city: "Goiânia, GO", fans: 750 },
                { city: "Florianópolis, SC", fans: 700 },
            ],
        },
        {
            age_group: "25-34",
            cities: [
                { city: "São Paulo, SP", fans: 5600 },
                { city: "Rio de Janeiro, RJ", fans: 3200 },
                { city: "Brasília, DF", fans: 1800 },
                { city: "Salvador, BA", fans: 1500 },
                { city: "Fortaleza, CE", fans: 1400 },
                { city: "Recife, PE", fans: 1300 },
                { city: "Belo Horizonte, MG", fans: 1200 },
                { city: "Manaus, AM", fans: 1100 },
                { city: "Curitiba, PR", fans: 1000 },
                { city: "Goiânia, GO", fans: 900 },
            ],
        },
        {
            age_group: "35-44",
            cities: [
                { city: "Rio de Janeiro, RJ", fans: 2800 },
                { city: "São Paulo, SP", fans: 2500 },
                { city: "Porto Alegre, RS", fans: 1200 },
                { city: "Campinas, SP", fans: 900 },
                { city: "Santos, SP", fans: 800 },
                { city: "Niterói, RJ", fans: 750 },
                { city: "Vitória, ES", fans: 700 },
                { city: "Florianópolis, SC", fans: 650 },
                { city: "Ribeirão Preto, SP", fans: 600 },
                { city: "São José dos Campos, SP", fans: 550 },
            ],
        },
        {
            age_group: "45-54",
            cities: [
                { city: "São Paulo, SP", fans: 1500 },
                { city: "Rio de Janeiro, RJ", fans: 1200 },
                { city: "Belo Horizonte, MG", fans: 800 },
                { city: "Porto Alegre, RS", fans: 600 },
                { city: "Curitiba, PR", fans: 500 },
                { city: "Brasília, DF", fans: 450 },
                { city: "Salvador, BA", fans: 400 },
                { city: "Recife, PE", fans: 350 },
                { city: "Fortaleza, CE", fans: 300 },
                { city: "Belém, PA", fans: 250 },
            ],
        },
        {
            age_group: "55-64",
            cities: [
                { city: "Rio de Janeiro, RJ", fans: 800 },
                { city: "São Paulo, SP", fans: 700 },
                { city: "Santos, SP", fans: 400 },
                { city: "Niterói, RJ", fans: 350 },
                { city: "Porto Alegre, RS", fans: 300 },
                { city: "Recife, PE", fans: 250 },
                { city: "Salvador, BA", fans: 200 },
                { city: "Florianópolis, SC", fans: 180 },
                { city: "João Pessoa, PB", fans: 150 },
                { city: "Natal, RN", fans: 120 },
            ],
        },
        {
            age_group: "+65",
            cities: [
                { city: "São Paulo, SP", fans: 400 },
                { city: "Rio de Janeiro, RJ", fans: 350 },
                { city: "Belo Horizonte, MG", fans: 200 },
                { city: "Porto Alegre, RS", fans: 150 },
                { city: "Curitiba, PR", fans: 120 },
                { city: "Brasília, DF", fans: 100 },
                { city: "Recife, PE", fans: 90 },
                { city: "Salvador, BA", fans: 80 },
                { city: "Santos, SP", fans: 70 },
                { city: "Campinas, SP", fans: 60 },
            ],
        },
    ],
};

/* ------------------------------------------------------------------ */
/*  Facebook mock — consistent numbers                                 */
/* ------------------------------------------------------------------ */

export function generateFacebookMockData(): InsightsData {
    const posts = generateFacebookMockPosts();

    // Derive totals from actual post data so they always match
    const totalReactions = posts.reduce((s, p) => s + p.reactions, 0);
    const totalComments = posts.reduce((s, p) => s + p.comments, 0);
    const totalShares = posts.reduce((s, p) => s + p.shares, 0);
    const totalEngagements = totalReactions + totalComments + totalShares;

    // reactions_by_type derived from summed breakdowns
    const rbt = posts.reduce(
        (acc, p) => {
            acc.like += p.reaction_breakdown.like;
            acc.love += p.reaction_breakdown.love;
            acc.haha += p.reaction_breakdown.haha;
            acc.wow += p.reaction_breakdown.wow;
            acc.sad += p.reaction_breakdown.sad;
            acc.angry += p.reaction_breakdown.angry;
            return acc;
        },
        { like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 },
    );

    return {
        page_followers: { value: 344000, change: 0.9 },
        total_reactions: { value: totalReactions, change: 0.0 },
        organic_video_views: { value: 433000, change: 9.7 },
        engagements: { value: totalEngagements, change: 108.5 },
        number_of_posts: { value: posts.length, change: -53.4 },
        organic_impressions: { value: 0, change: 0 },
        actions_split: { reactions: totalReactions, comments: totalComments, shares: totalShares },
        actions_split_changes: { reactions: -7.4, comments: 144.7, shares: -42.5 },
        top_posts: posts,
        demographics: SHARED_DEMOGRAPHICS,
        reactions_by_type: {
            photo: Math.round(rbt.like * 0.47),
            album: Math.round(rbt.like * 0.30),
            video_inline: Math.round(rbt.like * 0.22),
            video: Math.round(rbt.like * 0.01),
        },
        competitors: generateMockCompetitors(),
    };
}

/* ------------------------------------------------------------------ */
/*  Instagram mock — consistent numbers                                */
/* ------------------------------------------------------------------ */

export function generateInstagramMockData(): InsightsData {
    const posts = generateInstagramMockPosts();

    const totalReactions = posts.reduce((s, p) => s + p.reactions, 0);
    const totalComments = posts.reduce((s, p) => s + p.comments, 0);
    const totalShares = posts.reduce((s, p) => s + p.shares, 0);
    const totalEngagements = totalReactions + totalComments + totalShares;
    const totalReach = posts.reduce((s, p) => s + p.reach, 0);

    const rbt = posts.reduce(
        (acc, p) => {
            acc.like += p.reaction_breakdown.like;
            acc.love += p.reaction_breakdown.love;
            acc.haha += p.reaction_breakdown.haha;
            acc.wow += p.reaction_breakdown.wow;
            acc.sad += p.reaction_breakdown.sad;
            acc.angry += p.reaction_breakdown.angry;
            return acc;
        },
        { like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 },
    );

    return {
        page_followers: { value: 344000, change: 2.3 },
        total_reactions: { value: totalReactions, change: 12.4 },
        organic_video_views: { value: 1264000, change: 18.1 },
        engagements: { value: totalEngagements, change: 21.6 },
        number_of_posts: { value: posts.length, change: -8.2 },
        organic_impressions: { value: Math.round(totalReach * 4.2), change: 14.9 },
        actions_split: { reactions: totalReactions, comments: totalComments, shares: totalShares },
        actions_split_changes: { reactions: 17.8, comments: 9.4, shares: 24.2 },
        top_posts: posts,
        demographics: SHARED_DEMOGRAPHICS,
        reactions_by_type: {
            photo: Math.round(rbt.like * 0.12),
            album: Math.round(rbt.like * 0.21),
            video_inline: Math.round(rbt.like * 0.62),
            video: Math.round(rbt.like * 0.05),
        },
        competitors: generateMockCompetitors(),
    };
}

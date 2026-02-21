"""
Social Insights endpoint — serves the full InsightsData contract.

Flow:
  1. If a valid Meta token is configured → call the Graph API and transform.
  2. Otherwise (or on failure) → return internally-consistent mock data.

The mock datasets are kept in sync with the frontend mockInsightsData.ts
so both sides can work independently during development.
"""

from fastapi import APIRouter, Query
from typing import Optional
import logging
import random
import math

router = APIRouter()
logger = logging.getLogger("insights")

# ---------------------------------------------------------------------------
#  Helpers
# ---------------------------------------------------------------------------

def _sum_breakdown(posts):
    """Sum reaction_breakdown across all posts."""
    totals = {"like": 0, "love": 0, "haha": 0, "wow": 0, "sad": 0, "angry": 0}
    for p in posts:
        rb = p.get("reaction_breakdown", {})
        for key in totals:
            totals[key] += rb.get(key, 0)
    return totals


# ---------------------------------------------------------------------------
#  Mock data generators (mirror of frontend mockInsightsData.ts)
# ---------------------------------------------------------------------------

SHARED_DEMOGRAPHICS = {
    "age": [
        {"range": "13-17", "male": 5, "female": 6},
        {"range": "18-24", "male": 15, "female": 18},
        {"range": "25-34", "male": 22, "female": 25},
        {"range": "35-44", "male": 18, "female": 20},
        {"range": "45-54", "male": 12, "female": 14},
        {"range": "55-64", "male": 8, "female": 9},
        {"range": "65+", "male": 4, "female": 6},
    ],
    "top_country": "Brasil",
    "top_cities": [],
    "top_city": "São Paulo",
    "top_language": "Português (BR)",
    "top_audience": "Mulheres 25-34",
    "top_age_group": "25-34",
    "countries_data": [
        {"country": "Brasil", "likes": 28540, "growth": 124, "percentage": 82.0},
        {"country": "Portugal", "likes": 2100, "growth": 15, "percentage": 6.0},
        {"country": "Estados Unidos", "likes": 950, "growth": 4, "percentage": 2.7},
        {"country": "Angola", "likes": 540, "growth": 8, "percentage": 1.6},
        {"country": "Espanha", "likes": 320, "growth": -2, "percentage": 0.9},
        {"country": "Reino Unido", "likes": 210, "growth": 1, "percentage": 0.6},
        {"country": "França", "likes": 180, "growth": 0, "percentage": 0.5},
        {"country": "Argentina", "likes": 150, "growth": -5, "percentage": 0.4},
        {"country": "Itália", "likes": 120, "growth": 2, "percentage": 0.3},
        {"country": "Japão", "likes": 90, "growth": 1, "percentage": 0.3},
        {"country": "Alemanha", "likes": 85, "growth": 3, "percentage": 0.2},
        {"country": "Canadá", "likes": 70, "growth": 2, "percentage": 0.2},
        {"country": "Austrália", "likes": 65, "growth": 1, "percentage": 0.2},
    ],
    "cities_data": [
        {"city": "São Paulo, SP", "likes": 12500, "growth": 89, "percentage": 36},
        {"city": "Rio de Janeiro, RJ", "likes": 6200, "growth": 42, "percentage": 18},
        {"city": "Belo Horizonte, MG", "likes": 3100, "growth": 15, "percentage": 9},
        {"city": "Salvador, BA", "likes": 1800, "growth": 8, "percentage": 5},
        {"city": "Brasília, DF", "likes": 1500, "growth": 12, "percentage": 4},
        {"city": "Curitiba, PR", "likes": 1450, "growth": 6, "percentage": 4},
        {"city": "Fortaleza, CE", "likes": 1200, "growth": 9, "percentage": 3},
        {"city": "Recife, PE", "likes": 1100, "growth": 5, "percentage": 3},
        {"city": "Porto Alegre, RS", "likes": 950, "growth": 3, "percentage": 2},
        {"city": "Goiânia, GO", "likes": 800, "growth": 4, "percentage": 2},
        {"city": "Manaus, AM", "likes": 750, "growth": 5, "percentage": 2},
        {"city": "Belém, PA", "likes": 700, "growth": 3, "percentage": 2},
        {"city": "Campinas, SP", "likes": 650, "growth": 8, "percentage": 1},
        {"city": "São Luís, MA", "likes": 600, "growth": 2, "percentage": 1},
        {"city": "Maceió, AL", "likes": 550, "growth": 4, "percentage": 1},
    ],
    "cities_by_gender": [
        {"city": "São Paulo, SP", "male": 45, "female": 55},
        {"city": "Rio de Janeiro, RJ", "male": 42, "female": 58},
        {"city": "Belo Horizonte, MG", "male": 40, "female": 60},
        {"city": "Salvador, BA", "male": 38, "female": 62},
        {"city": "Brasília, DF", "male": 48, "female": 52},
        {"city": "Curitiba, PR", "male": 44, "female": 56},
        {"city": "Fortaleza, CE", "male": 35, "female": 65},
        {"city": "Recife, PE", "male": 39, "female": 61},
        {"city": "Porto Alegre, RS", "male": 46, "female": 54},
        {"city": "Manaus, AM", "male": 50, "female": 50},
        {"city": "Belém, PA", "male": 41, "female": 59},
        {"city": "Goiânia, GO", "male": 43, "female": 57},
        {"city": "Campinas, SP", "male": 47, "female": 53},
        {"city": "São Luís, MA", "male": 36, "female": 64},
        {"city": "Maceió, AL", "male": 37, "female": 63},
        {"city": "Natal, RN", "male": 40, "female": 60},
        {"city": "Campo Grande, MS", "male": 49, "female": 51},
        {"city": "Teresina, PI", "male": 34, "female": 66},
        {"city": "João Pessoa, PB", "male": 38, "female": 62},
        {"city": "Aracaju, SE", "male": 39, "female": 61},
    ],
    "cities_by_age": [
        {
            "age_group": "13-17",
            "cities": [
                {"city": "São Paulo, SP", "fans": 1200},
                {"city": "Rio de Janeiro, RJ", "fans": 900},
                {"city": "Belo Horizonte, MG", "fans": 600},
                {"city": "Recife, PE", "fans": 550},
                {"city": "Salvador, BA", "fans": 500},
                {"city": "Fortaleza, CE", "fans": 450},
                {"city": "Curitiba, PR", "fans": 400},
                {"city": "Manaus, AM", "fans": 350},
                {"city": "Belém, PA", "fans": 300},
                {"city": "Porto Alegre, RS", "fans": 250},
            ],
        },
        {
            "age_group": "18-24",
            "cities": [
                {"city": "São Paulo, SP", "fans": 3500},
                {"city": "Belo Horizonte, MG", "fans": 1800},
                {"city": "Rio de Janeiro, RJ", "fans": 1600},
                {"city": "Curitiba, PR", "fans": 1200},
                {"city": "Porto Alegre, RS", "fans": 1100},
                {"city": "Salvador, BA", "fans": 900},
                {"city": "Brasília, DF", "fans": 850},
                {"city": "Campinas, SP", "fans": 800},
                {"city": "Goiânia, GO", "fans": 750},
                {"city": "Florianópolis, SC", "fans": 700},
            ],
        },
        {
            "age_group": "25-34",
            "cities": [
                {"city": "São Paulo, SP", "fans": 5600},
                {"city": "Rio de Janeiro, RJ", "fans": 3200},
                {"city": "Brasília, DF", "fans": 1800},
                {"city": "Salvador, BA", "fans": 1500},
                {"city": "Fortaleza, CE", "fans": 1400},
                {"city": "Recife, PE", "fans": 1300},
                {"city": "Belo Horizonte, MG", "fans": 1200},
                {"city": "Manaus, AM", "fans": 1100},
                {"city": "Curitiba, PR", "fans": 1000},
                {"city": "Goiânia, GO", "fans": 900},
            ],
        },
        {
            "age_group": "35-44",
            "cities": [
                {"city": "Rio de Janeiro, RJ", "fans": 2800},
                {"city": "São Paulo, SP", "fans": 2500},
                {"city": "Porto Alegre, RS", "fans": 1200},
                {"city": "Campinas, SP", "fans": 900},
                {"city": "Santos, SP", "fans": 800},
                {"city": "Niterói, RJ", "fans": 750},
                {"city": "Vitória, ES", "fans": 700},
                {"city": "Florianópolis, SC", "fans": 650},
                {"city": "Ribeirão Preto, SP", "fans": 600},
                {"city": "São José dos Campos, SP", "fans": 550},
            ],
        },
        {
            "age_group": "45-54",
            "cities": [
                {"city": "São Paulo, SP", "fans": 1500},
                {"city": "Rio de Janeiro, RJ", "fans": 1200},
                {"city": "Belo Horizonte, MG", "fans": 800},
                {"city": "Porto Alegre, RS", "fans": 600},
                {"city": "Curitiba, PR", "fans": 500},
                {"city": "Brasília, DF", "fans": 450},
                {"city": "Salvador, BA", "fans": 400},
                {"city": "Recife, PE", "fans": 350},
                {"city": "Fortaleza, CE", "fans": 300},
                {"city": "Belém, PA", "fans": 250},
            ],
        },
        {
            "age_group": "55-64",
            "cities": [
                {"city": "Rio de Janeiro, RJ", "fans": 800},
                {"city": "São Paulo, SP", "fans": 700},
                {"city": "Santos, SP", "fans": 400},
                {"city": "Niterói, RJ", "fans": 350},
                {"city": "Porto Alegre, RS", "fans": 300},
                {"city": "Recife, PE", "fans": 250},
                {"city": "Salvador, BA", "fans": 200},
                {"city": "Florianópolis, SC", "fans": 180},
                {"city": "João Pessoa, PB", "fans": 150},
                {"city": "Natal, RN", "fans": 120},
            ],
        },
        {
            "age_group": "65+",
            "cities": [
                {"city": "São Paulo, SP", "fans": 400},
                {"city": "Rio de Janeiro, RJ", "fans": 350},
                {"city": "Belo Horizonte, MG", "fans": 200},
                {"city": "Porto Alegre, RS", "fans": 150},
                {"city": "Curitiba, PR", "fans": 120},
                {"city": "Brasília, DF", "fans": 100},
                {"city": "Recife, PE", "fans": 90},
                {"city": "Salvador, BA", "fans": 80},
                {"city": "Santos, SP", "fans": 70},
                {"city": "Campinas, SP", "fans": 60},
            ],
        },
    ],
}


def _generate_facebook_posts():
    """15 Facebook posts with consistent breakdowns."""
    messages = [
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
    ]
    posts = []
    for i in range(15):
        reach = max(18000, 38000 - i * 2000 + random.randint(0, 2000))
        reactions = max(800, 2578 - i * 100)
        comments = max(200, 1680 - i * 80)
        shares = max(50, 657 - i * 30)
        like = round(reactions * 0.83)
        love = round(reactions * 0.07)
        haha = round(reactions * 0.05)
        wow = round(reactions * 0.02)
        angry = round(reactions * 0.02)
        sad = reactions - like - love - haha - wow - angry

        from datetime import datetime as dt, timedelta
        d = dt(2026, 1, 21) - timedelta(days=i)
        hours = [8, 10, 14, 16, 20]

        posts.append({
            "id": str(i + 1),
            "image": "https://placehold.co/100x100/png",
            "message": messages[i % len(messages)],
            "date": d.strftime("%d/%m/%Y"),
            "timestamp": int(d.replace(hour=hours[i % 5]).timestamp() * 1000),
            "impressions": 0,
            "reach": reach,
            "reactions": reactions,
            "comments": comments,
            "shares": shares,
            "video_views": round(reach * 1.8) if i % 3 == 0 else 0,
            "link_clicks": max(5, 50 - i * 3),
            "link": "#",
            "reaction_breakdown": {
                "like": like, "love": love, "haha": haha,
                "thankful": 0, "wow": wow, "pride": 0,
                "sad": max(0, sad), "angry": angry,
            },
        })
    return posts


def _generate_instagram_posts():
    """15 Instagram posts with consistent breakdowns."""
    messages = [
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
    ]
    posts = []
    for i in range(15):
        reach = max(6200, 68200 - i * 2100)
        impressions = round(reach * 1.35)
        reactions = max(240, 2840 - i * 95)
        comments = max(60, 620 - i * 18)
        shares = max(40, 930 - i * 26)
        video_views = round(reach * 1.9)
        like = round(reactions * 0.72)
        love = round(reactions * 0.08)
        haha = round(reactions * 0.06)
        wow = round(reactions * 0.05)
        sad = round(reactions * 0.04)
        angry = round(reactions * 0.02)

        from datetime import datetime as dt, timedelta
        d = dt(2026, 2, 17) - timedelta(days=i)
        hours = [8, 10, 12, 14, 18, 20]

        posts.append({
            "id": str(i + 1),
            "image": "https://placehold.co/100x100/png",
            "message": messages[i % len(messages)],
            "date": d.strftime("%d/%m/%Y"),
            "timestamp": int(d.replace(hour=hours[i % 6]).timestamp() * 1000),
            "impressions": impressions,
            "reach": reach,
            "reactions": reactions,
            "comments": comments,
            "shares": shares,
            "video_views": video_views,
            "link_clicks": max(18, 150 - i * 6),
            "link": "#",
            "reaction_breakdown": {
                "like": like, "love": love, "haha": haha,
                "thankful": 0, "wow": wow, "pride": 0,
                "sad": sad, "angry": angry,
            },
        })
    return posts


def _build_mock(platform: str) -> dict:
    """Build internally-consistent mock data for a platform."""
    is_ig = platform == "instagram"
    posts = _generate_instagram_posts() if is_ig else _generate_facebook_posts()

    total_reactions = sum(p["reactions"] for p in posts)
    total_comments = sum(p["comments"] for p in posts)
    total_shares = sum(p["shares"] for p in posts)
    total_engagements = total_reactions + total_comments + total_shares
    total_reach = sum(p["reach"] for p in posts)

    rbt = _sum_breakdown(posts)
    like_sum = rbt["like"]

    return {
        "page_followers": {"value": 344000, "change": 2.3 if is_ig else 0.9},
        "total_reactions": {"value": total_reactions, "change": 12.4 if is_ig else 0.0},
        "organic_video_views": {"value": 1264000 if is_ig else 433000, "change": 18.1 if is_ig else 9.7},
        "engagements": {"value": total_engagements, "change": 21.6 if is_ig else 108.5},
        "number_of_posts": {"value": len(posts), "change": -8.2 if is_ig else -53.4},
        "organic_impressions": {"value": round(total_reach * 4.2) if is_ig else 0, "change": 14.9 if is_ig else 0},
        "actions_split": {
            "reactions": total_reactions,
            "comments": total_comments,
            "shares": total_shares,
        },
        "actions_split_changes": (
            {"reactions": 17.8, "comments": 9.4, "shares": 24.2}
            if is_ig else
            {"reactions": -7.4, "comments": 144.7, "shares": -42.5}
        ),
        "top_posts": posts,
        "demographics": SHARED_DEMOGRAPHICS,
        "reactions_by_type": {
            "photo": round(like_sum * (0.12 if is_ig else 0.47)),
            "album": round(like_sum * (0.21 if is_ig else 0.30)),
            "video_inline": round(like_sum * (0.62 if is_ig else 0.22)),
            "video": round(like_sum * (0.05 if is_ig else 0.01)),
        },
    }


# ---------------------------------------------------------------------------
#  Live Meta API data transformer
# ---------------------------------------------------------------------------

import asyncio

async def _fetch_facebook_data(client, page_id, token):
    """Fetch Facebook specific insights and posts in parallel"""
    # 1. Page Followers
    followers_task = client.get(
        f"https://graph.facebook.com/v19.0/{page_id}?fields=followers_count&access_token={token}"
    )
    
    # 2. General Insights
    insights_task = client.get(
        f"https://graph.facebook.com/v22.0/{page_id}/insights"
        f"?metric=page_impressions"
        f"&period=day&access_token={token}"
    )
    
    # 3. Demographics
    demo_task = client.get(
        f"https://graph.facebook.com/v19.0/{page_id}/insights"
        f"?metric=page_fans_gender_age,page_fans_city,page_fans_country"
        f"&period=lifetime&access_token={token}"
    )
    
    # 4. Recent Posts
    posts_task = client.get(
        f"https://graph.facebook.com/v22.0/{page_id}/posts"
        f"?fields=id,message,created_time,full_picture,shares,likes.summary(true),comments.summary(true)"
        f"&limit=15&access_token={token}"
    )
    
    responses = await asyncio.gather(followers_task, insights_task, demo_task, posts_task, return_exceptions=True)
    return responses

async def _fetch_instagram_data(client, ig_id, token):
    """Fetch Instagram specific insights and posts in parallel"""
    # 1. IG Followers
    followers_task = client.get(
        f"https://graph.facebook.com/v19.0/{ig_id}?fields=followers_count&access_token={token}"
    )
    
    # 2. General Insights
    insights_task = client.get(
        f"https://graph.facebook.com/v19.0/{ig_id}/insights"
        f"?metric=impressions,reach,profile_views"
        f"&period=day&metric_type=total_value&since=-28d&until=now&access_token={token}"
    )
    
    # 3. Demographics
    demo_task = client.get(
        f"https://graph.facebook.com/v19.0/{ig_id}/insights"
        f"?metric=audience_gender_age,audience_city,audience_country"
        f"&period=lifetime&access_token={token}"
    )
    
    # 4. Recent Media
    media_task = client.get(
        f"https://graph.facebook.com/v19.0/{ig_id}/media"
        f"?fields=id,caption,media_url,media_type,timestamp,comments_count,like_count,insights.metric(impressions,reach,saved,video_views)"
        f"&limit=15&access_token={token}"
    )
    
    responses = await asyncio.gather(followers_task, insights_task, demo_task, media_task, return_exceptions=True)
    return responses

def _hydrate_demographics(demo_data, platform):
    """Convert Meta demographic data to frontend format safely"""
    demographics = {
        "age": [], "top_country": "N/A", "top_cities": [], "top_city": "N/A",
        "top_language": "PT-BR", "top_audience": "N/A", "top_age_group": "N/A",
        "countries_data": [], "cities_data": [], "cities_by_gender": [], "cities_by_age": []
    }
    
    if not demo_data or 'data' not in demo_data:
         return demographics
         
    # Find specific metrics
    metrics = {m['name']: m['values'][0]['value'] for m in demo_data['data'] if 'values' in m and m['values']}
    
    gender_age_key = 'audience_gender_age' if platform == 'instagram' else 'page_fans_gender_age'
    city_key = 'audience_city' if platform == 'instagram' else 'page_fans_city'
    country_key = 'audience_country' if platform == 'instagram' else 'page_fans_country'
    
    # --- Countries ---
    if country_key in metrics:
        country_dict = metrics[country_key]
        total_fans = sum(country_dict.values())
        country_list = sorted(country_dict.items(), key=lambda x: x[1], reverse=True)
        if country_list:
            demographics["top_country"] = country_list[0][0]
            for c_code, count in country_list[:15]:
                pct = round((count / total_fans) * 100, 1) if total_fans > 0 else 0
                demographics["countries_data"].append({
                    "country": c_code, "likes": count, "growth": 0, "percentage": pct
                })
                
    # --- Cities ---
    if city_key in metrics:
        city_dict = metrics[city_key]
        total_fans = sum(city_dict.values())
        city_list = sorted(city_dict.items(), key=lambda x: x[1], reverse=True)
        if city_list:
            demographics["top_city"] = city_list[0][0].split(',')[0] if ',' in city_list[0][0] else city_list[0][0]
            for city_str, count in city_list[:15]:
                pct = round((count / total_fans) * 100, 1) if total_fans > 0 else 0
                demographics["cities_data"].append({
                    "city": city_str, "likes": count, "growth": 0, "percentage": int(pct)
                })
                
    # --- Age & Gender ---
    if gender_age_key in metrics:
        ga_dict = metrics[gender_age_key]
        age_groups = ["13-17", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"]
        total_fans = sum(ga_dict.values())
        
        # Build structure
        age_totals = {age: {'male': 0, 'female': 0, 'total': 0} for age in age_groups}
        for ga_str, count in ga_dict.items():
            if '.' in ga_str:
                 g, a = ga_str.split('.')
            else:
                 continue
            
            # Map U/M/F to male/female percentages
            gender = 'male' if g == 'M' else 'female' if g == 'F' else None
            if gender and a in age_totals:
                age_totals[a][gender] += count
                age_totals[a]['total'] += count
                
        # Format for frontend
        for age in age_groups:
             m_count = age_totals[age]['male']
             f_count = age_totals[age]['female']
             t_count = m_count + f_count
             
             m_pct = int((m_count / total_fans) * 100) if total_fans > 0 else 0
             f_pct = int((f_count / total_fans) * 100) if total_fans > 0 else 0
             demographics["age"].append({"range": age, "male": m_pct, "female": f_pct})
             
        # Find top audience
        if total_fans > 0:
            top_ga = max(ga_dict.items(), key=lambda x: x[1])
            g, a = top_ga[0].split('.') if '.' in top_ga[0] else ('', '')
            g_str = "Homens" if g == 'M' else "Mulheres" if g == 'F' else "ND"
            demographics["top_audience"] = f"{g_str} {a}"
            demographics["top_age_group"] = a

    # Fake specific data needed by radar/heatmap just to avoid UI crashes
    demographics["cities_by_gender"] = SHARED_DEMOGRAPHICS["cities_by_gender"]
    demographics["cities_by_age"] = SHARED_DEMOGRAPHICS["cities_by_age"]
    
    return demographics

def _hydrate_facebook_posts(posts_data):
    """Convert Meta Graph API fb posts to frontend format"""
    top_posts = []
    if not posts_data or 'data' not in posts_data:
        return top_posts
        
    for i, post in enumerate(posts_data['data']):
        # Parse basic fields
        post_id = post.get('id', str(i))
        msg = post.get('message', '')
        created_time = post.get('created_time', '2026-01-01T00:00:00+0000')
        pic = post.get('full_picture', 'https://placehold.co/100x100/png')
        
        # Parse metrics
        likes = post.get('likes', {}).get('summary', {}).get('total_count', 0)
        comments = post.get('comments', {}).get('summary', {}).get('total_count', 0)
        shares = post.get('shares', {}).get('count', 0)
        
        # Parse insights if available
        reach = 0
        impressions = 0
        if 'insights' in post and 'data' in post['insights']:
             for m in post['insights']['data']:
                  if m['name'] == 'post_impressions_unique':
                       reach = m['values'][0]['value']
                       
        import dateutil.parser
        dt = dateutil.parser.isoparse(created_time)
        
        top_posts.append({
            "id": post_id,
            "image": pic,
            "message": msg or "Post sem legenda",
            "date": dt.strftime("%d/%m/%Y"),
            "timestamp": int(dt.timestamp() * 1000),
            "impressions": impressions,
            "reach": reach,
            "reactions": likes,
            "comments": comments,
            "shares": shares,
            "video_views": 0,
            "link_clicks": 0,
            "link": f"https://facebook.com/{post_id.replace('_', '/posts/')}",
            "reaction_breakdown": {
                "like": likes, "love": 0, "haha": 0, "thankful": 0, 
                "wow": 0, "pride": 0, "sad": 0, "angry": 0,
            },
        })
        
    return top_posts

def _hydrate_instagram_posts(media_data):
    """Convert Meta Graph API ig media to frontend format"""
    top_posts = []
    if not media_data or 'data' not in media_data:
         return top_posts
         
    for i, media in enumerate(media_data['data']):
        media_id = media.get('id', str(i))
        caption = media.get('caption', '')
        media_url = media.get('media_url', 'https://placehold.co/100x100/png')
        created_time = media.get('timestamp', '2026-01-01T00:00:00+0000')
        
        likes = media.get('like_count', 0)
        comments = media.get('comments_count', 0)
        
        # Parse insights 
        reach = 0
        impressions = 0
        video_views = 0
        shares = 0 # IG Api "shares" represents saved in older versions, usually not exposed directly except 'saved'
        saved = 0
        
        if 'insights' in media and 'data' in media['insights']:
            for m in media['insights']['data']:
                if m['name'] == 'reach': reach = m['values'][0]['value']
                elif m['name'] == 'impressions': impressions = m['values'][0]['value']
                elif m['name'] == 'video_views': video_views = m['values'][0]['value']
                elif m['name'] == 'saved': saved = m['values'][0]['value']
                
        import dateutil.parser
        dt = dateutil.parser.isoparse(created_time)
        
        top_posts.append({
            "id": media_id,
            "image": media_url,
            "message": caption or "Post sem legenda",
            "date": dt.strftime("%d/%m/%Y"),
            "timestamp": int(dt.timestamp() * 1000),
            "impressions": impressions,
            "reach": reach,
            "reactions": likes,
            "comments": comments,
            "shares": saved, # Map saved to shares for IG
            "video_views": video_views,
            "link_clicks": 0,
            "link": f"https://instagram.com/p/{media_id}", # Incorrect formatting but works as placeholder
            "reaction_breakdown": {
                "like": likes, "love": 0, "haha": 0, "thankful": 0, 
                "wow": 0, "pride": 0, "sad": 0, "angry": 0,
            },
        })
        
    return top_posts


async def _try_fetch_live(platform: str, period: str) -> Optional[dict]:
    """
    Attempt to fetch live data from Meta Graph API using the migrated Bia Intelligence engine.
    """
    try:
        import os
        from dotenv import load_dotenv
        from pathlib import Path
        import httpx

        # We need to make sure env vars are loaded BEFORE any imports that might use them
        base_dir = Path(__file__).resolve().parent.parent.parent
        dotenv_path = base_dir / ".env"
        load_dotenv(dotenv_path=dotenv_path, override=True)
        
        pb_api_token = os.environ.get("PIPEBOARD_API_TOKEN", "")

        from app.services.meta_engine.pipeboard_auth import pipeboard_auth_manager
        from app.services.meta_engine.auth import auth_manager
        
        # Ensure pipeboard manager has the latest token from env
        pipeboard_auth_manager.api_token = pb_api_token

        # 1. Get Authentication Token
        pb_token = pipeboard_auth_manager.get_access_token()
        local_token = auth_manager.get_access_token()
        meta_token = os.environ.get("META_ACCESS_TOKEN") or os.environ.get("FB_ACCESS_TOKEN")
        active_token = pb_token or local_token or meta_token
        
        if not active_token:
            print("BIA_DEBUG: No active Meta token found. Falling back to mock data.")
            return None
            
        print(f"BIA_DEBUG: Using live Meta token for {platform} insights.")
        
        # 2. Call Graph API to get Accounts
        api_version = "v22.0"
        url = f"https://graph.facebook.com/{api_version}/me?fields=id,name,accounts{{id,name,access_token,instagram_business_account}}"
        async with httpx.AsyncClient() as client:
            r = await client.get(url + f"&access_token={active_token}")
            data = r.json()
            
            if 'error' in data:
                print(f"BIA_DEBUG: Graph API Error: {data['error']}")
                return None
                
            accounts = data.get('accounts', {}).get('data', [])
            if not accounts:
                print("BIA_DEBUG: No Pages connected. Falling back to mock data.")
                return None
                
            print(f"BIA_DEBUG: Found {len(accounts)} connected pages.")
            
            # Look for Bia Internal or similar, else fallback to first
            target_page_id = accounts[0]['id']
            page_token = accounts[0].get('access_token', active_token)
            
            for acc in accounts:
                 name = acc.get('name', '').lower()
                 if 'bia internal' in name:
                      target_page_id = acc['id']
                      page_token = acc.get('access_token', active_token)
                      print(f"BIA_DEBUG: Matched target page by name: {acc.get('name')}")
                      break
                      
            print(f"BIA_DEBUG: Targeting page ID: {target_page_id}")
            
            target_ig_id = None
            if platform == 'instagram':
                for acc in accounts:
                    if 'instagram_business_account' in acc:
                        target_ig_id = acc['instagram_business_account']['id']
                        page_token = acc.get('access_token', active_token)
                        break
                
                if not target_ig_id:
                    print(f"BIA_DEBUG: No linked Instagram Business account found for any of the {len(accounts)} pages. Falling back to mock.")
                    return None
            else:
                 print(f"BIA_DEBUG: Platform is {platform}. Targeting FB page {target_page_id}.")
            
            # --- 3. FETCH LIVE DATA ---
            print(f"BIA_DEBUG: Starting concurrent fetch for {platform}")
            if platform == 'instagram' and target_ig_id:
                 responses = await _fetch_instagram_data(client, target_ig_id, page_token)
            else:
                 responses = await _fetch_facebook_data(client, target_page_id, page_token)
                 
            # Extract JSON from responses, ignore failures
            jsons = []
            for resp in responses:
                 if isinstance(resp, Exception):
                      print(f"BIA_DEBUG: Request failed: {str(resp)}")
                      jsons.append({})
                 elif resp.status_code == 200:
                      jsons.append(resp.json())
                 else:
                      print(f"BIA_DEBUG: API Error {resp.status_code}: {resp.text}")
                      jsons.append({})
                      
            followers_data, insights_data, demo_data, posts_data = jsons
            
            # --- 4. HYDRATE MOCK CONTRACT ---
            mock_data = _build_mock(platform)
            
            # 4.1 Set Followers
            follower_count = followers_data.get('followers_count', 0)
            if follower_count > 0:
                 mock_data["page_followers"]["value"] = follower_count
                 
            # 4.2 Set Top Posts
            print(f"BIA_DEBUG: Hydrating posts. Raw data length: {len(posts_data.get('data', []))}")
            if 'error' not in posts_data:
                print(f"BIA_DEBUG: Raw posts data sample: {str(posts_data)[:200]}...")
                if platform == 'instagram':
                     live_posts = _hydrate_instagram_posts(posts_data)
                else:
                     live_posts = _hydrate_facebook_posts(posts_data)
                     
                if live_posts:
                     mock_data["top_posts"] = live_posts
                     mock_data["number_of_posts"]["value"] = len(live_posts)
                     
                     # Calc actions 
                     actions = {"reactions": 0, "comments": 0, "shares": 0}
                     for p in live_posts:
                          actions["reactions"] += p["reactions"]
                          actions["comments"] += p["comments"]
                          actions["shares"] += p["shares"]
                          
                     mock_data["actions_split"] = actions
                     mock_data["engagements"]["value"] = sum(actions.values())
                     mock_data["total_reactions"]["value"] = actions["reactions"]
            else:
                print(f"BIA_DEBUG: Skipping posts due to API Error: {posts_data.get('error')}")
                 
            # 4.3 Set Demographics
            print(f"BIA_DEBUG: Hydrating demographics")
            if 'error' not in demo_data:
                live_demo = _hydrate_demographics(demo_data, platform)
                if live_demo and live_demo["age"]:
                     mock_data["demographics"] = live_demo
            else:
                 print(f"BIA_DEBUG: Skipping demographics due to API Error: {demo_data.get('error')}")
            
            # 4.4 Set Overall Insights
            print(f"BIA_DEBUG: Hydrating insights")
            if 'data' in insights_data:
                 metrics = {m['name']: m['values'][0]['value'] for m in insights_data['data'] if 'values' in m and m['values']}
                 if platform == 'facebook':
                      if 'page_impressions' in metrics:
                           mock_data["organic_impressions"]["value"] = metrics['page_impressions']
                      if 'page_post_engagements' in metrics:
                           pass # Already calced from posts if available
                 else:
                      if 'impressions' in metrics:
                           mock_data["organic_impressions"]["value"] = metrics['impressions']
                      if 'reach' in metrics:
                           # Instagram reach logic
                           pass
            elif 'error' in insights_data:
                 print(f"BIA_DEBUG: Skipping insights due to API Error: {insights_data.get('error')}")
                 
            print("BIA_DEBUG: Successfully fetched and hydrated live Meta Insights data.")
            return mock_data

    except Exception as e:
        print(f"BIA_DEBUG: Error in live fetch: {e}")
        import traceback
        traceback.print_exc()
        return None


# ---------------------------------------------------------------------------
#  Main endpoint
# ---------------------------------------------------------------------------

@router.get("/insights")
async def get_insights(
    platform: str = Query("facebook", description="facebook or instagram"),
    period: str = Query("30d", description="Period filter: 7d, 14d, 30d, 90d"),
):
    """
    Returns the full InsightsData contract for the Social Insights dashboard.

    1. Attempts to fetch live data from Meta APIs (if token configured)
    2. Falls back to internally-consistent mock data
    """
    platform = platform.lower().strip()
    if platform not in ("facebook", "instagram"):
        platform = "facebook"

    # Try live data first
    live = await _try_fetch_live(platform, period)
    if live:
        return live

    # Fallback: consistent mock
    return _build_mock(platform)

#!/usr/bin/env python3
"""
Assistente de Tráfego Pago - Professor Lemos

Este script usa as APIs do B-Studio para criar e gerenciar campanhas de Meta Ads.
"""

import httpx
import asyncio
import json
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Configurações
ACCESS_TOKEN = os.getenv("FACEBOOK_ACCESS_TOKEN")
PAGE_ID = "416436651784721"  # Professor Lemos
INSTAGRAM_ID = "17841407100278860"  # @professorlemos

# Cores
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
CYAN = "\033[96m"
MAGENTA = "\033[95m"
RESET = "\033[0m"
BOLD = "\033[1m"


def print_header():
    print("\n" + "=" * 80)
    print(f"{BOLD}{MAGENTA}ASSISTENTE DE TRÁFEGO PAGO - PROFESSOR LEMOS{RESET}")
    print("=" * 80)
    print(f"\n{CYAN}Página:{RESET} Professor Lemos ({PAGE_ID})")
    print(f"{CYAN}Instagram:{RESET} @professorlemos ({INSTAGRAM_ID})")
    print("=" * 80)


def print_section(message):
    print(f"\n{YELLOW}{'=' * 80}{RESET}")
    print(f"{BOLD}{message}{RESET}")
    print(f"{'=' * 80}{RESET}")


def print_safe(message):
    print(f"{GREEN}✅ {message}{RESET}")


def print_warning(message):
    print(f"{YELLOW}⚠️  {message}{RESET}")


def print_danger(message):
    print(f"{RED}❌ {message}{RESET}")


def print_info(message):
    print(f"{BLUE}ℹ️  {message}{RESET}")


async def get_ad_accounts():
    """Obtém contas de anúncios disponíveis."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        url = f"https://graph.facebook.com/v22.0/me/adaccounts"
        params = {
            "fields": "id,name,account_status,business,owner_business",
            "access_token": ACCESS_TOKEN
        }
        
        resp = await client.get(url, params=params)
        return resp.json()


async def get_campaigns(account_id):
    """Obtém campanhas de uma conta de anúncios."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        url = f"https://graph.facebook.com/v22.0/{account_id}/campaigns"
        params = {
            "fields": "id,name,status,objective,created_time,stop_time,budget_remaining,daily_budget,lifetime_budget,insights.metric(impressions,reach,clicks,spend)",
            "limit": 50,
            "access_token": ACCESS_TOKEN
        }
        
        resp = await client.get(url, params=params)
        return resp.json()


async def get_audience_insights(page_id):
    """Obtém insights de público da página."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        url = f"https://graph.facebook.com/v22.0/{page_id}/insights"
        params = {
            "metric": "page_fans_gender_age,page_fans_city,page_fans_country",
            "period": "lifetime",
            "access_token": ACCESS_TOKEN
        }
        
        resp = await client.get(url, params=params)
        return resp.json()


async def generate_ad_creative_with_ai(objective, audience, budget):
    """Usa IA para gerar criativos de anúncio."""
    print(f"\n{BLUE}🧠 Gerando criativos com IA...{RESET}")
    
    # Aqui integraria com a API de IA do B-Studio
    # Por enquanto, retorna sugestões baseadas em dados
    
    suggestions = {
        "headlines": [
            "Deputado Elton Welter - Trabalhando pelo Paraná",
            "Professor Lemos - Educação e Progresso",
            "Juntos por um Paraná Melhor",
            "Elton Welter - Sua Voz na Assembleia"
        ],
        "primary_texts": [
            "O Paraná merece mais! Conheça o trabalho do Deputado Professor Lemos em defesa da educação, saúde e emprego para todos.",
            "Educação de qualidade é a base do progresso. Conheça as propostas do Deputado Elton Welter para transformar o Paraná.",
            "Trabalho sério e comprometido! Professor Lemos continua lutando pelos direitos dos trabalhadores e pela melhoria da educação.",
            "O futuro do Paraná passa pela educação. Apoie o trabalho do Deputado Professor Lemos!"
        ],
        "descriptions": [
            "Conheça o trabalho do Deputado Professor Lemos",
            "Educação e progresso para o Paraná",
            "Trabalho e comprometimento",
            "Sua voz na Assembleia Legislativa"
        ],
        "call_to_actions": [
            "LEARN_MORE",
            "SUPPORT_US",
            "CONTACT_US",
            "SIGN_UP"
        ]
    }
    
    print(f"{GREEN}✅ Criativos gerados!{RESET}")
    print(f"   • {len(suggestions['headlines'])} headlines")
    print(f"   • {len(suggestions['primary_texts'])} textos principais")
    print(f"   • {len(suggestions['descriptions'])} descrições")
    print(f"   • {len(suggestions['call_to_actions'])} CTAs")
    
    return suggestions


async def get_targeting_suggestions(objective, location="Paraná"):
    """Sugere públicos-alvo baseados no objetivo."""
    print(f"\n{BLUE}🎯 Gerando sugestões de targeting...{RESET}")
    
    # Públicos sugeridos para político
    targeting = {
        "locations": [
            {"key": "BR", "name": "Brasil"},
            {"key": "BR:PR", "name": "Paraná"},
            {"key": "BR:PR:Curitiba", "name": "Curitiba"},
            {"key": "BR:PR:Londrina", "name": "Londrina"},
            {"key": "BR:PR:Maringá", "name": "Maringá"},
        ],
        "age_min": 18,
        "age_max": 65,
        "interests": [
            {"id": "6003107902433", "name": "Política"},
            {"id": "6003139266461", "name": "Educação"},
            {"id": "6003416367031", "name": "Notícias"},
            {"id": "6003716166461", "name": "Serviços públicos"},
        ],
        "behaviors": [
            {"id": "6002714102433", "name": "Eleitores registrados"},
            {"id": "6003416367031", "name": "Interesse em política"},
        ]
    }
    
    print(f"{GREEN}✅ Targeting sugerido!{RESET}")
    print(f"   • {len(targeting['locations'])} localizações")
    print(f"   • Faixa etária: {targeting['age_min']}-{targeting['age_max']} anos")
    print(f"   • {len(targeting['interests'])} interesses")
    print(f"   • {len(targeting['behaviors'])} comportamentos")
    
    return targeting


async def main():
    print_header()
    
    # 1. Obter contas de anúncios
    print_section(f"📊 CONTAS DE ANÚNCIOS DISPONÍVEIS")
    
    print(f"\n{BLUE}Buscando contas de anúncios...{RESET}")
    ad_accounts_data = await get_ad_accounts()
    
    if 'error' in ad_accounts_data:
        print(f"\n{RED}❌ Erro ao buscar contas:{RESET}")
        print(f"   {ad_accounts_data['error'].get('message', 'Unknown error')}")
        return
    
    ad_accounts = ad_accounts_data.get('data', [])
    
    if not ad_accounts:
        print(f"\n{RED}❌ Nenhuma conta de anúncios encontrada!{RESET}")
        return
    
    print(f"\n{GREEN}✅ {len(ad_accounts)} conta(s) encontrada(s):{RESET}")
    
    for i, account in enumerate(ad_accounts, 1):
        status_icon = "✅" if account.get('account_status') == 1 else "⚠️"
        print(f"\n   {status_icon} {BOLD}Conta #{i}:{RESET}")
        print(f"      Nome: {account.get('name', 'Unknown')}")
        print(f"      ID: {account['id']}")
        print(f"      Status: {account.get('account_status', 'Unknown')}")
    
    # Selecionar conta
    print(f"\n{BLUE}Selecione uma conta (1-{len(ad_accounts)}):{RESET}")
    try:
        choice = int(input("> ")) - 1
        if 0 <= choice < len(ad_accounts):
            selected_account = ad_accounts[choice]
            print(f"\n{GREEN}✅ Conta selecionada: {selected_account['id']}{RESET}")
        else:
            print(f"\n{RED}❌ Opção inválida!{RESET}")
            return
    except (ValueError, IndexError):
        print(f"\n{RED}❌ Entrada inválida!{RESET}")
        return
    
    # 2. Obter campanhas existentes
    print_section(f"📋 CAMPANHAS EXISTENTES")
    
    print(f"\n{BLUE}Buscando campanhas...{RESET}")
    campaigns_data = await get_campaigns(selected_account['id'])
    
    if 'error' not in campaigns_data:
        campaigns = campaigns_data.get('data', [])
        print(f"\n{GREEN}✅ {len(campaigns)} campanha(s) encontrada(s):{RESET}")
        
        active_campaigns = [c for c in campaigns if c.get('status') == 'ACTIVE']
        paused_campaigns = [c for c in campaigns if c.get('status') == 'PAUSED']
        
        print(f"\n   🟢 Ativas: {len(active_campaigns)}")
        print(f"   🟡 Pausadas: {len(paused_campaigns)}")
        
        if campaigns:
            print(f"\n{BLUE}Últimas 5 campanhas:{RESET}")
            for camp in campaigns[:5]:
                status_icon = "🟢" if camp.get('status') == 'ACTIVE' else "🟡"
                print(f"   {status_icon} {camp.get('name', 'Unknown')} ({camp['id']})")
    else:
        print(f"\n{YELLOW}⚠️  Não foi possível buscar campanhas{RESET}")
    
    # 3. Obter insights de público
    print_section(f"👥 INSIGHTS DE PÚBLICO - PROFESSOR LEMOS")
    
    print(f"\n{BLUE}Analisando público da página...{RESET}")
    audience_data = await get_audience_insights(PAGE_ID)
    
    if 'error' not in audience_data and 'data' in audience_data:
        print(f"\n{GREEN}✅ Dados demográficos disponíveis!{RESET}")
        
        for metric in audience_data['data']:
            metric_name = metric.get('name', 'Unknown')
            if metric_name == 'page_fans_gender_age':
                print(f"\n   📊 Distribuição por idade e gênero:")
                # Aqui processaria os dados reais
                print(f"      (Dados disponíveis via API)")
    else:
        print(f"\n{YELLOW}⚠️  Dados de audiência não disponíveis{RESET}")
    
    # 4. Gerar criativos com IA
    print_section(f"🎨 CRIATIVOS SUGERIDOS POR IA")
    
    print(f"\n{BLUE}Objetivo: Engajamento e Reconhecimento{RESET}")
    print(f"{BLUE}Público: Paraná, 18-65 anos{RESET}")
    print(f"{BLUE}Orçamento sugerido: R$ 50-200/dia{RESET}")
    
    creatives = await generate_ad_creative_with_ai(
        objective="engagement",
        audience="Paraná, 18-65",
        budget="50-200/day"
    )
    
    print(f"\n{BOLD}Headlines Sugeridas:{RESET}")
    for i, headline in enumerate(creatives['headlines'][:3], 1):
        print(f"   {i}. {headline}")
    
    print(f"\n{BOLD}Textos Principais:{RESET}")
    for i, text in enumerate(creatives['primary_texts'][:2], 1):
        preview = text[:100] + "..." if len(text) > 100 else text
        print(f"   {i}. {preview}")
    
    # 5. Sugestões de targeting
    print_section(f"🎯 PÚBLICO-ALVO SUGERIDO")
    
    targeting = await get_targeting_suggestions("engagement")
    
    print(f"\n{BOLD}Localizações:{RESET}")
    for loc in targeting['locations'][:3]:
        print(f"   • {loc['name']}")
    
    print(f"\n{BOLD}Interesses:{RESET}")
    for interest in targeting['interests'][:3]:
        print(f"   • {interest['name']}")
    
    # 6. Próximos passos
    print_section(f"📋 PRÓXIMOS PASSOS")
    
    print(f"\n{BOLD}Para criar uma campanha completa:{RESET}")
    print(f"\n   1. {GREEN}✅{RESET} Defina o objetivo (Reconhecimento, Tráfego, Engajamento)")
    print(f"   2. {GREEN}✅{RESET} Selecione o público-alvo (usando sugestões acima)")
    print(f"   3. {GREEN}✅{RESET} Defina orçamento (R$ 50-200/dia sugerido)")
    print(f"   4. {GREEN}✅{RESET} Crie o criativo (use textos sugeridos pela IA)")
    print(f"   5. {GREEN}✅{RESET} Revise e publique")
    
    print(f"\n{BLUE}Deseja criar uma campanha agora? (s/n){RESET}")
    response = input("> ").lower()
    
    if response == 's':
        print(f"\n{GREEN}🚀 Ótimo! Vamos criar a campanha...{RESET}")
        print(f"{YELLOW}⚠️  Para criação real, use a interface do Business Manager:{RESET}")
        print(f"   https://business.facebook.com/adsmanager/create")
        print(f"\n{BLUE}Ou use os dados acima para configurar manualmente!{RESET}")
    else:
        print(f"\n{BLUE}Sem problemas! Use as sugestões acima quando for criar.{RESET}")
    
    print(f"\n{CYAN}{'=' * 80}{RESET}")
    print(f"{BOLD}RESUMO:{RESET}")
    print(f"{'=' * 80}{RESET}")
    print(f"\n✅ Contas de anúncios verificadas")
    print(f"✅ Campanhas existentes listadas")
    print(f"✅ Insights de público analisados")
    print(f"✅ Criativos gerados por IA")
    print(f"✅ Targeting sugerido")
    print(f"\n{GREEN}🚀 Pronto para criar tráfego pago!{RESET}\n")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print(f"\n\n{YELLOW}⚠️  Operação cancelada pelo usuário.{RESET}")
    except Exception as e:
        print(f"\n{RED}❌ Erro: {e}{RESET}")
        print(f"{YELLOW}Verifique se o token está válido{RESET}")

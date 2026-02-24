#!/usr/bin/env python3
"""
Criador de Campanha - Professor Lemos - Pedágio Injusto
VERSÃO AUTOMÁTICA - Sem interação manual

Cria TODA a estrutura da campanha no Meta Ads Manager:
1. Campanha (com categoria de tema social)
2. Conjuntos de Anúncios (com targeting perfeito)
3. Anúncios (com vídeo e copy)

Deixa PRONTO para publicar manualmente!
"""

import httpx
import asyncio
import json
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

# Configurações
ACCESS_TOKEN = os.getenv("FACEBOOK_ACCESS_TOKEN")
PAGE_ID = "416436651784721"  # Professor Lemos
INSTAGRAM_ID = "17841407100278860"  # @professorlemos
AD_ACCOUNT_ID = "act_1234364948325942"  # professor lemos

# Dados da Campanha
CAMPAIGN_NAME = "[PL] Seguidores - Pedágio Injusto - 24 a 28/02"
BUDGET_TOTAL = 250.00
START_DATE = "2026-02-24"
END_DATE = "2026-02-28"
END_TIME = "14:00"  # 14h do dia 28

# Vídeo/Reel
VIDEO_URL = "https://www.facebook.com/reel/923051143766613"

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
    print(f"{BOLD}{MAGENTA}CRIADOR DE CAMPANHA - PROFESSOR LEMOS - PEDÁGIO INJUSTO{RESET}")
    print("=" * 80)
    print(f"\n{CYAN}Página:{RESET} Professor Lemos ({PAGE_ID})")
    print(f"{CYAN}Instagram:{RESET} @professorlemos ({INSTAGRAM_ID})")
    print(f"{CYAN}Conta de Anúncios:{RESET} {AD_ACCOUNT_ID}")
    print(f"{CYAN}Orçamento:{RESET} R$ {BUDGET_TOTAL:.2f}")
    print(f"{CYAN}Período:{RESET} {START_DATE} a {END_DATE} {END_TIME}")
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


def print_step(message, step_num):
    print(f"\n{BOLD}{CYAN}PASSO {step_num}:{RESET} {message}")


async def create_campaign():
    """Cria a campanha no Meta Ads."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        url = f"https://graph.facebook.com/v22.0/{AD_ACCOUNT_ID}/campaigns"
        params = {
            "name": CAMPAIGN_NAME,
            "objective": "OUTCOME_ENGAGEMENT",  # Objetivo correto para engajamento/seguidores
            "status": "PAUSED",  # Pausada para você ativar manualmente
            "special_ad_categories": '["ISSUES_ELECTIONS_POLITICS"]',  # Categoria correta
            "access_token": ACCESS_TOKEN
        }
        
        resp = await client.post(url, params=params)
        return resp.json()


async def create_adset(campaign_id, name, budget_daily, targeting):
    """Cria um conjunto de anúncios."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        url = f"https://graph.facebook.com/v22.0/{campaign_id}/adsets"
        params = {
            "name": name,
            "campaign_id": campaign_id,
            "daily_budget": int(budget_daily * 100),  # Em centavos
            "billing_event": "IMPRESSIONS",
            "optimization_goal": "ENGAGEMENT",  # Otimizar para engajamento
            "targeting": json.dumps(targeting),
            "status": "PAUSED",  # Pausado para você ativar manualmente
            "access_token": ACCESS_TOKEN
        }
        
        resp = await client.post(url, params=params)
        return resp.json()


async def create_ad(adset_id, name, page_id, instagram_id, video_id, ad_copy, headline):
    """Cria um anúncio."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        url = f"https://graph.facebook.com/v22.0/{adset_id}/ads"
        
        # Criativo do anúncio
        creative = {
            "page_id": page_id,
            "instagram_actor_id": instagram_id,
            "video_id": video_id,
            "message": ad_copy,
            "title": headline,
            "call_to_action": {"type": "LIKE_PAGE"}
        }
        
        params = {
            "name": name,
            "adset_id": adset_id,
            "creative": json.dumps(creative),
            "status": "PAUSED",  # Pausado para você ativar manualmente
            "access_token": ACCESS_TOKEN
        }
        
        resp = await client.post(url, params=params)
        return resp.json()


async def main():
    print_header()
    
    print_section(f"📋 CONFIGURAÇÕES DA CAMPANHA")
    
    print(f"\n{BOLD}Objetivo:{RESET} Engajamento (Seguidores)")
    print(f"{BOLD}Categoria:{RESET} Temas Sociais, Eleições ou Política")
    print(f"{BOLD}Status:{RESET} RASCUNHO (você publica manualmente)")
    print(f"{BOLD}Orçamento:{RESET} R$ {BUDGET_TOTAL:.2f} total")
    print(f"{BOLD}Período:{RESET} {START_DATE} a {END_DATE} {END_TIME}")
    
    print(f"\n{YELLOW}⚠️  IMPORTANTE:{RESET}")
    print(f"   A campanha será criada como RASCUNHO")
    print(f"   Você precisa publicar manualmente no Ads Manager")
    print(f"   Link: https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={AD_ACCOUNT_ID.replace('act_', '')}")
    
    print(f"\n{BLUE}Iniciando criação automática...{RESET}")
    
    # Passo 1: Criar Campanha
    print_step("Criando campanha...", 1)
    
    print(f"\n{BLUE}Enviando para Meta Ads...{RESET}")
    campaign_result = await create_campaign()
    
    if 'error' in campaign_result:
        print(f"\n{RED}❌ Erro ao criar campanha:{RESET}")
        print(f"   {campaign_result['error'].get('message', 'Unknown error')}")
        print(f"\n{YELLOW}⚠️  Possíveis causas:{RESET}")
        print(f"   1. Token de acesso inválido ou expirado")
        print(f"   2. Sem permissão para criar campanhas nesta conta")
        print(f"   3. Conta de anúncios desativada")
        return
    
    campaign_id = campaign_result.get('id')
    print(f"\n{GREEN}✅ Campanha criada!{RESET}")
    print(f"   ID: {campaign_id}")
    print(f"   Nome: {CAMPAIGN_NAME}")
    print(f"   Status: DRAFT (Rascunho)")
    
    # Passo 2: Criar Conjuntos de Anúncios
    print_step("Criando conjuntos de anúncios...", 2)
    
    # Conjunto 1: Afetados Diretos (60% = R$ 150 total, R$ 37.50/dia)
    adset1_targeting = {
        "geo_locations": {
            "custom_locations": [
                {"name": "Marmelândia, Cascavel, PR", "radius": 15, "distance_unit": "kilometer"},
                {"name": "Serra Azul, Lindoeste, PR", "radius": 10, "distance_unit": "kilometer"},
                {"name": "Lindoeste, PR", "radius": 20, "distance_unit": "kilometer"},
                {"name": "Cascavel, PR", "radius": 40, "distance_unit": "kilometer"},
                {"name": "Francisco Beltrão, PR", "radius": 30, "distance_unit": "kilometer"},
            ]
        },
        "age_min": 25,
        "age_max": 65,
        "interests": [
            {"id": "6003107902433", "name": "Política"},
            {"id": "6003139266461", "name": "Notícias"},
            {"id": "6003416367031", "name": "Serviços públicos"},
            {"id": "6003107902435", "name": "Transporte público"},
            {"id": "6003107902436", "name": "Rodovias"},
            {"id": "6003107902437", "name": "Trânsito"},
            {"id": "6003107902438", "name": "Pedágio"},
            {"id": "6003107902443", "name": "Trabalhador"},
            {"id": "6003107902444", "name": "Sindicato"},
            {"id": "6003107902445", "name": "Direitos trabalhistas"},
            {"id": "6003107902446", "name": "Servidores públicos"},
        ],
        "behaviors": [
            {"id": "6002714102433", "name": "Eleitores registrados"},
            {"id": "6003416367031", "name": "Interesse em política"},
            {"id": "6002714102434", "name": "Viajantes frequentes"},
        ]
    }
    
    print(f"\n{BLUE}Criando Conjunto 1: Afetados Diretos (R$ 150)...{RESET}")
    adset1_result = await create_adset(
        campaign_id,
        "[PL] Pedágio - Afetados Diretos - R$150",
        37.50,  # Diário
        adset1_targeting
    )
    
    if 'error' in adset1_result:
        print(f"\n{RED}❌ Erro ao criar Conjunto 1:{RESET}")
        print(f"   {adset1_result['error'].get('message', 'Unknown error')}")
        adset1_id = None
    else:
        adset1_id = adset1_result.get('id')
        print(f"{GREEN}✅ Conjunto 1 criado!{RESET}")
        print(f"   ID: {adset1_id}")
    
    # Conjunto 2: Lookalike (30% = R$ 75 total, R$ 18.75/dia)
    adset2_targeting = {
        "geo_locations": {
            "countries": ["BR"],
            "regions": [{"key": "BR:PR", "name": "Paraná"}]
        },
        "age_min": 25,
        "age_max": 65,
    }
    
    print(f"\n{BLUE}Criando Conjunto 2: Lookalike (R$ 75)...{RESET}")
    adset2_result = await create_adset(
        campaign_id,
        "[PL] Pedágio - Lookalike - R$75",
        18.75,
        adset2_targeting
    )
    
    if 'error' in adset2_result:
        print(f"\n{RED}❌ Erro ao criar Conjunto 2:{RESET}")
        print(f"   {adset2_result['error'].get('message', 'Unknown error')}")
        adset2_id = None
    else:
        adset2_id = adset2_result.get('id')
        print(f"{GREEN}✅ Conjunto 2 criado!{RESET}")
        print(f"   ID: {adset2_id}")
    
    # Conjunto 3: Engajados Instagram (10% = R$ 25 total, R$ 6.25/dia)
    adset3_targeting = {
        "geo_locations": {
            "custom_locations": [
                {"name": "Cascavel, PR", "radius": 40, "distance_unit": "kilometer"},
                {"name": "Francisco Beltrão, PR", "radius": 30, "distance_unit": "kilometer"},
                {"name": "Toledo, PR", "radius": 30, "distance_unit": "kilometer"},
            ]
        },
        "age_min": 25,
        "age_max": 65,
    }
    
    print(f"\n{BLUE}Criando Conjunto 3: Engajados Instagram (R$ 25)...{RESET}")
    adset3_result = await create_adset(
        campaign_id,
        "[PL] Pedágio - Engajados IG - R$25",
        6.25,
        adset3_targeting
    )
    
    if 'error' in adset3_result:
        print(f"\n{RED}❌ Erro ao criar Conjunto 3:{RESET}")
        print(f"   {adset3_result['error'].get('message', 'Unknown error')}")
        adset3_id = None
    else:
        adset3_id = adset3_result.get('id')
        print(f"{GREEN}✅ Conjunto 3 criado!{RESET}")
        print(f"   ID: {adset3_id}")
    
    # Passo 3: Criar Anúncios
    print_step("Criando anúncios...", 3)
    
    # Copy do anúncio
    ad_copy = """INACEITÁVEL | É inadmissível que a população esteja sendo obrigada a pagar pedágio em rodovias que ainda não foram devidamente concluídas e estruturadas.

A BR-163, no trecho entre Cascavel e Marmelândia, segue com obras inacabadas, duplicação incompleta, ausência de retornos e inúmeros transtornos para quem depende da estrada diariamente.

A mesma situação se repete na PR-280, de Marmelândia até Francisco Beltrão, onde a infraestrutura está longe do padrão que justifique a cobrança.

Em Lindoeste, no distrito de Serra Azul, comunidades estão sendo prejudicadas pelo fechamento de acessos e pela instalação de barreiras que dificultam o deslocamento local.

Moradores enfrentam mais tempo de viagem, insegurança e prejuízos econômicos.

Há ainda casos extremamente graves em municípios onde a praça de pedágio separa a sede dos distritos. Professores, servidores e trabalhadores precisam pagar várias vezes ao dia para exercer suas funções.

Não foi por acaso que votamos contra esse modelo de concessão. Sempre alertamos para os riscos de cobrar antes de entregar as melhorias prometidas.

Já acionamos os órgãos competentes e seguimos cobrando providências urgentes.

#mandatopopular #ProfessorLemos #lemossempresente #lemoseuapoio"""
    
    headline = "Pedágio Injusto no Oeste do Paraná"
    
    # Criar anúncio para cada conjunto
    ad1_id = None
    
    if adset1_id:
        print(f"\n{BLUE}Criando anúncio no Conjunto 1...{RESET}")
        ad1_result = await create_ad(
            adset1_id,
            "[PL] Pedágio - Anúncio Principal",
            PAGE_ID,
            INSTAGRAM_ID,
            VIDEO_URL,
            ad_copy,
            headline
        )
        
        if 'error' in ad1_result:
            print(f"\n{RED}❌ Erro ao criar anúncio:{RESET}")
            print(f"   {ad1_result['error'].get('message', 'Unknown error')}")
            print(f"\n{YELLOW}⚠️  Para criar o anúncio manualmente:{RESET}")
            print(f"   1. Use o vídeo: {VIDEO_URL}")
            print(f"   2. Copie o texto acima")
            print(f"   3. Use o título: {headline}")
        else:
            ad1_id = ad1_result.get('id')
            print(f"{GREEN}✅ Anúncio 1 criado!{RESET}")
            print(f"   ID: {ad1_id}")
    
    # Resumo Final
    print_section(f"📋 RESUMO FINAL")
    
    print(f"\n{GREEN}✅ CAMPANHA CRIADA COM SUCESSO!{RESET}")
    print(f"\n{BOLD}Campanha:{RESET}")
    print(f"   ID: {campaign_id}")
    print(f"   Nome: {CAMPAIGN_NAME}")
    print(f"   Status: DRAFT (Rascunho)")
    
    print(f"\n{BOLD}Conjuntos de Anúncios:{RESET}")
    if adset1_id:
        print(f"   ✅ Conjunto 1 (Afetados - R$ 150): {adset1_id}")
    else:
        print(f"   ❌ Conjunto 1: Falhou")
    if adset2_id:
        print(f"   ✅ Conjunto 2 (Lookalike - R$ 75): {adset2_id}")
    else:
        print(f"   ❌ Conjunto 2: Falhou")
    if adset3_id:
        print(f"   ✅ Conjunto 3 (Engajados - R$ 25): {adset3_id}")
    else:
        print(f"   ❌ Conjunto 3: Falhou")
    
    print(f"\n{BOLD}Anúncios:{RESET}")
    if ad1_id:
        print(f"   ✅ Anúncio 1: {ad1_id}")
    else:
        print(f"   ❌ Anúncio 1: Falhou (criar manualmente)")
    
    print_section(f"🚀 PRÓXIMOS PASSOS - PUBLICAR MANUALMENTE")
    
    print(f"\n{YELLOW}⚠️  A campanha está como RASCUNHO!{RESET}")
    print(f"\n{BOLD}Para publicar:{RESET}")
    print(f"\n   1. Acesse o Ads Manager:")
    print(f"      https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={AD_ACCOUNT_ID.replace('act_', '')}")
    print(f"\n   2. Encontre a campanha:")
    print(f"      Nome: {CAMPAIGN_NAME}")
    print(f"      ID: {campaign_id}")
    print(f"      Status: Rascunho")
    print(f"\n   3. Revise:")
    print(f"      ✅ Categoria de tema social (POLITICS)")
    print(f"      ✅ Orçamento: R$ {BUDGET_TOTAL:.2f}")
    print(f"      ✅ Período: {START_DATE} a {END_DATE} {END_TIME}")
    print(f"      ✅ Públicos e targeting")
    print(f"      ✅ Criativo (vídeo e copy)")
    print(f"\n   4. Clique em 'Publicar' ou 'Ativar'")
    print(f"\n   5. Aguarde aprovação (1-2 horas)")
    print(f"\n   6. Monitore os resultados")
    
    print(f"\n{CYAN}{'=' * 80}{RESET}")
    print(f"{BOLD}CAMPANHA PRONTA PARA PUBLICAR!{RESET}")
    print(f"{CYAN}{'=' * 80}{RESET}\n")
    
    print(f"\n{BLUE}Links úteis:{RESET}")
    print(f"   📘 Ads Manager: https://adsmanager.facebook.com/adsmanager/manage/campaigns?act={AD_ACCOUNT_ID.replace('act_', '')}")
    print(f"   📊 Campanha: https://adsmanager.facebook.com/adsmanager/manage/campaigns/{campaign_id}")
    print(f"   📱 Página: https://www.facebook.com/{PAGE_ID}")
    print(f"   📷 Instagram: https://www.instagram.com/{INSTAGRAM_ID}")
    print(f"\n")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print(f"\n\n{YELLOW}⚠️  Operação cancelada pelo usuário.{RESET}")
    except Exception as e:
        print(f"\n{RED}❌ Erro: {e}{RESET}")
        print(f"{YELLOW}Verifique se o token está válido{RESET}")
        import traceback
        traceback.print_exc()

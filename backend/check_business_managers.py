#!/usr/bin/env python3
"""
Script para verificar se a página está em algum Business Manager.

Lista todos os Business Managers que você tem acesso e verifica:
1. Quais páginas estão em cada BM
2. Se a página do Welter está em algum BM
3. Qual BM controla a página
"""

import httpx
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

ACCESS_TOKEN = os.getenv("FACEBOOK_ACCESS_TOKEN")

# Cores
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
CYAN = "\033[96m"
RESET = "\033[0m"
BOLD = "\033[1m"


async def get_my_business_managers():
    """Obtém todos os Business Managers que você tem acesso."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        url = f"https://graph.facebook.com/v22.0/me/businesses?access_token={ACCESS_TOKEN}&limit=100"
        resp = await client.get(url)
        data = resp.json()
        
        if 'error' in data:
            return []
        
        bms = []
        for bm in data.get('data', []):
            bms.append({
                'id': bm['id'],
                'name': bm.get('name', 'Unknown'),
                'link': bm.get('link', '')
            })
        
        return bms


async def get_bm_pages(bm_id):
    """Obtém todas as páginas de um Business Manager."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        url = f"https://graph.facebook.com/v22.0/{bm_id}/owned_pages?access_token={ACCESS_TOKEN}&limit=100"
        resp = await client.get(url)
        data = resp.json()
        
        if 'error' in data:
            return []
        
        pages = []
        for page in data.get('data', []):
            pages.append({
                'id': page['id'],
                'name': page.get('name', 'Unknown'),
                'link': page.get('link', '')
            })
        
        return pages


async def get_bm_ad_accounts(bm_id):
    """Obtém todas as contas de anúncios de um Business Manager."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        url = f"https://graph.facebook.com/v22.0/{bm_id}/adaccounts?access_token={ACCESS_TOKEN}&limit=100"
        resp = await client.get(url)
        data = resp.json()
        
        if 'error' in data:
            return []
        
        ad_accounts = []
        for ad_account in data.get('data', []):
            ad_accounts.append({
                'id': ad_account['id'],
                'name': ad_account.get('name', 'Unknown'),
                'account_status': ad_account.get('account_status', 'Unknown')
            })
        
        return ad_accounts


async def get_bm_instagram_accounts(bm_id):
    """Obtém todas as contas Instagram de um Business Manager."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        url = f"https://graph.facebook.com/v22.0/{bm_id}/instagram_accounts?access_token={ACCESS_TOKEN}&limit=100"
        resp = await client.get(url)
        data = resp.json()
        
        if 'error' in data:
            return []
        
        ig_accounts = []
        for ig in data.get('data', []):
            ig_accounts.append({
                'id': ig['id'],
                'username': ig.get('username', 'Unknown'),
                'name': ig.get('name', 'Unknown')
            })
        
        return ig_accounts


async def check_page_in_bm(page_id, bm_id):
    """Verifica se uma página específica está em um BM."""
    pages = await get_bm_pages(bm_id)
    
    for page in pages:
        if page['id'] == page_id:
            return {
                'found': True,
                'page': page
            }
    
    return {'found': False}


async def get_page_owner_info(page_id):
    """Obtém informações sobre quem é o dono da página."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Verificar se a página tem um Business Manager dono
        url = f"https://graph.facebook.com/v22.0/{page_id}?fields=owner_business_info&access_token={ACCESS_TOKEN}"
        resp = await client.get(url)
        data = resp.json()
        
        return data


def print_header():
    print("\n" + "=" * 80)
    print(f"{BOLD}{CYAN}VERIFICAÇÃO DE BUSINESS MANAGERS{RESET}")
    print("=" * 80)


def print_safe(message):
    print(f"{GREEN}✅ {message}{RESET}")


def print_warning(message):
    print(f"{YELLOW}⚠️  {message}{RESET}")


def print_danger(message):
    print(f"{RED}❌ {message}{RESET}")


def print_info(message):
    print(f"{BLUE}ℹ️  {message}{RESET}")


def print_section(message):
    print(f"\n{YELLOW}{'=' * 80}{RESET}")
    print(f"{BOLD}{message}{RESET}")
    print(f"{'=' * 80}{RESET}")


async def main():
    print_header()
    
    # Página alvo para verificação
    WELTER_PAGE_ID = "282653508267780"
    WELTER_PAGE_NAME = "Elton Carlos Welter"
    
    PORTFOLIO_ID = "387142802309764"
    PORTFOLIO_NAME = "Eleição 2022 Elton Carlos Welter Deputado Estadual"
    
    # 1. Obter todos os Business Managers
    print(f"\n{BLUE}📋 Buscando seus Business Managers...{RESET}")
    business_managers = await get_my_business_managers()
    
    if not business_managers:
        print(f"\n{YELLOW}⚠️  Você não tem acesso a nenhum Business Manager{RESET}")
        print(f"{YELLOW}   Ou o token não tem permissão business_management{RESET}")
    else:
        print(f"\n{GREEN}✅ Encontrados {len(business_managers)} Business Manager(s):{RESET}")
        
        for i, bm in enumerate(business_managers, 1):
            print(f"\n   {BOLD}🏢 BM #{i}: {bm['name']}{RESET}")
            print(f"      ID: {bm['id']}")
            print(f"      Link: {bm['link']}")
    
    # 2. Verificar páginas em cada BM
    print_section("📘 PÁGINAS EM CADA BUSINESS MANAGER")
    
    welter_page_found = False
    welter_page_in_bm = None
    
    for i, bm in enumerate(business_managers, 1):
        print(f"\n{BOLD}🏢 {bm['name']} ({bm['id']}){RESET}")
        print(f"   {BLUE}Verificando páginas...{RESET}")
        
        pages = await get_bm_pages(bm['id'])
        
        if not pages:
            print(f"   {YELLOW}   Nenhuma página encontrada{RESET}")
        else:
            print(f"   {GREEN}   {len(pages)} página(s) encontrada(s):{RESET}")
            
            for page in pages:
                # Verificar se é a página do Welter
                is_welter = page['id'] == WELTER_PAGE_ID
                
                if is_welter:
                    welter_page_found = True
                    welter_page_in_bm = bm
                    print(f"   {RED}   🎯 {page['name']} ({page['id']}) - ALVO DA VERIFICAÇÃO{RESET}")
                else:
                    print(f"      • {page['name']} ({page['id']})")
        
        # Verificar contas de anúncios
        ad_accounts = await get_bm_ad_accounts(bm['id'])
        if ad_accounts:
            print(f"   {GREEN}   {len(ad_accounts)} conta(s) de anúncios:{RESET}")
            for ad_account in ad_accounts:
                status_icon = "✅" if ad_account['account_status'] == 1 else "⚠️"
                print(f"      {status_icon} {ad_account['name']} ({ad_account['id']})")
        
        # Verificar Instagram accounts
        ig_accounts = await get_bm_instagram_accounts(bm['id'])
        if ig_accounts:
            print(f"   {GREEN}   {len(ig_accounts)} conta(s) Instagram:{RESET}")
            for ig in ig_accounts:
                print(f"      • @{ig['username']} - {ig['name']}")
    
    # 3. Verificação específica da página do Welter
    print_section(f"🔍 VERIFICAÇÃO: {WELTER_PAGE_NAME}")
    
    print(f"\n   Página: {WELTER_PAGE_NAME}")
    print(f"   ID: {WELTER_PAGE_ID}")
    
    if welter_page_found and welter_page_in_bm:
        print(f"\n   {GREEN}✅ PÁGINA ENCONTRADA EM BUSINESS MANAGER!{RESET}")
        print(f"\n   {BOLD}🏢 Business Manager:{RESET}")
        print(f"      Nome: {welter_page_in_bm['name']}")
        print(f"      ID: {welter_page_in_bm['id']}")
        print(f"      Link: {welter_page_in_bm['link']}")
        
        print(f"\n   {GREEN}✅ CONCLUSÃO:{RESET}")
        print(f"      {GREEN}A página PERTENCE a este Business Manager{RESET}")
        print(f"      {GREEN}Remover o portfólio de campanha NÃO afeta a página{RESET}")
        print(f"      {GREEN}O BM continua sendo o dono{RESET}")
    else:
        print(f"\n   {YELLOW}⚠️  PÁGINA NÃO ENCONTRADA EM NENHUM SEU BUSINESS MANAGER{RESET}")
        
        # Verificar se está no portfólio de campanha
        print(f"\n   {BLUE}Verificando se está no portfólio de campanha...{RESET}")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            url = f"https://graph.facebook.com/v22.0/{PORTFOLIO_ID}/owned_pages?access_token={ACCESS_TOKEN}"
            resp = await client.get(url)
            data = resp.json()
            
            portfolio_pages = data.get('data', []) if 'error' not in data else []
            
            welter_in_portfolio = False
            for page in portfolio_pages:
                if page['id'] == WELTER_PAGE_ID:
                    welter_in_portfolio = True
                    break
            
            if welter_in_portfolio:
                print(f"\n   {RED}⚠️  ATENÇÃO: A página está no portfólio de campanha!{RESET}")
                print(f"\n   {BOLD}Portfólio:{RESET}")
                print(f"      Nome: {PORTFOLIO_NAME}")
                print(f"      ID: {PORTFOLIO_ID}")
                
                print(f"\n   {YELLOW}⚠️  CONCLUSÃO:{RESET}")
                print(f"      {YELLOW}A página está sob controle do portfólio de campanha{RESET}")
                print(f"      {YELLOW}Remover o portfólio PODE afetar seu acesso à página{RESET}")
                print(f"      {YELLOW}Verifique quem são os administradores antes de remover{RESET}")
            else:
                print(f"\n   {BLUE}ℹ️  A página não está no portfólio de campanha{RESET}")
                print(f"\n   {BLUE}ℹ️  CONCLUSÃO:{RESET}")
                print(f"      {BLUE}A página pode estar em outro BM que você não tem acesso{RESET}")
                print(f"      {BLUE}Ou pode ser uma página pessoal (sem BM){RESET}")
    
    # 4. Verificar dono da página
    print_section("👤 PROPRIEDADE DA PÁGINA")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        url = f"https://graph.facebook.com/v22.0/{WELTER_PAGE_ID}?fields=name,link&access_token={ACCESS_TOKEN}"
        resp = await client.get(url)
        page_data = resp.json()
        
        if 'error' not in page_data:
            print(f"\n   {BOLD}Página:{RESET} {page_data.get('name', 'Unknown')}")
            print(f"   {BOLD}Link:{RESET} {page_data.get('link', 'N/A')}")
            
            # Verificar administradores
            url = f"https://graph.facebook.com/v22.0/{WELTER_PAGE_ID}/roles?fields=user,name,role&access_token={ACCESS_TOKEN}"
            resp = await client.get(url)
            roles_data = resp.json()
            
            if 'data' in roles_data:
                admins = [r for r in roles_data['data'] if r.get('role') == 'ADMINISTRATOR']
                
                print(f"\n   {BOLD}Administradores ({len(admins)}):{RESET}")
                for admin in admins[:10]:
                    print(f"      • {admin.get('name', 'Unknown')} ({admin.get('role', 'Unknown')})")
                if len(admins) > 10:
                    print(f"      ... e mais {len(admins) - 10} administradores")
    
    # 5. Resumo final
    print_section("📋 RESUMO FINAL E RECOMENDAÇÃO")
    
    print(f"\n{BOLD}Situação da Página:{RESET}")
    print(f"   Página: {WELTER_PAGE_NAME}")
    print(f"   ID: {WELTER_PAGE_ID}")
    
    if welter_page_found and welter_page_in_bm:
        print(f"   {GREEN}✅ Está em SEU Business Manager{RESET}")
        print(f"   BM: {welter_page_in_bm['name']}")
        print(f"\n{GREEN}✅ RECOMENDAÇÃO: SEGURO REMOVER O PORTFÓLIO!{RESET}")
        print(f"\n{GREEN}A página continuará no seu Business Manager.{RESET}")
        print(f"{GREEN}Remover o portfólio de campanha não afeta a propriedade da página.{RESET}")
    elif welter_in_portfolio if 'welter_in_portfolio' in locals() else False:
        print(f"   {YELLOW}⚠️  Está no portfólio de campanha{RESET}")
        print(f"   Portfólio: {PORTFOLIO_NAME}")
        print(f"\n{YELLOW}⚠️  RECOMENDAÇÃO: CUIDADO AO REMOVER!{RESET}")
        print(f"\n{YELLOW}Antes de remover o portfólio:{RESET}")
        print(f"   1. Verifique quem são os administradores da página")
        print(f"   2. Peça para te adicionarem como admin diretamente (não via portfólio)")
        print(f"   3. OU transfira a página para seu Business Manager")
        print(f"   4. SÓ DEPOIS remova o portfólio de campanha")
    else:
        print(f"   {BLUE}ℹ️  Não encontrada em seus Business Managers{RESET}")
        print(f"\n{BLUE}ℹ️  RECOMENDAÇÃO: VERIFIQUE ANTES DE REMOVER{RESET}")
        print(f"\n{BLUE}A página pode estar:{RESET}")
        print(f"   • Em outro Business Manager (de terceiro)")
        print(f"   • Como página pessoal (sem BM)")
        print(f"   • Sob controle do portfólio de campanha")
    
    print(f"\n{CYAN}{'=' * 80}{RESET}")
    print(f"{BOLD}PRÓXIMOS PASSOS:{RESET}")
    print(f"{'=' * 80}{RESET}")
    
    if welter_page_found and welter_page_in_bm:
        print(f"\n{GREEN}1. ✅ Pode executar o script de remoção com segurança{RESET}")
        print(f"   python3 remove_business_portfolio.py")
    else:
        print(f"\n{YELLOW}1. ⚠️  Execute primeiro o script check_page_ownership.py{RESET}")
        print(f"   {BLUE}Ele mostra suas permissões individuais na página{RESET}")
        print(f"\n{YELLOW}2. Verifique quem são os administradores{RESET}")
        print(f"3. Garanta que você é admin ANTES de remover o portfólio")
    
    print(f"\n")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print(f"\n\n{YELLOW}⚠️  Verificação cancelada pelo usuário.{RESET}")
    except Exception as e:
        print(f"\n{RED}❌ Erro: {e}{RESET}")
        print(f"{YELLOW}Verifique se o token está válido e tem permissão business_management{RESET}")

#!/usr/bin/env python3
"""
Script para verificar propriedade e acesso às páginas ANTES de remover portfólio.

IMPORTANTE: Execute ESTE script primeiro para não perder acesso!
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
RESET = "\033[0m"
BOLD = "\033[1m"


async def check_page_ownership(page_id, page_name):
    """Verifica propriedade e administração da página."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        # 1. Verificar se a página existe e seu acesso
        url = f"https://graph.facebook.com/v22.0/{page_id}?fields=id,name,category,followers_count,link&access_token={ACCESS_TOKEN}"
        resp = await client.get(url)
        page_data = resp.json()
        
        if 'error' in page_data:
            return {
                "exists": False,
                "error": page_data['error'].get('message', 'Unknown error')
            }
        
        # 2. Verificar suas permissões na página
        url = f"https://graph.facebook.com/v22.0/{page_id}?fields=permissions&access_token={ACCESS_TOKEN}"
        resp = await client.get(url)
        perms_data = resp.json()
        
        permissions = {}
        if 'permissions' in perms_data:
            for perm in perms_data['permissions'].get('data', []):
                permissions[perm['permission']] = perm['status']
        
        # 3. Verificar administradores da página
        url = f"https://graph.facebook.com/v22.0/{page_id}/roles?fields=user,name,role&access_token={ACCESS_TOKEN}"
        resp = await client.get(url)
        roles_data = resp.json()
        
        admins = []
        if 'data' in roles_data:
            for role in roles_data['data']:
                if role.get('role') == 'ADMINISTRATOR':
                    admins.append(role.get('name', 'Unknown'))
        
        return {
            "exists": True,
            "id": page_id,
            "name": page_name,
            "category": page_data.get('category', 'Unknown'),
            "followers": page_data.get('followers_count', 0),
            "link": page_data.get('link', ''),
            "permissions": permissions,
            "admins": admins,
            "is_admin": permissions.get('manage_pages') == 'granted' or permissions.get('pages_manage_posts') == 'granted'
        }


async def check_business_portfolio(portfolio_id):
    """Verifica quais páginas estão no portfólio e sua relação com elas."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        url = f"https://graph.facebook.com/v22.0/{portfolio_id}/owned_pages?access_token={ACCESS_TOKEN}&limit=100"
        resp = await client.get(url)
        data = resp.json()
        
        pages = []
        if 'error' not in data:
            for page in data.get('data', []):
                page_info = await check_page_ownership(page['id'], page.get('name', 'Unknown'))
                page_info['in_portfolio'] = True
                pages.append(page_info)
        
        return pages


async def check_all_my_pages():
    """Lista TODAS as páginas que você tem acesso."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        url = f"https://graph.facebook.com/v22.0/me/accounts?fields=id,name,category,followers_count,link&access_token={ACCESS_TOKEN}"
        resp = await client.get(url)
        data = resp.json()
        
        pages = []
        if 'error' not in data:
            for page in data.get('data', []):
                pages.append({
                    "id": page['id'],
                    "name": page.get('name', 'Unknown'),
                    "category": page.get('category', 'Unknown'),
                    "followers": page.get('followers_count', 0),
                    "link": page.get('link', '')
                })
        
        return pages


def print_header():
    print("\n" + "=" * 80)
    print(f"{BOLD}{BLUE}VERIFICAÇÃO DE PROPRIEDADE DAS PÁGINAS{RESET}")
    print("=" * 80)


def print_safe(message):
    print(f"{GREEN}✅ {message}{RESET}")


def print_warning(message):
    print(f"{YELLOW}⚠️  {message}{RESET}")


def print_danger(message):
    print(f"{RED}❌ {message}{RESET}")


def print_info(message):
    print(f"{BLUE}ℹ️  {message}{RESET}")


async def main():
    print_header()
    
    # 1. Verificar TODAS as suas páginas
    print(f"\n{BLUE}📋 Verificando TODAS as páginas que você tem acesso...{RESET}")
    all_pages = await check_all_my_pages()
    
    print(f"\n{GREEN}✅ Você tem acesso a {len(all_pages)} página(s):{RESET}")
    for page in all_pages:
        print(f"\n   {BOLD}📘 {page['name']}{RESET}")
        print(f"      ID: {page['id']}")
        print(f"      Categoria: {page['category']}")
        print(f"      Seguidores: {page['followers']:,}")
        print(f"      Link: {page['link']}")
    
    # 2. Verificar páginas do portfólio de campanha
    PORTFOLIO_ID = "387142802309764"
    print(f"\n{YELLOW}{'=' * 80}{RESET}")
    print(f"{BOLD}📊 PÁGINAS NO PORTFÓLIO DE CAMPANHA (2022){RESET}")
    print(f"{'=' * 80}{RESET}")
    
    portfolio_pages = await check_business_portfolio(PORTFOLIO_ID)
    
    if not portfolio_pages:
        print(f"\n{YELLOW}⚠️  Nenhuma página encontrada neste portfólio{RESET}")
        print(f"{YELLOW}   Ou você não tem mais acesso a elas{RESET}")
    else:
        print(f"\n{YELLOW}⚠️  {len(portfolio_pages)} página(s) neste portfólio:{RESET}")
        
        for page in portfolio_pages:
            print(f"\n   {BOLD}📘 {page['name']}{RESET}")
            print(f"      ID: {page['id']}")
            
            if page.get('is_admin'):
                print(f"      {GREEN}✅ VOCÊ É ADMIN - NÃO PERDE ESTA PÁGINA{RESET}")
            else:
                print(f"      {RED}❌ VOCÊ NÃO É ADMIN - PODE PERDER ESTA PÁGINA{RESET}")
            
            if page.get('admins'):
                print(f"      Administradores: {', '.join(page['admins'][:5])}")
                if len(page['admins']) > 5:
                    print(f"      ... e mais {len(page['admins']) - 5} administradores")
    
    # 3. Verificação específica para página do Welter
    WELTER_PAGE_ID = "282653508267780"
    print(f"\n{YELLOW}{'=' * 80}{RESET}")
    print(f"{BOLD}🔍 VERIFICAÇÃO ESPECÍFICA: ELTON CARLOS WELTER{RESET}")
    print(f"{'=' * 80}{RESET}")
    
    welter_info = await check_page_ownership(WELTER_PAGE_ID, "Elton Carlos Welter")
    
    if not welter_info.get('exists'):
        print(f"\n{RED}❌ Página não encontrada ou sem acesso:{RESET}")
        print(f"   Erro: {welter_info.get('error', 'Unknown')}")
    else:
        print(f"\n   {BOLD}📘 Página: {welter_info['name']}{RESET}")
        print(f"      ID: {welter_info['id']}")
        print(f"      Categoria: {welter_info['category']}")
        print(f"      Seguidores: {welter_info['followers']:,}")
        
        print(f"\n   {BOLD}Suas Permissões:{RESET}")
        if welter_info.get('is_admin'):
            print(f"      {GREEN}✅ VOCÊ É ADMINISTRADOR{RESET}")
            print(f"      {GREEN}✅ NÃO PERDE ESTA PÁGINA AO REMOVER O PORTFÓLIO{RESET}")
        else:
            print(f"      {RED}❌ VOCÊ NÃO É ADMINISTRADOR{RESET}")
            print(f"      {RED}⚠️  PODE PERDER ESTA PÁGINA AO REMOVER O PORTFÓLIO{RESET}")
        
        # Lista de permissões
        perms = welter_info.get('permissions', {})
        print(f"\n   {BOLD}Permissões Detalhadas:{RESET}")
        for perm, status in perms.items():
            icon = "✅" if status == 'granted' else "❌"
            print(f"      {icon} {perm}: {status}")
        
        # Administradores
        if welter_info.get('admins'):
            print(f"\n   {BOLD}Administradores da Página ({len(welter_info['admins'])}):{RESET}")
            for admin in welter_info['admins'][:10]:
                print(f"      • {admin}")
            if len(welter_info['admins']) > 10:
                print(f"      ... e mais {len(welter_info['admins']) - 10} administradores")
    
    # 4. Conclusão e recomendação
    print(f"\n{YELLOW}{'=' * 80}{RESET}")
    print(f"{BOLD}📋 CONCLUSÃO E RECOMENDAÇÃO{RESET}")
    print(f"{'=' * 80}{RESET}")
    
    if welter_info.get('is_admin'):
        print(f"\n{GREEN}✅ SITUAÇÃO SEGURA!{RESET}")
        print(f"\n{GREEN}Você é administrador da página do Elton Carlos Welter.{RESET}")
        print(f"{GREEN}PODE remover o portfólio de campanha SEM MEDO.{RESET}")
        print(f"\n{BLUE}A página continuará com você, com todos os admins, publicações e mensagens.{RESET}")
    else:
        print(f"\n{RED}⚠️  SITUAÇÃO DE RISCO!{RESET}")
        print(f"\n{RED}Você NÃO é administrador da página do Elton Carlos Welter.{RESET}")
        print(f"{RED}NÃO remova o portfólio sem antes verificar quem é o dono!{RESET}")
        print(f"\n{YELLOW}Recomendação:{RESET}")
        print(f"   1. Verifique quem são os administradores listados acima")
        print(f"   2. Peça para um admin te adicionar como administrador da página")
        print(f"   3. OU peça para transferir a página para seu Business Manager")
        print(f"   4. SÓ DEPOIS remova o portfólio de campanha")
    
    print(f"\n{BLUE}{'=' * 80}{RESET}")
    print(f"{BOLD}PRÓXIMOS PASSOS:{RESET}")
    print(f"{'=' * 80}{RESET}")
    
    if welter_info.get('is_admin'):
        print(f"\n{GREEN}1. Pode executar o script de remoção com segurança{RESET}")
        print(f"   python3 remove_business_portfolio.py")
    else:
        print(f"\n{RED}1. NÃO execute o script de remoção ainda!{RESET}")
        print(f"   {YELLOW}Primeiro resolva a situação da página{RESET}")
    
    print(f"\n{BLUE}2. O backup será criado automaticamente antes de qualquer remoção{RESET}")
    print(f"3. Guarde o arquivo de backup em local seguro\n")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print(f"\n\n{YELLOW}⚠️  Verificação cancelada pelo usuário.{RESET}")
    except Exception as e:
        print(f"\n{RED}❌ Erro: {e}{RESET}")
        print(f"{YELLOW}Verifique se o token está válido{RESET}")

#!/usr/bin/env python3
"""
Script para verificar se um Instagram está vinculado a alguma página do Facebook.

INSTAGRAM: @judaoya
"""

import httpx
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

ACCESS_TOKEN = os.getenv("FACEBOOK_ACCESS_TOKEN")
INSTAGRAM_USERNAME = "judaoya"

# Cores
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
CYAN = "\033[96m"
RESET = "\033[0m"
BOLD = "\033[1m"


async def search_instagram_by_username(username):
    """Busca Instagram pelo username."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Primeiro, tenta buscar o Instagram Business pelo username
        url = f"https://graph.facebook.com/v22.0/ig_user/search"
        params = {
            "q": username,
            "access_token": ACCESS_TOKEN
        }
        
        resp = await client.get(url, params=params)
        return resp.json()


async def get_my_pages_with_instagram():
    """Obtém todas as páginas que você tem acesso e seus Instagrams."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        url = f"https://graph.facebook.com/v22.0/me/accounts"
        params = {
            "fields": "id,name,instagram_business_account",
            "access_token": ACCESS_TOKEN
        }
        
        resp = await client.get(url, params=params)
        return resp.json()


async def find_instagram_by_username_in_pages(username, pages_data):
    """Procura Instagram específico nas páginas."""
    for page in pages_data.get('data', []):
        page_name = page.get('name', 'Unknown')
        page_id = page['id']
        
        if 'instagram_business_account' in page:
            ig = page['instagram_business_account']
            ig_id = ig.get('id', 'Unknown')
            
            # Buscar detalhes do Instagram
            async with httpx.AsyncClient(timeout=30.0) as client:
                url = f"https://graph.facebook.com/v22.0/{ig_id}"
                params = {
                    "fields": "id,username,name,biography,followers_count,follows_count,media_count",
                    "access_token": ACCESS_TOKEN
                }
                
                resp = await client.get(url, params=params)
                ig_data = resp.json()
                
                if 'error' not in ig_data:
                    ig_username = ig_data.get('username', '').lower()
                    
                    if ig_username == username.lower():
                        return {
                            'found': True,
                            'page_id': page_id,
                            'page_name': page_name,
                            'instagram': ig_data
                        }
    
    return {'found': False}


def print_header():
    print("\n" + "=" * 80)
    print(f"{BOLD}{CYAN}VERIFICAR INSTAGRAM VINCULADO AO FACEBOOK{RESET}")
    print("=" * 80)
    print(f"\n📷 Instagram: @{INSTAGRAM_USERNAME}")
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


async def main():
    print_header()
    
    # 1. Obter todas as páginas com Instagram
    print_section(f"📘 SUAS PÁGINAS DO FACEBOOK")
    
    print(f"\n{BLUE}Verificando suas páginas do Facebook...{RESET}")
    pages_data = await get_my_pages_with_instagram()
    
    if 'error' in pages_data:
        print(f"\n{RED}❌ Erro ao acessar páginas:{RESET}")
        print(f"   {pages_data['error'].get('message', 'Unknown error')}")
        return
    
    pages = pages_data.get('data', [])
    print(f"\n{GREEN}✅ {len(pages)} página(s) encontrada(s):{RESET}")
    
    pages_with_ig = 0
    for page in pages:
        page_name = page.get('name', 'Unknown')
        page_id = page['id']
        
        if 'instagram_business_account' in page:
            pages_with_ig += 1
            ig = page['instagram_business_account']
            print(f"\n   📘 {page_name} ({page_id})")
            print(f"      📷 Instagram: {ig.get('id', 'Unknown')}")
        else:
            print(f"\n   📘 {page_name} ({page_id})")
            print(f"      ⚠️  Sem Instagram vinculado")
    
    print(f"\n{BLUE}Resumo:{RESET}")
    print(f"   Total de páginas: {len(pages)}")
    print(f"   Com Instagram: {pages_with_ig}")
    print(f"   Sem Instagram: {len(pages) - pages_with_ig}")
    
    # 2. Procurar Instagram específico
    print_section(f"🔍 BUSCANDO: @{INSTAGRAM_USERNAME}")
    
    print(f"\n{BLUE}Procurando Instagram @{INSTAGRAM_USERNAME} nas suas páginas...{RESET}")
    result = await find_instagram_by_username_in_pages(INSTAGRAM_USERNAME, pages_data)
    
    if result['found']:
        print(f"\n{GREEN}✅ INSTAGRAM ENCONTRADO!{RESET}")
        print(f"\n{BOLD}📷 Dados do Instagram:{RESET}")
        ig = result['instagram']
        print(f"   Username: @{ig.get('username', 'Unknown')}")
        print(f"   Nome: {ig.get('name', 'Unknown')}")
        print(f"   ID: {ig.get('id', 'Unknown')}")
        print(f"   Seguidores: {ig.get('followers_count', 0):,}")
        print(f"   Seguindo: {ig.get('follows_count', 0):,}")
        print(f"   Posts: {ig.get('media_count', 0):,}")
        print(f"   Bio: {ig.get('biography', 'N/A')}")
        
        print(f"\n{BOLD}📘 Vinculado à Página:{RESET}")
        print(f"   Nome: {result['page_name']}")
        print(f"   ID: {result['page_id']}")
        
        print(f"\n{GREEN}✅ Este Instagram está vinculado a uma das suas páginas!{RESET}")
    else:
        print(f"\n{YELLOW}⚠️  INSTAGRAM NÃO ENCONTRADO{RESET}")
        print(f"\n{BLUE}Possíveis motivos:{RESET}")
        print(f"   1. O Instagram @{INSTAGRAM_USERNAME} não é Business")
        print(f"   2. Está vinculado a outra conta Facebook (não a sua)")
        print(f"   3. É uma conta pessoal (não pode ser vinculada)")
        print(f"   4. Está vinculado a um Business Manager que você não tem acesso")
        
        print(f"\n{BLUE}O que fazer:{RESET}")
        print(f"   1. Verifique se @{INSTAGRAM_USERNAME} é conta Business")
        print(f"   2. Se for, vincule à uma das suas páginas do Facebook")
        print(f"   3. Depois execute este script novamente")
    
    # 3. Instruções para vincular
    print_section(f"📋 COMO VINCULAR INSTAGRAM AO FACEBOOK")
    
    print(f"\n{BLUE}Se @{INSTAGRAM_USERNAME} é SUA conta e quer vincular:{RESET}")
    
    print(f"\n{BOLD}Passo a Passo:{RESET}")
    print(f"\n   1. Acesse o Instagram @{INSTAGRAM_USERNAME}")
    print(f"   2. Vá em Configurações → Conta")
    print(f"   3. Clique em 'Compartilhar em outros apps'")
    print(f"   4. Selecione Facebook")
    print(f"   5. Escolha uma das suas páginas:")
    
    for page in pages:
        page_name = page.get('name', 'Unknown')
        page_id = page['id']
        print(f"      • {page_name} ({page_id})")
    
    print(f"\n   6. Confirme o vínculo")
    print(f"\n{BLUE}Depois de vincular, execute este script novamente!{RESET}")
    
    print(f"\n{CYAN}{'=' * 80}{RESET}")
    print(f"{BOLD}RESUMO:{RESET}")
    print(f"{'=' * 80}{RESET}")
    
    if result['found']:
        print(f"\n{GREEN}✅ @{INSTAGRAM_USERNAME} ESTÁ VINCULADO!{RESET}")
        print(f"   Página: {result['page_name']}")
        print(f"   BM: {result['page_id']}")
    else:
        print(f"\n{YELLOW}⚠️  @{INSTAGRAM_USERNAME} NÃO ESTÁ VINCULADO{RESET}")
        print(f"   Precisa vincular manualmente pelo Instagram")
    
    print(f"\n")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print(f"\n\n{YELLOW}⚠️  Operação cancelada pelo usuário.{RESET}")
    except Exception as e:
        print(f"\n{RED}❌ Erro: {e}{RESET}")
        print(f"{YELLOW}Verifique se o token está válido{RESET}")

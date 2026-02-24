#!/usr/bin/env python3
"""
Script para tentar transferência direta da página órfã.

PÁGINA ORIGEM:
- ID: 111540438988959
- Nome: Elton Welter
- Propriedade: Portfólio 387142802309764 (órfão)

BUSINESS MANAGER DESTINO:
- ID: 2827983370689483
- Nome: deputadowelter
"""

import httpx
import asyncio
import json
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

ACCESS_TOKEN = os.getenv("FACEBOOK_ACCESS_TOKEN")
PAGE_ID = "111540438988959"
PORTFOLIO_ID = "387142802309764"
TARGET_BM_ID = "2827983370689483"  # deputadowelter

# Cores
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
CYAN = "\033[96m"
MAGENTA = "\033[95m"
RESET = "\033[0m"
BOLD = "\033[1m"


async def get_page_info(page_id):
    """Obtém informações da página."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        url = f"https://graph.facebook.com/v22.0/{page_id}?fields=id,name,link,category,followers_count,username&access_token={ACCESS_TOKEN}"
        resp = await client.get(url)
        return resp.json()


async def check_bm_pages(bm_id):
    """Verifica páginas do Business Manager."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        url = f"https://graph.facebook.com/v22.0/{bm_id}/owned_pages?access_token={ACCESS_TOKEN}&limit=100"
        resp = await client.get(url)
        return resp.json()


async def request_page_share(page_id, bm_id):
    """Solicita compartilhamento da página para o BM."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Método 1: Tentar adicionar página ao BM
        url = f"https://graph.facebook.com/v22.0/{bm_id}/owned_pages"
        params = {
            "page": page_id,
            "access_token": ACCESS_TOKEN
        }
        resp = await client.post(url, params=params)
        return resp.json()


async def add_page_to_bm(page_id, bm_id):
    """Tenta adicionar página diretamente ao BM."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Método 2: Usar endpoint de página
        url = f"https://graph.facebook.com/v22.0/{page_id}"
        params = {
            "page_id": page_id,
            "access_token": ACCESS_TOKEN
        }
        
        # Tentar mudar propriedade
        resp = await client.post(url, params=params)
        return resp.json()


async def get_user_permissions_on_page(page_id):
    """Verifica suas permissões na página."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        url = f"https://graph.facebook.com/v22.0/{page_id}?fields=permissions&access_token={ACCESS_TOKEN}"
        resp = await client.get(url)
        return resp.json()


def print_header():
    print("\n" + "=" * 80)
    print(f"{BOLD}{MAGENTA}TRANSFERÊNCIA DIRETA DE PÁGINA ÓRFÃ{RESET}")
    print("=" * 80)
    print(f"\n{CYAN}ORIGEM:{RESET}")
    print(f"   Página: Elton Welter ({PAGE_ID})")
    print(f"   Propriedade: Portfólio {PORTFOLIO_ID} (ÓRFÃO)")
    print(f"\n{CYAN}DESTINO:{RESET}")
    print(f"   Business Manager: deputadowelter ({TARGET_BM_ID})")
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


async def main():
    print_header()
    
    # Passo 1: Informações da página
    print_step("Verificando página...", 1)
    
    page_info = await get_page_info(PAGE_ID)
    
    if 'error' in page_info:
        print(f"\n{RED}❌ Erro ao acessar página:{RESET}")
        print(f"   {page_info['error'].get('message', 'Unknown error')}")
        return
    
    print(f"\n{GREEN}✅ Página encontrada:{RESET}")
    print(f"   Nome: {page_info.get('name', 'Unknown')}")
    print(f"   ID: {page_info.get('id', 'Unknown')}")
    print(f"   Seguidores: {page_info.get('followers_count', 0):,}")
    print(f"   Username: @{page_info.get('username', 'N/A')}")
    
    # Passo 2: Verificar permissões
    print_step("Verificando suas permissões...", 2)
    
    perms_data = await get_user_permissions_on_page(PAGE_ID)
    
    if 'error' in perms_data:
        print(f"\n{YELLOW}⚠️  Sem acesso direto à página:{RESET}")
        print(f"   {perms_data['error'].get('message', 'Unknown error')}")
        print(f"\n{BLUE}Isso é esperado - a página está sob controle do portfólio.{RESET}")
    else:
        permissions = perms_data.get('permissions', {}).get('data', [])
        print(f"\n{GREEN}✅ Suas permissões:{RESET}")
        for perm in permissions:
            status = "✅" if perm.get('status') == 'granted' else "❌"
            print(f"   {status} {perm.get('permission', 'Unknown')}: {perm.get('status', 'Unknown')}")
    
    # Passo 3: Verificar BM destino
    print_step("Verificando Business Manager de destino...", 3)
    
    bm_pages = await check_bm_pages(TARGET_BM_ID)
    
    if 'error' in bm_pages:
        print(f"\n{RED}❌ Erro ao acessar BM:{RESET}")
        print(f"   {bm_pages['error'].get('message', 'Unknown error')}")
        return
    
    pages = bm_pages.get('data', [])
    print(f"\n{GREEN}✅ BM possui {len(pages)} página(s){RESET}")
    
    # Verificar se página já está no BM
    page_in_bm = any(p['id'] == PAGE_ID for p in pages)
    
    if page_in_bm:
        print(f"\n{GREEN}✅ A página JÁ ESTÁ neste Business Manager!{RESET}")
        print(f"{BLUE}Não é necessário transferir.{RESET}")
        return
    else:
        print(f"\n{BLUE}ℹ️  A página NÃO está neste Business Manager.{RESET}")
        print(f"{BLUE}Prosseguindo com solicitação de acesso...{RESET}")
    
    # Passo 4: Tentar adicionar página ao BM
    print_step("Solicitando acesso à página...", 4)
    
    print(f"\n{YELLOW}Tentando Método 1: Adicionar página ao BM...{RESET}")
    result1 = await request_page_share(PAGE_ID, TARGET_BM_ID)
    
    if 'error' in result1:
        error_msg = result1['error'].get('message', 'Unknown error')
        print(f"\n{RED}❌ Método 1 falhou:{RESET}")
        print(f"   {error_msg}")
        
        # Analisar erro
        if 'ownership' in error_msg.lower():
            print(f"\n{YELLOW}⚠️  A página tem proprietário (portfólio órfão){RESET}")
            print(f"{YELLOW}Não é possível adicionar diretamente.{RESET}")
        elif 'request' in error_msg.lower() or 'request already exists' in error_msg.lower():
            print(f"\n{GREEN}✅ Já existe uma solicitação pendente!{RESET}")
            print(f"{BLUE}Verifique em: https://business.facebook.com/{TARGET_BM_ID}/settings/pages/{RESET}")
        elif 'permission' in error_msg.lower():
            print(f"\n{YELLOW}⚠️  Sem permissão para esta operação.{RESET}")
        else:
            print(f"\n{YELLOW}⚠️  Erro desconhecido - tentando Método 2...{RESET}")
            
            print(f"\n{YELLOW}Tentando Método 2: Acesso direto...{RESET}")
            result2 = await add_page_to_bm(PAGE_ID, TARGET_BM_ID)
            
            if 'error' in result2:
                print(f"\n{RED}❌ Método 2 também falhou:{RESET}")
                print(f"   {result2['error'].get('message', 'Unknown error')}")
            else:
                print(f"\n{GREEN}✅ Método 2 funcionou!{RESET}")
                print(f"{BLUE}Verifique em: https://business.facebook.com/{TARGET_BM_ID}/settings/pages/{RESET}")
    else:
        print(f"\n{GREEN}✅ Método 1 funcionou!{RESET}")
        print(f"{GREEN}✅ Solicitação de acesso enviada com sucesso!{RESET}")
        print(f"\n{BLUE}Próximos passos:{RESET}")
        print(f"   1. Acesse: https://business.facebook.com/{TARGET_BM_ID}/settings/pages")
        print(f"   2. Verifique solicitações pendentes")
        print(f"   3. Aceite a solicitação se necessário")
    
    # Passo 5: Resumo final
    print_section(f"📋 RESUMO FINAL")
    
    print(f"\n{BOLD}Tentativas Realizadas:{RESET}")
    print(f"   ✅ Método 1: Solicitar acesso via BM")
    print(f"   {'✅' if 'result2' in locals() and 'error' not in result2 else '❌'} Método 2: Acesso direto")
    
    print(f"\n{BOLD}Status:{RESET}")
    if 'result1' in locals() and 'error' not in result1:
        print(f"   {GREEN}✅ SOLICITAÇÃO ENVIADA COM SUCESSO!{RESET}")
    elif 'result2' in locals() and 'error' not in result2:
        print(f"   {GREEN}✅ ACESSO CONCEDIDO!{RESET}")
    else:
        print(f"   {YELLOW}⚠️  NÃO FOI POSSÍVEL TRANSFERIR DIRETAMENTE{RESET}")
        print(f"   {YELLOW}A página está presa ao portfólio órfão{RESET}")
    
    print(f"\n{BOLD}Próximos Passos:{RESET}")
    
    if 'result1' in locals() and 'error' not in result1 or ('result2' in locals() and 'error' not in result2):
        print(f"\n   {GREEN}1. Acesse o Business Manager:{RESET}")
        print(f"      https://business.facebook.com/{TARGET_BM_ID}/settings/pages")
        print(f"\n   {GREEN}2. Verifique solicitações pendentes{RESET}")
        print(f"\n   {GREEN}3. Aceite a solicitação se necessário{RESET}")
        print(f"\n   {BLUE}4. Aguarde aprovação (pode ser automática por ser órfão){RESET}")
    else:
        print(f"\n   {YELLOW}⚠️  Transferência direta não foi possível.{RESET}")
        print(f"\n   {BLUE}Ação Necessária:{RESET}")
        print(f"      1. Contatar Suporte Meta")
        print(f"      2. Explicar situação do portfólio órfão")
        print(f"      3. Pedir transferência manual")
        print(f"\n   {CYAN}Link para Suporte:{RESET}")
        print(f"      https://www.facebook.com/business/help/support")
    
    print(f"\n{CYAN}{'=' * 80}{RESET}")
    print(f"{BOLD}LINKS ÚTEIS:{RESET}")
    print(f"{'=' * 80}{RESET}")
    print(f"\n   📘 Business Manager:")
    print(f"      https://business.facebook.com/{TARGET_BM_ID}")
    print(f"\n   📄 Configurações de Páginas:")
    print(f"      https://business.facebook.com/{TARGET_BM_ID}/settings/pages")
    print(f"\n   📧 Suporte Meta:")
    print(f"      https://www.facebook.com/business/help/support")
    print(f"\n   🔗 Página:")
    print(f"      https://www.facebook.com/{PAGE_ID}")
    print(f"\n")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print(f"\n\n{YELLOW}⚠️  Operação cancelada pelo usuário.{RESET}")
    except Exception as e:
        print(f"\n{RED}❌ Erro: {e}{RESET}")
        print(f"{YELLOW}Verifique se o token está válido{RESET}")

#!/usr/bin/env python3
"""
Script para tentar recuperar/transferir página de portfólio órfão.

PÁGINA ALVO:
- ID: 111540438988959
- Propriedade: Eleição 2022 Elton Carlos Welter Deputado Estadual
- Portfólio ID: 387142802309764
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

# Cores
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
CYAN = "\033[96m"
RESET = "\033[0m"
BOLD = "\033[1m"


async def get_page_info(page_id):
    """Obtém informações da página."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        url = f"https://graph.facebook.com/v22.0/{page_id}?fields=id,name,link,category,followers_count,username&access_token={ACCESS_TOKEN}"
        resp = await client.get(url)
        return resp.json()


async def get_page_roles(page_id):
    """Obtém administradores da página."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        url = f"https://graph.facebook.com/v22.0/{page_id}/roles?fields=user,name,role,email&access_token={ACCESS_TOKEN}"
        resp = await client.get(url)
        return resp.json()


async def get_my_business_managers():
    """Obtém Business Managers que você tem acesso."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        url = f"https://graph.facebook.com/v22.0/me/businesses?access_token={ACCESS_TOKEN}&limit=100"
        resp = await client.get(url)
        data = resp.json()
        
        if 'error' in data:
            return []
        
        return data.get('data', [])


async def request_page_access(page_id, portfolio_id):
    """Tenta solicitar acesso à página órfã."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Tentar reivindicar a página
        url = f"https://graph.facebook.com/v22.0/{page_id}/assigned_users"
        params = {
            "user": "me",
            "role": "ADMIN",
            "access_token": ACCESS_TOKEN
        }
        resp = await client.post(url, params=params)
        return resp.json()


async def transfer_page_to_bm(page_id, target_bm_id):
    """Tenta transferir página para um BM."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        url = f"https://graph.facebook.com/v22.0/{page_id}"
        params = {
            "page_id": page_id,
            "new_owner": target_bm_id,
            "access_token": ACCESS_TOKEN
        }
        resp = await client.post(url, params=params)
        return resp.json()


def print_header():
    print("\n" + "=" * 80)
    print(f"{BOLD}{CYAN}RECUPERAR PÁGINA DE PORTFÓLIO ÓRFÃO{RESET}")
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
    
    # 1. Informações da página
    print_section(f"📘 PÁGINA: {PAGE_ID}")
    
    print(f"\n{BLUE}Verificando informações da página...{RESET}")
    page_info = await get_page_info(PAGE_ID)
    
    if 'error' in page_info:
        print(f"\n{RED}❌ Erro ao acessar página:{RESET}")
        print(f"   {page_info['error'].get('message', 'Unknown error')}")
        print(f"\n{YELLOW}Possíveis causas:{RESET}")
        print(f"   1. Página não existe mais")
        print(f"   2. Sem permissão para acessar")
        print(f"   3. Token inválido")
        return
    
    print(f"\n{GREEN}✅ Informações da Página:{RESET}")
    print(f"   {BOLD}Nome:{RESET} {page_info.get('name', 'Unknown')}")
    print(f"   {BOLD}ID:{RESET} {page_info.get('id', 'Unknown')}")
    print(f"   {BOLD}Categoria:{RESET} {page_info.get('category', 'Unknown')}")
    print(f"   {BOLD}Seguidores:{RESET} {page_info.get('followers_count', 0):,}")
    print(f"   {BOLD}Username:{RESET} @{page_info.get('username', 'N/A')}")
    print(f"   {BOLD}Link:{RESET} {page_info.get('link', 'N/A')}")
    
    # 2. Verificar administradores
    print_section(f"👑 ADMINISTRADORES DA PÁGINA")
    
    print(f"\n{BLUE}Verificando administradores...{RESET}")
    roles_data = await get_page_roles(PAGE_ID)
    
    if 'error' in roles_data:
        print(f"\n{RED}❌ Erro ao verificar administradores:{RESET}")
        print(f"   {roles_data['error'].get('message', 'Unknown error')}")
        print(f"\n{YELLOW}A página pode estar sob controle exclusivo do portfólio.{RESET}")
    else:
        admins = [r for r in roles_data.get('data', []) if r.get('role') == 'ADMINISTRATOR']
        
        if not admins:
            print(f"\n{RED}❌ NENHUM ADMINISTRADOR ENCONTRADO!{RESET}")
            print(f"\n{YELLOW}⚠️  A página está ÓRFÃ - sem administradores ativos.{RESET}")
            print(f"{YELLOW}Isso confirma que o portfólio de campanha 2022 está órfão.{RESET}")
        else:
            print(f"\n{GREEN}✅ {len(admins)} administrador(es) encontrado(s):{RESET}")
            for admin in admins:
                print(f"\n   {BOLD}👤 {admin.get('name', 'Unknown')}{RESET}")
                print(f"      Email: {admin.get('email', 'N/A')}")
                print(f"      Role: {admin.get('role', 'ADMINISTRATOR')}")
    
    # 3. Seus Business Managers
    print_section(f"🏢 SEUS BUSINESS MANAGERS")
    
    print(f"\n{BLUE}Verificando seus Business Managers...{RESET}")
    bms = await get_my_business_managers()
    
    if not bms:
        print(f"\n{YELLOW}⚠️  Você não tem acesso a nenhum Business Manager{RESET}")
        print(f"{YELLOW}Precisa de um BM ativo para receber a página.{RESET}")
    else:
        print(f"\n{GREEN}✅ {len(bms)} Business Manager(s) encontrado(s):{RESET}")
        for i, bm in enumerate(bms, 1):
            print(f"\n   {BOLD}🏢 BM #{i}: {bm.get('name', 'Unknown')}{RESET}")
            print(f"      ID: {bm['id']}")
            print(f"      Link: {bm.get('link', 'N/A')}")
    
    # 4. Tentar recuperar acesso
    print_section(f"🔧 TENTAR RECUPERAR ACESSO")
    
    print(f"\n{BLUE}Tentando solicitar acesso à página...{RESET}")
    access_result = await request_page_access(PAGE_ID, PORTFOLIO_ID)
    
    if 'error' in access_result:
        error_msg = access_result['error'].get('message', 'Unknown error')
        print(f"\n{RED}❌ Falha ao solicitar acesso:{RESET}")
        print(f"   {error_msg}")
        
        if 'ownership' in error_msg.lower() or 'owner' in error_msg.lower():
            print(f"\n{YELLOW}⚠️  A página tem dono (portfólio) e não pode ser reivindicada diretamente.{RESET}")
            print(f"{YELLOW}É necessário transferir a propriedade do portfólio.{RESET}")
        elif 'permission' in error_msg.lower():
            print(f"\n{YELLOW}⚠️  Sem permissão para esta operação.{RESET}")
            print(f"{YELLOW}Precisa de acesso de admin ao portfólio ou à página.{RESET}")
    else:
        print(f"\n{GREEN}✅ Acesso solicitado com sucesso!{RESET}")
        print(f"{BLUE}Verifique suas notificações ou email para confirmar.{RESET}")
    
    # 5. Resumo e recomendação
    print_section(f"📋 RESUMO E RECOMENDAÇÃO")
    
    print(f"\n{BOLD}Situação:{RESET}")
    print(f"   Página: {page_info.get('name', 'Unknown')} ({PAGE_ID})")
    print(f"   Propriedade: Eleição 2022 Elton Carlos Welter Deputado Estadual ({PORTFOLIO_ID})")
    print(f"   Status: {'✅ COM ACESSO' if not 'error' in access_result else '⚠️ SEM ACESSO DIRETO'}")
    
    print(f"\n{BOLD}Recomendação:{RESET}")
    
    if not admins:
        print(f"\n   {RED}⚠️  PÁGINA ÓRFÃ - SEM ADMINISTRADORES{RESET}")
        print(f"\n   {BLUE}Ação Necessária:{RESET}")
        print(f"      1. Contatar Suporte Meta (ÚNICA SOLUÇÃO)")
        print(f"      2. Explicar que o portfólio está órfão")
        print(f"      3. Pedir transferência para seu Business Manager")
        print(f"\n   {CYAN}Link para Suporte:{RESET}")
        print(f"      https://www.facebook.com/business/help/support")
    else:
        print(f"\n   {GREEN}✅ Existem administradores na página{RESET}")
        print(f"\n   {BLUE}Ação Recomendada:{RESET}")
        print(f"      1. Contate um dos administradores listados")
        print(f"      2. Peça para te adicionarem como admin")
        print(f"      3. OU peça para transferirem a página para seu BM")
    
    print(f"\n{CYAN}{'=' * 80}{RESET}")
    print(f"{BOLD}PRÓXIMOS PASSOS:{RESET}")
    print(f"{'=' * 80}{RESET}")
    
    print(f"\n{BOLD}Opção 1: 📧 Suporte Meta (Recomendado){RESET}")
    print(f"   1. Acesse: https://www.facebook.com/business/help/support")
    print(f"   2. Explique: Página presa em portfólio órfão de campanha 2022")
    print(f"   3. Forneça: Página ID {PAGE_ID}, Portfólio ID {PORTFOLIO_ID}")
    print(f"   4. Peça: Transferência para seu Business Manager")
    print(f"   5. Aguarde: 2-4 semanas")
    
    print(f"\n{BOLD}Opção 2: 👥 Contatar Admins Existentes{RESET}")
    if admins:
        print(f"   Admins encontrados: {len(admins)}")
        for admin in admins[:3]:
            email = admin.get('email', 'N/A')
            if email != 'N/A':
                print(f"   • {admin.get('name', 'Unknown')} - {email}")
    else:
        print(f"   ⚠️  Nenhum admin encontrado - use Opção 1")
    
    print(f"\n{BOLD}Opção 3: 🔄 Tentar Novamente Mais Tarde{RESET}")
    print(f"   Às vezes o Facebook libera acesso após verificação automática")
    print(f"   Tente novamente em 7-14 dias")
    
    print(f"\n")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print(f"\n\n{YELLOW}⚠️  Operação cancelada pelo usuário.{RESET}")
    except Exception as e:
        print(f"\n{RED}❌ Erro: {e}{RESET}")
        print(f"{YELLOW}Verifique se o token está válido{RESET}")

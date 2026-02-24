#!/usr/bin/env python3
"""
Script para identificar administradores e email vinculado ao portfólio de campanha 2022.

PORTFÓLIO ALVO:
- Nome: Eleição 2022 Elton Carlos Welter Deputado Estadual
- ID: 387142802309764

Este script mostra:
1. Quem são os administradores do portfólio
2. Quais emails têm acesso
3. Qual o Business Manager dono
4. Quem são os admins das páginas dentro do portfólio
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
MAGENTA = "\033[95m"
RESET = "\033[0m"
BOLD = "\033[1m"


async def get_portfolio_info(portfolio_id):
    """Obtém informações básicas do portfólio."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Business Manager info
        url = f"https://graph.facebook.com/v22.0/{portfolio_id}?fields=id,name,link&access_token={ACCESS_TOKEN}"
        resp = await client.get(url)
        return resp.json()


async def get_portfolio_admins(portfolio_id):
    """Obtém todos os administradores do portfólio (Business Manager)."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Usuários com acesso ao BM
        url = f"https://graph.facebook.com/v22.0/{portfolio_id}/users?access_token={ACCESS_TOKEN}&limit=100"
        resp = await client.get(url)
        data = resp.json()
        
        if 'error' in data:
            return []
        
        users = []
        for user in data.get('data', []):
            # Verificar se é admin
            is_admin = user.get('role') == 'ADMIN' or user.get('role') == 'ADMINISTRATOR'
            
            users.append({
                'id': user['id'],
                'name': user.get('name', 'Unknown'),
                'email': user.get('email', 'N/A'),
                'role': user.get('role', 'Unknown'),
                'is_admin': is_admin,
                'status': user.get('status', 'Unknown')
            })
        
        return users


async def get_portfolio_pages_with_admins(portfolio_id):
    """Obtém páginas do portfólio e seus administradores."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        url = f"https://graph.facebook.com/v22.0/{portfolio_id}/owned_pages?access_token={ACCESS_TOKEN}&limit=100"
        resp = await client.get(url)
        data = resp.json()
        
        if 'error' in data:
            return []
        
        pages_with_admins = []
        
        for page in data.get('data', []):
            page_id = page['id']
            page_name = page.get('name', 'Unknown')
            
            # Obter administradores desta página
            admins_url = f"https://graph.facebook.com/v22.0/{page_id}/roles?fields=user,name,role,email&access_token={ACCESS_TOKEN}"
            admins_resp = await client.get(admins_url)
            admins_data = admins_resp.json()
            
            admins = []
            if 'data' in admins_data:
                for role in admins_data['data']:
                    if role.get('role') == 'ADMINISTRATOR':
                        admins.append({
                            'user_id': role.get('user', {}).get('id', 'Unknown'),
                            'name': role.get('name', 'Unknown'),
                            'email': role.get('email', 'N/A'),
                            'role': role.get('role', 'ADMINISTRATOR')
                        })
            
            pages_with_admins.append({
                'id': page_id,
                'name': page_name,
                'admins': admins
            })
        
        return pages_with_admins


async def get_portfolio_ad_accounts_with_admins(portfolio_id):
    """Obtém contas de anúncios do portfólio e seus administradores."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        url = f"https://graph.facebook.com/v22.0/{portfolio_id}/adaccounts?access_token={ACCESS_TOKEN}&limit=100"
        resp = await client.get(url)
        data = resp.json()
        
        if 'error' in data:
            return []
        
        ad_accounts_with_admins = []
        
        for ad_account in data.get('data', []):
            account_id = ad_account['id']
            account_name = ad_account.get('name', 'Unknown')
            
            # Obter pessoas com acesso a esta conta de anúncios
            users_url = f"https://graph.facebook.com/v22.0/{account_id}/users?access_token={ACCESS_TOKEN}&limit=100"
            users_resp = await client.get(users_url)
            users_data = users_resp.json()
            
            users = []
            if 'data' in users_data:
                for user in users_data['data']:
                    users.append({
                        'user_id': user.get('user', {}).get('id', 'Unknown'),
                        'name': user.get('name', 'Unknown'),
                        'email': user.get('email', 'N/A'),
                        'role': user.get('role', 'Unknown'),
                        'permissions': user.get('permissions', [])
                    })
            
            ad_accounts_with_admins.append({
                'id': account_id,
                'name': account_name,
                'account_status': ad_account.get('account_status', 'Unknown'),
                'users': users
            })
        
        return ad_accounts_with_admins


async def get_current_user_info():
    """Obtém informações do usuário atual (quem está executando)."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        url = f"https://graph.facebook.com/v22.0/me?fields=id,name,email&access_token={ACCESS_TOKEN}"
        resp = await client.get(url)
        return resp.json()


def print_header():
    print("\n" + "=" * 80)
    print(f"{BOLD}{MAGENTA}IDENTIFICAÇÃO DE ADMINISTRADORES - PORTFÓLIO 2022{RESET}")
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


def print_user(user, is_current=False):
    """Imprime informações de um usuário."""
    current_marker = " 👤 (VOCÊ)" if is_current else ""
    admin_marker = " 👑 ADMIN" if user.get('is_admin') or user.get('role') == 'ADMINISTRATOR' else ""
    
    print(f"\n   {BOLD}{user.get('name', 'Unknown')}{current_marker}{admin_marker}{RESET}")
    print(f"      ID: {user.get('id', 'Unknown')}")
    print(f"      Email: {user.get('email', 'N/A')}")
    print(f"      Role: {user.get('role', 'Unknown')}")
    if user.get('status'):
        print(f"      Status: {user.get('status')}")


async def main():
    print_header()
    
    PORTFOLIO_ID = "387142802309764"
    PORTFOLIO_NAME = "Eleição 2022 Elton Carlos Welter Deputado Estadual"
    
    # 1. Informações do usuário atual
    print(f"\n{BLUE}👤 Verificando usuário atual...{RESET}")
    current_user = await get_current_user_info()
    
    if 'error' in current_user:
        print(f"\n{YELLOW}⚠️  Não foi possível identificar usuário atual{RESET}")
        print(f"   Erro: {current_user['error'].get('message', 'Unknown')}")
        current_user_id = None
    else:
        print(f"\n{GREEN}✅ Usuário atual:{RESET}")
        print(f"   Nome: {current_user.get('name', 'Unknown')}")
        print(f"   Email: {current_user.get('email', 'N/A')}")
        print(f"   ID: {current_user.get('id', 'Unknown')}")
        current_user_id = current_user.get('id')
    
    # 2. Informações do portfólio
    print_section(f"📊 PORTFÓLIO: {PORTFOLIO_NAME}")
    
    print(f"\n{BLUE}Verificando informações do portfólio...{RESET}")
    portfolio_info = await get_portfolio_info(PORTFOLIO_ID)
    
    if 'error' in portfolio_info:
        print(f"\n{RED}❌ Erro ao acessar portfólio:{RESET}")
        print(f"   {portfolio_info['error'].get('message', 'Unknown error')}")
        print(f"\n{YELLOW}Possíveis causas:{RESET}")
        print(f"   1. Você não tem mais acesso a este portfólio")
        print(f"   2. O portfólio foi desativado")
        print(f"   3. Token sem permissão business_management")
        return
    
    print(f"\n{GREEN}✅ Informações do Portfólio:{RESET}")
    print(f"   {BOLD}Nome:{RESET} {portfolio_info.get('name', 'Unknown')}")
    print(f"   {BOLD}ID:{RESET} {portfolio_info.get('id', 'Unknown')}")
    print(f"   {BOLD}Link:{RESET} {portfolio_info.get('link', 'N/A')}")
    
    # 3. Administradores do Portfólio (Business Manager)
    print_section(f"👑 ADMINISTRADORES DO PORTFÓLIO")
    
    print(f"\n{BLUE}Buscando administradores do Business Manager...{RESET}")
    portfolio_admins = await get_portfolio_admins(PORTFOLIO_ID)
    
    if not portfolio_admins:
        print(f"\n{YELLOW}⚠️  Nenhum administrador encontrado{RESET}")
        print(f"   Ou você não tem permissão para ver os admins")
        print(f"   Ou não há usuários com acesso explícito")
    else:
        # Separar admins de não-admins
        admins = [u for u in portfolio_admins if u.get('is_admin') or u.get('role') == 'ADMINISTRATOR']
        other_users = [u for u in portfolio_admins if not (u.get('is_admin') or u.get('role') == 'ADMINISTRATOR')]
        
        print(f"\n{GREEN}✅ {len(portfolio_admins)} usuário(s) com acesso ao portfólio:{RESET}")
        
        if admins:
            print(f"\n   {BOLD}{RED}👑 ADMINISTRADORES ({len(admins)}):{RESET}")
            for admin in admins:
                is_current = admin['id'] == current_user_id
                print_user(admin, is_current)
        
        if other_users:
            print(f"\n   {BOLD}{BLUE}👥 OUTROS USUÁRIOS ({len(other_users)}):{RESET}")
            for user in other_users:
                is_current = user['id'] == current_user_id
                print_user(user, is_current)
    
    # 4. Páginas e seus administradores
    print_section(f"📘 PÁGINAS DO PORTFÓLIO E SEUS ADMINS")
    
    print(f"\n{BLUE}Verificando páginas vinculadas...{RESET}")
    pages_with_admins = await get_portfolio_pages_with_admins(PORTFOLIO_ID)
    
    if not pages_with_admins:
        print(f"\n{YELLOW}⚠️  Nenhuma página encontrada neste portfólio{RESET}")
    else:
        print(f"\n{GREEN}✅ {len(pages_with_admins)} página(s) encontrada(s):{RESET}")
        
        for page in pages_with_admins:
            print(f"\n   {BOLD}📘 {page['name']}{RESET}")
            print(f"      ID: {page['id']}")
            
            if page['admins']:
                print(f"      {BOLD}Administradores ({len(page['admins'])}):{RESET}")
                for admin in page['admins'][:10]:
                    is_current = admin['user_id'] == current_user_id
                    current_marker = " 👤 (VOCÊ)" if is_current else ""
                    print(f"         • {admin['name']}{current_marker}")
                    print(f"           Email: {admin['email']}")
                    print(f"           ID: {admin['user_id']}")
                if len(page['admins']) > 10:
                    print(f"           ... e mais {len(page['admins']) - 10} administradores")
            else:
                print(f"      {YELLOW}⚠️  Nenhum administrador encontrado{RESET}")
    
    # 5. Contas de anúncios e usuários
    print_section(f"📊 CONTAS DE ANÚNCIOS E USUÁRIOS")
    
    print(f"\n{BLUE}Verificando contas de anúncios...{RESET}")
    ad_accounts_with_users = await get_portfolio_ad_accounts_with_admins(PORTFOLIO_ID)
    
    if not ad_accounts_with_users:
        print(f"\n{YELLOW}⚠️  Nenhuma conta de anúncios encontrada{RESET}")
    else:
        print(f"\n{GREEN}✅ {len(ad_accounts_with_users)} conta(s) de anúncios:{RESET}")
        
        for account in ad_accounts_with_users:
            status_icon = "✅" if account['account_status'] == 1 else "⚠️"
            print(f"\n   {status_icon} {BOLD}{account['name']}{RESET}")
            print(f"      ID: {account['id']}")
            print(f"      Status: {account['account_status']}")
            
            if account['users']:
                print(f"      {BOLD}Usuários com acesso ({len(account['users'])}):{RESET}")
                for user in account['users'][:10]:
                    is_current = user['user_id'] == current_user_id
                    current_marker = " 👤 (VOCÊ)" if is_current else ""
                    print(f"         • {user['name']}{current_marker}")
                    print(f"           Email: {user['email']}")
                    print(f"           Role: {user['role']}")
                if len(account['users']) > 10:
                    print(f"           ... e mais {len(account['users']) - 10} usuários")
    
    # 6. Resumo e recomendação
    print_section(f"📋 RESUMO E RECOMENDAÇÃO")
    
    print(f"\n{BOLD}Portfólio:{RESET} {PORTFOLIO_NAME}")
    print(f"{BOLD}ID:{RESET} {PORTFOLIO_ID}")
    
    # Contar admins totais
    total_admins = len([u for u in portfolio_admins if u.get('is_admin') or u.get('role') == 'ADMINISTRATOR']) if portfolio_admins else 0
    
    print(f"\n{BOLD}Resumo de Acessos:{RESET}")
    print(f"   👑 Administradores do BM: {total_admins}")
    print(f"   📘 Páginas vinculadas: {len(pages_with_admins)}")
    print(f"   📊 Contas de anúncios: {len(ad_accounts_with_users)}")
    
    # Verificar se usuário atual é admin
    is_current_admin = False
    if portfolio_admins:
        for admin in portfolio_admins:
            if admin['id'] == current_user_id and (admin.get('is_admin') or admin.get('role') == 'ADMINISTRATOR'):
                is_current_admin = True
                break
    
    print(f"\n{BOLD}Seu Acesso:{RESET}")
    if is_current_admin:
        print(f"   {GREEN}✅ VOCÊ É ADMINISTRADOR DO PORTFÓLIO{RESET}")
        print(f"   {GREEN}Pode remover o portfólio se desejar{RESET}")
    else:
        print(f"   {YELLOW}⚠️  VOCÊ NÃO É ADMINISTRADOR DO PORTFÓLIO{RESET}")
        print(f"   {YELLOW}Não pode remover o portfólio diretamente{RESET}")
        print(f"   {YELLOW}Precisa pedir para um admin remover{RESET}")
    
    # Mostrar emails dos admins
    admin_emails = []
    if portfolio_admins:
        admin_emails = [u['email'] for u in portfolio_admins if u.get('is_admin') or u.get('role') == 'ADMINISTRATOR']
        
        if admin_emails:
            print(f"\n{BOLD}📧 Emails dos Administradores:{RESET}")
            for email in admin_emails:
                if email != 'N/A':
                    print(f"   • {email}")
    
    print(f"\n{CYAN}{'=' * 80}{RESET}")
    print(f"{BOLD}PRÓXIMOS PASSOS:{RESET}")
    print(f"{'=' * 80}{RESET}")
    
    if is_current_admin:
        print(f"\n{GREEN}✅ VOCÊ TEM CONTROLE DO PORTFÓLIO{RESET}")
        print(f"\n{BLUE}Opções:{RESET}")
        print(f"   1. Remover o portfólio (se não precisa mais)")
        print(f"   2. Transferir páginas para outro BM antes de remover")
        print(f"   3. Manter o portfólio arquivado")
        print(f"\n{GREEN}Para remover:{RESET}")
        print(f"   python3 remove_business_portfolio.py")
    else:
        print(f"\n{YELLOW}⚠️  VOCÊ NÃO TEM CONTROLE DO PORTFÓLIO{RESET}")
        print(f"\n{BLUE}O que fazer:{RESET}")
        print(f"   1. Contate um dos administradores listados acima")
        print(f"   2. Peça para removerem você do portfólio")
        print(f"   3. OU peça para transferirem as páginas que precisa")
        print(f"   4. OU peça para removerem o portfólio inteiro")
        
        if admin_emails:
            print(f"\n{MAGENTA}📧 Contatos dos Administradores:{RESET}")
            for email in set(admin_emails):
                if email != 'N/A':
                    print(f"   • {email}")
    
    print(f"\n")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print(f"\n\n{YELLOW}⚠️  Verificação cancelada pelo usuário.{RESET}")
    except Exception as e:
        print(f"\n{RED}❌ Erro: {e}{RESET}")
        print(f"{YELLOW}Verifique se o token está válido e tem permissão business_management{RESET}")

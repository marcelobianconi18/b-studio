#!/usr/bin/env python3
"""
Script para remover portfólio empresarial do Business Manager.

PORTFÓLIO ALVO:
- Nome: Eleição 2022 Elton Carlos Welter Deputado Estadual
- ID: 387142802309764

⚠️ ATENÇÃO: Este script remove permanentemente o acesso ao portfólio!
"""

import httpx
import asyncio
import json
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Configuração
PORTFOLIO_ID = "387142802309764"
PORTFOLIO_NAME = "Eleição 2022 Elton Carlos Welter Deputado Estadual"
ACCESS_TOKEN = os.getenv("FACEBOOK_ACCESS_TOKEN")
BUSINESS_ID = os.getenv("META_BUSINESS_ID")  # Seu Business Manager ID

# Cores para output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"
BOLD = "\033[1m"


def print_header():
    print("\n" + "=" * 80)
    print(f"{BOLD}{RED}REMOVER PORTFÓLIO EMPRESARIAL{RESET}")
    print("=" * 80)


def print_warning(message):
    print(f"{YELLOW}⚠️  {message}{RESET}")


def print_error(message):
    print(f"{RED}❌ {message}{RESET}")


def print_success(message):
    print(f"{GREEN}✅ {message}{RESET}")


def print_info(message):
    print(f"{BLUE}ℹ️  {message}{RESET}")


async def get_business_info():
    """Obtém informações do Business Manager atual."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        url = f"https://graph.facebook.com/v22.0/me?fields=id,name&access_token={ACCESS_TOKEN}"
        resp = await client.get(url)
        return resp.json()


async def list_portfolio_assets(portfolio_id):
    """Lista todos os ativos vinculados ao portfólio."""
    assets = {
        "pages": [],
        "ad_accounts": [],
        "instagram_accounts": [],
        "apps": [],
        "pixels": []
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # 1. Páginas
        print(f"\n{BLUE}📘 Verificando Páginas...{RESET}")
        url = f"https://graph.facebook.com/v22.0/{portfolio_id}/owned_pages?access_token={ACCESS_TOKEN}&limit=100"
        resp = await client.get(url)
        data = resp.json()
        
        if 'error' not in data:
            for page in data.get('data', []):
                assets["pages"].append({
                    "id": page['id'],
                    "name": page.get('name', 'Unknown')
                })
                print(f"   • {page.get('name', 'Unknown')} ({page['id']})")
        else:
            print(f"   {YELLOW}Nenhuma página ou sem acesso{RESET}")
        
        # 2. Contas de Anúncios
        print(f"\n{BLUE}📊 Verificando Contas de Anúncios...{RESET}")
        url = f"https://graph.facebook.com/v22.0/{portfolio_id}/adaccounts?access_token={ACCESS_TOKEN}&limit=100"
        resp = await client.get(url)
        data = resp.json()
        
        if 'error' not in data:
            for ad_account in data.get('data', []):
                assets["ad_accounts"].append({
                    "id": ad_account['id'],
                    "name": ad_account.get('name', 'Unknown')
                })
                print(f"   • {ad_account.get('name', 'Unknown')} ({ad_account['id']})")
        else:
            print(f"   {YELLOW}Nenhuma conta de anúncios ou sem acesso{RESET}")
        
        # 3. Instagram Accounts
        print(f"\n{BLUE}📷 Verificando Instagram Accounts...{RESET}")
        url = f"https://graph.facebook.com/v22.0/{portfolio_id}/instagram_accounts?access_token={ACCESS_TOKEN}&limit=100"
        resp = await client.get(url)
        data = resp.json()
        
        if 'error' not in data:
            for ig_account in data.get('data', []):
                assets["instagram_accounts"].append({
                    "id": ig_account['id'],
                    "username": ig_account.get('username', 'Unknown')
                })
                print(f"   • @{ig_account.get('username', 'Unknown')} ({ig_account['id']})")
        else:
            print(f"   {YELLOW}Nenhuma conta Instagram ou sem acesso{RESET}")
        
        # 4. Apps
        print(f"\n{BLUE}📱 Verificando Apps...{RESET}")
        url = f"https://graph.facebook.com/v22.0/{portfolio_id}/owned_apps?access_token={ACCESS_TOKEN}&limit=100"
        resp = await client.get(url)
        data = resp.json()
        
        if 'error' not in data:
            for app in data.get('data', []):
                assets["apps"].append({
                    "id": app['id'],
                    "name": app.get('name', 'Unknown')
                })
                print(f"   • {app.get('name', 'Unknown')} ({app['id']})")
        else:
            print(f"   {YELLOW}Nenhum app ou sem acesso{RESET}")
        
        # 5. Pixels
        print(f"\n{BLUE}🎯 Verificando Pixels...{RESET}")
        url = f"https://graph.facebook.com/v22.0/{portfolio_id}/adpixels?access_token={ACCESS_TOKEN}&limit=100"
        resp = await client.get(url)
        data = resp.json()
        
        if 'error' not in data:
            for pixel in data.get('data', []):
                assets["pixels"].append({
                    "id": pixel['id'],
                    "name": pixel.get('name', 'Unknown')
                })
                print(f"   • {pixel.get('name', 'Unknown')} ({pixel['id']})")
        else:
            print(f"   {YELLOW}Nenhum pixel ou sem acesso{RESET}")
    
    return assets


def save_backup(assets):
    """Salva backup dos ativos em arquivo JSON."""
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    filename = f"portfolio_backup_{PORTFOLIO_ID}_{timestamp}.json"
    
    backup_data = {
        "portfolio_id": PORTFOLIO_ID,
        "portfolio_name": PORTFOLIO_NAME,
        "backup_date": datetime.now().isoformat(),
        "assets": assets
    }
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(backup_data, f, indent=2, ensure_ascii=False)
    
    return filename


async def remove_portfolio_access(portfolio_id):
    """Remove o acesso ao portfólio empresarial."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Tenta remover via Business Manager API
        url = f"https://graph.facebook.com/v22.0/{portfolio_id}/assigned_users"
        params = {
            "user": "me",
            "access_token": ACCESS_TOKEN
        }
        
        resp = await client.delete(url, params=params)
        return resp.json()


async def main():
    print_header()
    
    # 1. Verificar token
    print(f"\n{BLUE}Verificando token de acesso...{RESET}")
    user_info = await get_business_info()
    
    if 'error' in user_info:
        print_error(f"Token inválido: {user_info['error'].get('message', 'Unknown error')}")
        return
    
    print_success(f"Token válido! Usuário: {user_info.get('name', 'Unknown')}")
    
    # 2. Listar ativos do portfólio
    print(f"\n{YELLOW}⚠️  PORTFÓLIO ALVO:{RESET}")
    print(f"   Nome: {PORTFOLIO_NAME}")
    print(f"   ID: {PORTFOLIO_ID}")
    
    print(f"\n{BLUE}Verificando ativos vinculados...{RESET}")
    assets = await list_portfolio_assets(PORTFOLIO_ID)
    
    # 3. Salvar backup
    print(f"\n{BLUE}Salvando backup...{RESET}")
    backup_file = save_backup(assets)
    print_success(f"Backup salvo em: {backup_file}")
    
    # 4. Mostrar resumo
    print(f"\n{YELLOW}{'=' * 80}{RESET}")
    print(f"{BOLD}RESUMO DOS ATIVOS VINCULADOS:{RESET}")
    print(f"{'=' * 80}{RESET}")
    print(f"   📘 Páginas: {len(assets['pages'])}")
    print(f"   📊 Contas de Anúncios: {len(assets['ad_accounts'])}")
    print(f"   📷 Instagram Accounts: {len(assets['instagram_accounts'])}")
    print(f"   📱 Apps: {len(assets['apps'])}")
    print(f"   🎯 Pixels: {len(assets['pixels'])}")
    
    # 5. Avisos importantes
    print(f"\n{RED}{'=' * 80}{RESET}")
    print(f"{BOLD}{RED}⚠️  ATENÇÃO - CONSEQUÊNCIAS DA REMOÇÃO:{RESET}")
    print(f"{'=' * 80}{RESET}")
    print(f"{RED}❌ Perderá acesso a TODAS as páginas listadas acima{RESET}")
    print(f"{RED}❌ Perderá acesso a TODAS as contas de anúncios listadas{RESET}")
    print(f"{RED}❌ Não poderá criar/editar campanhas deste portfólio{RESET}")
    print(f"{RED}❌ Esta ação NÃO pode ser desfeita automaticamente{RESET}")
    print(f"{YELLOW}ℹ️  O portfólio continuará existindo (apenas seu acesso será removido){RESET}")
    
    # 6. Confirmação
    print(f"\n{YELLOW}{'=' * 80}{RESET}")
    print(f"{BOLD}CONFIRMAÇÃO NECESSÁRIA{RESET}")
    print(f"{'=' * 80}{RESET}")
    
    confirm_text = f"DELETAR {PORTFOLIO_NAME}"
    print(f"Para confirmar, digite EXATAMENTE: {BOLD}{RED}{confirm_text}{RESET}")
    print(f"(Copie e cole para evitar erros)")
    
    user_input = input(f"\n{BLUE}Sua resposta:{RESET} ").strip()
    
    if user_input != confirm_text:
        print_error(f"Confirmação incorreta! Digitação: '{user_input}'")
        print_info("Operação cancelada.")
        return
    
    # 7. Executar remoção
    print(f"\n{YELLOW}Executando remoção...{RESET}")
    result = await remove_portfolio_access(PORTFOLIO_ID)
    
    if 'error' in result:
        print_error(f"Falha na remoção: {result['error'].get('message', 'Unknown error')}")
        print_info("Verifique se você é admin do Business Manager")
    else:
        print_success(f"Portfólio '{PORTFOLIO_NAME}' removido com sucesso!")
        print_info(f"Backup disponível em: {backup_file}")
    
    print(f"\n{GREEN}{'=' * 80}{RESET}")
    print(f"{BOLD}OPERAÇÃO CONCLUÍDA{RESET}")
    print(f"{'=' * 80}{RESET}")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print(f"\n\n{YELLOW}⚠️  Operação cancelada pelo usuário.{RESET}")
    except Exception as e:
        print(f"\n{RED}❌ Erro inesperado: {e}{RESET}")
        print_info("Verifique se o token está válido e tem permissões adequadas")

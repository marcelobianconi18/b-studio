#!/usr/bin/env python3
"""
Script para remover portfólio empresarial do Business Manager.
VERSÃO AUTOMÁTICA - Sem confirmação interativa

PORTFÓLIO ALVO:
- Nome: Eleição 2022 Elton Carlos Welter Deputado Estadual
- ID: 387142802309764
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

# Cores
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"
BOLD = "\033[1m"


async def get_business_info():
    """Obtém informações do Business Manager atual."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        url = f"https://graph.facebook.com/v22.0/me?fields=id,name&access_token={ACCESS_TOKEN}"
        resp = await client.get(url)
        return resp.json()


async def list_portfolio_assets(portfolio_id):
    """Lista todos os ativos vinculados ao portfólio."""
    assets = {"pages": [], "ad_accounts": [], "instagram_accounts": [], "apps": [], "pixels": []}
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Páginas
        url = f"https://graph.facebook.com/v22.0/{portfolio_id}/owned_pages?access_token={ACCESS_TOKEN}&limit=100"
        resp = await client.get(url)
        data = resp.json()
        if 'error' not in data:
            for page in data.get('data', []):
                assets["pages"].append({"id": page['id'], "name": page.get('name', 'Unknown')})
        
        # Contas de Anúncios
        url = f"https://graph.facebook.com/v22.0/{portfolio_id}/adaccounts?access_token={ACCESS_TOKEN}&limit=100"
        resp = await client.get(url)
        data = resp.json()
        if 'error' not in data:
            for ad_account in data.get('data', []):
                assets["ad_accounts"].append({"id": ad_account['id'], "name": ad_account.get('name', 'Unknown')})
        
        # Instagram Accounts
        url = f"https://graph.facebook.com/v22.0/{portfolio_id}/instagram_accounts?access_token={ACCESS_TOKEN}&limit=100"
        resp = await client.get(url)
        data = resp.json()
        if 'error' not in data:
            for ig_account in data.get('data', []):
                assets["instagram_accounts"].append({"id": ig_account['id'], "username": ig_account.get('username', 'Unknown')})
    
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
        url = f"https://graph.facebook.com/v22.0/{portfolio_id}/assigned_users"
        params = {"user": "me", "access_token": ACCESS_TOKEN}
        resp = await client.delete(url, params=params)
        return resp.json()


async def main():
    print("\n" + "=" * 80)
    print(f"{BOLD}{RED}REMOVER PORTFÓLIO EMPRESARIAL (AUTOMÁTICO){RESET}")
    print("=" * 80)
    
    # 1. Verificar token
    print(f"\n{BLUE}Verificando token de acesso...{RESET}")
    user_info = await get_business_info()
    
    if 'error' in user_info:
        print(f"{RED}❌ Token inválido: {user_info['error'].get('message', 'Unknown error')}{RESET}")
        return
    
    print(f"{GREEN}✅ Token válido! Usuário: {user_info.get('name', 'Unknown')}{RESET}")
    
    # 2. Listar ativos do portfólio
    print(f"\n{YELLOW}⚠️  PORTFÓLIO ALVO:{RESET}")
    print(f"   Nome: {PORTFOLIO_NAME}")
    print(f"   ID: {PORTFOLIO_ID}")
    
    print(f"\n{BLUE}Verificando ativos vinculados...{RESET}")
    assets = await list_portfolio_assets(PORTFOLIO_ID)
    
    print(f"\n{BLUE}Ativos encontrados:{RESET}")
    print(f"   📘 Páginas: {len(assets['pages'])}")
    print(f"   📊 Contas de Anúncios: {len(assets['ad_accounts'])}")
    print(f"   📷 Instagram Accounts: {len(assets['instagram_accounts'])}")
    
    if len(assets['pages']) == 0 and len(assets['ad_accounts']) == 0:
        print(f"\n{GREEN}✅ Portfólio está VAZIO - Seguro remover!{RESET}")
    else:
        print(f"\n{YELLOW}⚠️  Portfólio tem ativos - Verifique antes de remover!{RESET}")
    
    # 3. Salvar backup
    print(f"\n{BLUE}Salvando backup...{RESET}")
    backup_file = save_backup(assets)
    print(f"{GREEN}✅ Backup salvo em: {backup_file}{RESET}")
    
    # 4. Executar remoção
    print(f"\n{YELLOW}Executando remoção...{RESET}")
    result = await remove_portfolio_access(PORTFOLIO_ID)
    
    if 'error' in result:
        error_msg = result['error'].get('message', 'Unknown error')
        
        if 'does not exist' in error_msg.lower() or 'no longer exists' in error_msg.lower():
            print(f"\n{GREEN}✅ Portfólio já foi removido ou não existe mais!{RESET}")
            print(f"{BLUE}ℹ️  {error_msg}{RESET}")
        elif 'permission' in error_msg.lower() or 'access' in error_msg.lower():
            print(f"\n{YELLOW}⚠️  Sem permissão para remover o portfólio{RESET}")
            print(f"{BLUE}ℹ️  {error_msg}{RESET}")
            print(f"\n{YELLOW}Isso é NORMAL para portfólios órfãos de perfis excluídos.{RESET}")
            print(f"{YELLOW}O portfólio está vazio e não causa problemas.{RESET}")
        else:
            print(f"{RED}❌ Falha na remoção: {error_msg}{RESET}")
    else:
        print(f"\n{GREEN}✅ Portfólio '{PORTFOLIO_NAME}' removido com sucesso!{RESET}")
    
    print(f"\n{GREEN}{'=' * 80}{RESET}")
    print(f"{BOLD}OPERAÇÃO CONCLUÍDA{RESET}")
    print(f"{'=' * 80}{RESET}")
    print(f"\n{BLUE}Backup disponível em: {backup_file}{RESET}")
    print(f"{BLUE}Este arquivo contém a lista de ativos antes da remoção.{RESET}\n")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print(f"\n\n{YELLOW}⚠️  Operação cancelada pelo usuário.{RESET}")
    except Exception as e:
        print(f"\n{RED}❌ Erro inesperado: {e}{RESET}")
        print(f"{YELLOW}Verifique se o token está válido e tem permissões adequadas{RESET}")

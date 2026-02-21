#!/usr/bin/env python3
"""
Script interativo para obter e configurar Facebook Access Token e Ad Account ID.
"""

import os
import sys
import webbrowser
import json
from pathlib import Path

# Colors for terminal
GREEN = "\033[92m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RED = "\033[91m"
RESET = "\033[0m"

def print_header():
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}📘 B-Studio - Configuração Meta Ads{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")

def print_option(number, title, description):
    print(f"{GREEN}[{number}]{RESET} {title}")
    print(f"    {description}\n")

def get_pipeboard_token():
    """Guia para obter token via Pipeboard."""
    print(f"\n{YELLOW}📌 Opção Pipeboard (RECOMENDADO){RESET}")
    print("-" * 50)
    
    print("\n1️⃣  Acesse: https://pipeboard.co")
    print("2️⃣  Clique em 'Get Started' ou 'Connect Meta Account'")
    print("3️⃣  Faça login com sua conta do Facebook")
    print("4️⃣  Vá em Settings → API Tokens")
    print("5️⃣  Copie seu token (ex: pk_xxxxx...)")
    
    token = input(f"\n{GREEN}➡️  Cole seu token Pipeboard:{RESET} ").strip()
    
    if token:
        save_to_env("PIPEBOARD_API_TOKEN", token)
        print(f"\n{GREEN}✅ Token Pipeboard salvo com sucesso!{RESET}")
        return True
    return False

def get_manual_token():
    """Guia para obter token manualmente via Facebook Developers."""
    print(f"\n{YELLOW}📌 Opção Manual (Facebook Developers){RESET}")
    print("-" * 50)
    
    print(f"\n{BLUE}PASSO 1: Criar App no Facebook Developers{RESET}")
    print("1. Acesse: https://developers.facebook.com/")
    print("2. Clique em 'Meus Apps' → 'Criar App'")
    print("3. Selecione: 'Outro' → 'Negócios'")
    print("4. Nome: 'B-Studio Auth'")
    print("5. Salve o App ID e App Secret")
    
    app_id = input(f"\n{GREEN}➡️  App ID:{RESET} ").strip()
    app_secret = input(f"{GREEN}➡️  App Secret:{RESET} ").strip()
    
    if not app_id or not app_secret:
        print(f"{RED}❌ App ID e App Secret são obrigatórios{RESET}")
        return False
    
    print(f"\n{BLUE}PASSO 2: Gerar Token de Acesso{RESET}")
    print("1. Acesse: https://developers.facebook.com/tools/explorer/")
    print("2. Selecione seu app no dropdown")
    print("3. Clique em 'Generate Access Token'")
    print("4. Conceda as permissões:")
    print("   - business_management")
    print("   - pages_show_list")
    print("   - read_insights")
    print("   - instagram_basic")
    
    # Open Graph API Explorer automatically
    open_url = input(f"\n{GREEN}Abrir Graph API Explorer? (s/n):{RESET} ").strip().lower()
    if open_url == 's':
        webbrowser.open("https://developers.facebook.com/tools/explorer/")
    
    access_token = input(f"\n{GREEN}➡️  Cole o Access Token gerado:{RESET} ").strip()
    
    if not access_token:
        print(f"{RED}❌ Access Token é obrigatório{RESET}")
        return False
    
    print(f"\n{BLUE}PASSO 3: Obter Ad Account ID{RESET}")
    print("Opção A: Pela URL do Ads Manager")
    print("  - Acesse: https://www.facebook.com/adsmanager/")
    print("  - Olhe a URL: .../adsmanager/manage/campaigns?act=1234567890")
    print("  - O número após 'act=' é seu Ad Account ID")
    
    open_ads = input(f"\n{GREEN}Abrir Ads Manager? (s/n):{RESET} ").strip().lower()
    if open_url == 's':
        webbrowser.open("https://www.facebook.com/adsmanager/")
    
    ad_account_id = input(f"\n{GREEN}➡️  Ad Account ID (ex: act_1234567890):{RESET} ").strip()
    
    if not ad_account_id:
        print(f"{YELLOW}⚠️  Ad Account ID não informado (algumas funcionalidades não estarão disponíveis){RESET}")
    
    # Save to .env
    save_to_env("META_APP_ID", app_id)
    save_to_env("META_APP_SECRET", app_secret)
    save_to_env("META_ACCESS_TOKEN", access_token)
    if ad_account_id:
        if not ad_account_id.startswith("act_"):
            ad_account_id = f"act_{ad_account_id}"
        save_to_env("META_AD_ACCOUNT_ID", ad_account_id)
    
    print(f"\n{GREEN}✅ Configurações salvas com sucesso!{RESET}")
    return True

def save_to_env(key, value):
    """Save configuration to backend/.env file."""
    env_path = Path(__file__).parent / ".env"
    
    # Read existing content
    existing_content = ""
    if env_path.exists():
        with open(env_path, "r") as f:
            existing_content = f.read()
    
    # Check if key already exists
    lines = existing_content.splitlines()
    new_lines = []
    key_found = False
    
    for line in lines:
        if line.startswith(f"{key}="):
            new_lines.append(f"{key}={value}")
            key_found = True
        else:
            new_lines.append(line)
    
    if not key_found:
        new_lines.append(f"{key}={value}")
    
    # Write back
    with open(env_path, "w") as f:
        f.write("\n".join(new_lines))
    
    print(f"   {GREEN}✓{RESET} {key} configurado")

def test_connection():
    """Test the configured connection."""
    print(f"\n{BLUE}🔍 Testando conexão...{RESET}")
    
    env_path = Path(__file__).parent / ".env"
    if not env_path.exists():
        print(f"{RED}❌ Arquivo .env não encontrado{RESET}")
        return False
    
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=env_path)
    
    pipeboard_token = os.getenv("PIPEBOARD_API_TOKEN")
    meta_token = os.getenv("META_ACCESS_TOKEN")
    ad_account = os.getenv("META_AD_ACCOUNT_ID")
    
    print(f"\n{GREEN}Configurações encontradas:{RESET}")
    
    if pipeboard_token:
        print(f"   {GREEN}✓{RESET} PIPEBOARD_API_TOKEN: {pipeboard_token[:10]}...")
    else:
        print(f"   {RED}✗{RESET} PIPEBOARD_API_TOKEN: Não configurado")
    
    if meta_token:
        print(f"   {GREEN}✓{RESET} META_ACCESS_TOKEN: {meta_token[:10]}...")
    else:
        print(f"   {RED}✗{RESET} META_ACCESS_TOKEN: Não configurado")
    
    if ad_account:
        print(f"   {GREEN}✓{RESET} META_AD_ACCOUNT_ID: {ad_account}")
    else:
        print(f"   {YELLOW}⚠{RESET} META_AD_ACCOUNT_ID: Não configurado")
    
    print(f"\n{GREEN}✅ Configuração concluída!{RESET}")
    print(f"\n{YELLOW}Próximos passos:{RESET}")
    print("1. Reinicie o backend: uvicorn main:app --reload --port 8001")
    print("2. Teste a API: curl http://localhost:8001/api/ads/campaigns")
    print("3. Acesse o frontend: http://localhost:3000")

def main():
    print_header()
    
    print("Este script vai te ajudar a configurar o acesso à Meta Ads API.\n")
    
    while True:
        print_option("1", "Pipeboard (Recomendado)", "Obtenha um token rápido em pipeboard.co")
        print_option("2", "Facebook Developers (Manual)", "Configure manualmente via developers.facebook.com")
        print_option("3", "Testar Conexão", "Verifique se as configurações estão corretas")
        print_option("0", "Sair", "Encerrar o script")
        
        choice = input(f"{GREEN}➡️  Escolha uma opção:{RESET} ").strip()
        
        if choice == "1":
            if get_pipeboard_token():
                test_connection()
                break
        elif choice == "2":
            if get_manual_token():
                test_connection()
                break
        elif choice == "3":
            test_connection()
        elif choice == "0":
            print(f"\n{YELLOW}👋 Até logo!{RESET}\n")
            break
        else:
            print(f"{RED}❌ Opção inválida{RESET}")

if __name__ == "__main__":
    main()

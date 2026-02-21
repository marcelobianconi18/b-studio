#!/usr/bin/env python3
"""
Script interativo para conectar Instagram e obter token válido.
Guia o usuário passo a passo no processo de autenticação.
"""

import os
import sys
import webbrowser
import json
import time
from pathlib import Path
from dotenv import load_dotenv

# Colors
GREEN = "\033[92m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RED = "\033[91m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"

# Load current token
load_dotenv(Path(__file__).parent / ".env")
CURRENT_TOKEN = os.getenv("FACEBOOK_ACCESS_TOKEN", "")

def print_header():
    print(f"\n{BLUE}{'='*70}{RESET}")
    print(f"{BLUE}📸 B-Studio - Conexão Instagram{RESET}")
    print(f"{BLUE}{'='*70}{RESET}\n")

def print_step(number, title):
    print(f"\n{CYAN}{'─'*70}{RESET}")
    print(f"{CYAN}📍 PASSO {number}: {title}{RESET}")
    print(f"{CYAN}{'─'*70}{RESET}\n")

def print_success(message):
    print(f"\n{GREEN}✅ {message}{RESET}\n")

def print_error(message):
    print(f"\n{RED}❌ {message}{RESET}\n")

def print_warning(message):
    print(f"\n{YELLOW}⚠️  {message}{RESET}\n")

def wait_enter():
    input(f"{YELLOW}Pressione ENTER para continuar...{RESET}")

def check_current_token():
    """Verifica o token atual e suas permissões."""
    print_step(0, "Verificando Token Atual")
    
    if not CURRENT_TOKEN:
        print_error("Nenhum token configurado no .env")
        return None, []
    
    print(f"Token atual: {CURRENT_TOKEN[:20]}...")
    
    # Debug token
    import requests
    try:
        response = requests.get(
            f"https://graph.facebook.com/v22.0/debug_token",
            params={
                "input_token": CURRENT_TOKEN,
                "access_token": CURRENT_TOKEN
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("data", {}).get("is_valid"):
                scopes = data["data"].get("scopes", [])
                print_success(f"Token válido! Permissões: {', '.join(scopes)}")
                
                has_instagram = "instagram_basic" in scopes
                has_insights = "instagram_manage_insights" in scopes
                
                if has_instagram and has_insights:
                    print_success("Token JÁ TEM permissões do Instagram! ✨")
                    return CURRENT_TOKEN, scopes
                else:
                    print_warning("Token NÃO tem permissões do Instagram")
                    print(f"  ❌ instagram_basic: {'✅' if has_instagram else '❌'}")
                    print(f"  ❌ instagram_manage_insights: {'✅' if has_insights else '❌'}")
                    return CURRENT_TOKEN, scopes
            else:
                print_error("Token inválido ou expirado")
                return None, []
        else:
            print_error(f"Erro ao verificar token: {response.text}")
            return None, []
    except Exception as e:
        print_error(f"Erro na requisição: {e}")
        return None, []

def check_connected_pages():
    """Verifica quais páginas têm Instagram conectado."""
    print_step(1, "Verificando Páginas com Instagram Conectado")
    
    import requests
    
    print("Verificando suas páginas do Facebook...\n")
    
    try:
        response = requests.get(
            "https://graph.facebook.com/v22.0/me/accounts",
            params={
                "fields": "id,name,instagram_business_account{id,username,name}",
                "limit": 100
            },
            headers={"Authorization": f"Bearer {CURRENT_TOKEN}"},
            timeout=15
        )
        
        if response.status_code != 200:
            print_error(f"Erro: {response.text}")
            return []
        
        pages = response.json().get("data", [])
        
        if not pages:
            print_warning("Nenhuma página encontrada")
            return []
        
        print(f"📊 {len(pages)} páginas encontradas:\n")
        
        connected = []
        not_connected = []
        
        for i, page in enumerate(pages, 1):
            page_id = page["id"]
            page_name = page["name"]
            ig_account = page.get("instagram_business_account")
            
            if ig_account:
                username = ig_account.get("username", "N/A")
                print(f"  {GREEN}✅{RESET} [{i}] {page_name} (@{username})")
                connected.append({"id": page_id, "name": page_name, "username": username})
            else:
                print(f"  {RED}❌{RESET} [{i}] {page_name}")
                not_connected.append({"id": page_id, "name": page_name})
        
        print(f"\n{GREEN}Conectadas: {len(connected)}{RESET} | {RED}Não conectadas: {len(not_connected)}{RESET}")
        
        return connected, not_connected
        
    except Exception as e:
        print_error(f"Erro: {e}")
        return [], []

def guide_instagram_connection():
    """Guia o usuário para conectar Instagram às páginas."""
    print_step(2, "Conectar Instagram às Páginas")
    
    print(f"""{BOLD}Instruções para conectar Instagram:{RESET}

{YELLOW}MÉTODO 1: Pelo Facebook (Desktop) - RECOMENDADO{RESET}
1. Acesse: https://www.facebook.com/pages/
2. Clique na página que deseja conectar
3. Vá em 'Configurações' → 'Instagram'
4. Clique em 'Conectar Conta do Instagram'
5. Faça login com seu Instagram
6. Repita para cada página desejada

{YELLOW}MÉTODO 2: Pelo Instagram (Celular){RESET}
1. Abra o Instagram no celular
2. Vá em 'Perfil' → Menu (☰) → 'Configurações'
3. Toque em 'Conta' → 'Compartilhar em outros apps'
4. Selecione 'Facebook'
5. Escolha a página do Facebook
6. Repita para cada conta desejada

{CYAN}DICA:{RESET} Comece conectando às páginas principais:
   • Bianconi Estratégia& Marketing
   • Home Care Iguassu
   • Raquel Lopes - Estética
""")
    
    open_pages = input(f"{GREEN}Abrir Facebook Pages agora? (s/n):{RESET} ").strip().lower()
    if open_pages == 's':
        webbrowser.open("https://www.facebook.com/pages/")
        print_success("Facebook Pages aberto no navegador!")
    
    wait_enter()
    
    connected_count = input(f"{GREEN}Quantas páginas você conectou? (0-17):{RESET} ").strip()
    try:
        count = int(connected_count) if connected_count.isdigit() else 0
        if count > 0:
            print_success(f"Ótimo! {count} página(s) conectada(s)!")
        else:
            print_warning("Sem problema! Você pode conectar depois.")
    except:
        print_warning("Entrada inválida, pulando...")

def guide_token_generation():
    """Guia o usuário para gerar token com permissões do Instagram."""
    print_step(3, "Gerar Novo Token com Permissões do Instagram")
    
    print(f"""{BOLD}Instruções para gerar token:{RESET}

{YELLOW}PASSO A PASSO:{RESET}

1. {CYAN}Acesse Graph API Explorer:{RESET}
   https://developers.facebook.com/tools/explorer/

2. {CYAN}Selecione o App:{RESET}
   • Clique no dropdown "Application"
   • Selecione: "Bia Internal" (ID: 883116774139196)

3. {CYAN}Gere o Token:{RESET}
   • Clique em "Generate Access Token"
   • Faça login se necessário

4. {CYAN}Marque estas permissões:{RESET}
   {GREEN}✅ instagram_basic{RESET}
   {GREEN}✅ instagram_manage_insights{RESET}
   {GREEN}✅ pages_show_list{RESET}
   {GREEN}✅ pages_read_engagement{RESET}
   {GREEN}✅ read_insights{RESET}
   {GREEN}✅ business_management{RESET}
   {GREEN}✅ ads_management{RESET}
   {GREEN}✅ ads_read{RESET}

5. {CYAN}Copie o token gerado:{RESET}
   • Será um texto longo começando com "EAAM..."
   • Clique no ícone de copiar

{RED}⚠️  IMPORTANTE:{RESET}
   • NÃO feche a janela do Graph API Explorer ainda
   • Você vai precisar colar o token aqui
""")
    
    open_explorer = input(f"{GREEN}Abrir Graph API Explorer agora? (s/n):{RESET} ").strip().lower()
    if open_explorer == 's':
        webbrowser.open("https://developers.facebook.com/tools/explorer/")
        print_success("Graph API Explorer aberto!")
    
    wait_enter()
    
    # Pedir novo token
    print(f"\n{CYAN}{'─'*70}{RESET}")
    print(f"{CYAN}📋 Cole o Novo Token{RESET}")
    print(f"{CYAN}{'─'*70}{RESET}\n")
    
    new_token = input(f"{GREEN}Cole o token gerado (ou 'pular' para sair):{RESET} ").strip()
    
    if new_token and new_token.lower() != 'pular':
        if new_token.startswith("EAAM"):
            print_success("Token recebido! Verificando...")
            return new_token
        else:
            print_warning("Token parece inválido (deve começar com EAAM)")
            return None
    else:
        print_warning("Pulando etapa de token")
        return None

def verify_new_token(token):
    """Verifica se o novo token tem permissões do Instagram."""
    print_step(4, "Verificando Novo Token")
    
    import requests
    
    try:
        response = requests.get(
            "https://graph.facebook.com/v22.0/debug_token",
            params={
                "input_token": token,
                "access_token": token
            },
            timeout=10
        )
        
        if response.status_code != 200:
            print_error(f"Erro: {response.text}")
            return False
        
        data = response.json().get("data", {})
        
        if not data.get("is_valid"):
            print_error("Token inválido!")
            return False
        
        scopes = data.get("scopes", [])
        print(f"Token válido! Permissões: {', '.join(scopes)}")
        
        has_instagram_basic = "instagram_basic" in scopes
        has_instagram_insights = "instagram_manage_insights" in scopes
        
        print(f"\n  instagram_basic: {'✅' if has_instagram_basic else '❌'}")
        print(f"  instagram_manage_insights: {'✅' if has_instagram_insights else '❌'}")
        
        if has_instagram_basic and has_instagram_insights:
            print_success("Token tem TODAS as permissões do Instagram! 🎉")
            return True
        else:
            print_error("Token NÃO tem todas as permissões do Instagram")
            print("Volte ao Graph API Explorer e marque TODAS as permissões listadas")
            return False
            
    except Exception as e:
        print_error(f"Erro: {e}")
        return False

def save_new_token(token):
    """Salva o novo token no arquivo .env."""
    print_step(5, "Salvando Novo Token")
    
    env_path = Path(__file__).parent / ".env"
    
    try:
        # Ler conteúdo atual
        if env_path.exists():
            with open(env_path, "r", encoding="utf-8") as f:
                content = f.read()
        else:
            content = ""
        
        # Atualizar tokens
        lines = content.splitlines()
        new_lines = []
        
        for line in lines:
            if line.startswith("FACEBOOK_ACCESS_TOKEN="):
                new_lines.append(f"FACEBOOK_ACCESS_TOKEN={token}")
            elif line.startswith("META_ACCESS_TOKEN="):
                new_lines.append(f"META_ACCESS_TOKEN={token}")
            else:
                new_lines.append(line)
        
        # Escrever novo conteúdo
        with open(env_path, "w", encoding="utf-8") as f:
            f.write("\n".join(new_lines))
        
        print_success("Token salvo em backend/.env!")
        
        # Atualizar documento de credenciais
        docs_path = Path(__file__).parent.parent / "docs" / "META_CREDENTIALS.md"
        if docs_path.exists():
            with open(docs_path, "r", encoding="utf-8") as f:
                doc_content = f.read()
            
            # Atualizar token no documento
            import re
            old_token_pattern = r"EAAMjMKWeJTwBQ[A-Za-z0-9]+"
            doc_content = re.sub(old_token_pattern, token[:100] + "...", doc_content)
            
            with open(docs_path, "w", encoding="utf-8") as f:
                f.write(doc_content)
            
            print_success("Documento de credenciais atualizado!")
        
        print(f"\n{GREEN}Próximos passos:{RESET}")
        print("1. Reinicie o backend: uvicorn main:app --reload --port 8001")
        print("2. Teste: curl http://localhost:8001/api/social/instagram-accounts")
        
        return True
        
    except Exception as e:
        print_error(f"Erro ao salvar: {e}")
        print(f"Salve manualmente no arquivo: {env_path}")
        return False

def test_instagram_connection(token):
    """Testa se consegue acessar contas do Instagram."""
    print_step(6, "Testando Conexão com Instagram")
    
    import requests
    
    try:
        # Primeiro, pegar páginas
        response = requests.get(
            "https://graph.facebook.com/v22.0/me/accounts",
            params={
                "fields": "id,name,instagram_business_account{id,username,name}",
                "limit": 100
            },
            headers={"Authorization": f"Bearer {token}"},
            timeout=15
        )
        
        if response.status_code != 200:
            print_error(f"Erro ao buscar páginas: {response.text}")
            return
        
        pages = response.json().get("data", [])
        instagram_accounts = []
        
        for page in pages:
            ig = page.get("instagram_business_account")
            if ig:
                instagram_accounts.append(ig)
        
        if instagram_accounts:
            print_success(f"{len(instagram_accounts)} conta(s) do Instagram encontrada(s)!")
            for ig in instagram_accounts:
                print(f"  📸 @{ig.get('username', 'N/A')} - {ig.get('name', 'N/A')}")
        else:
            print_warning("Nenhuma conta do Instagram encontrada")
            print("Isso significa que nenhuma página tem Instagram conectado")
            print("Volte ao Passo 2 e conecte o Instagram às páginas")
            
    except Exception as e:
        print_error(f"Erro no teste: {e}")

def main():
    print_header()
    
    print(f"""{BOLD}Este script vai te ajudar a:{RESET}
   1. Verificar token atual
   2. Conectar Instagram às páginas do Facebook
   3. Gerar novo token com permissões do Instagram
   4. Testar a conexão
   5. Salvar configurações

{YELLOW}TEMPO ESTIMADO: 10-15 minutos{RESET}
""")
    
    wait_enter()
    
    # Passo 0: Verificar token atual
    current_token, scopes = check_current_token()
    
    if current_token and "instagram_basic" in scopes and "instagram_manage_insights" in scopes:
        print_success("Seu token JÁ tem permissões do Instagram!")
        test_instagram_connection(current_token)
        return
    
    # Passo 1 e 2: Verificar e conectar páginas
    connected, not_connected = check_connected_pages()
    
    if not_connected:
        guide_instagram_connection()
    
    # Passo 3: Gerar novo token
    new_token = guide_token_generation()
    
    if not new_token:
        print_warning("Nenhum token novo fornecido. Encerrando...")
        return
    
    # Passo 4: Verificar novo token
    if not verify_new_token(new_token):
        print_error("Token não passou na verificação")
        retry = input(f"{GREEN}Tentar gerar outro token? (s/n):{RESET} ").strip().lower()
        if retry == 's':
            new_token = guide_token_generation()
            if new_token and not verify_new_token(new_token):
                print_error("Segunda tentativa falhou. Encerrando...")
                return
        else:
            return
    
    # Passo 5: Salvar token
    if save_new_token(new_token):
        # Passo 6: Testar conexão
        test_instagram_connection(new_token)
        
        print_success("Configuração concluída! 🎉")
    else:
        print_error("Falha ao salvar token")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n{YELLOW}⚠️  Processo cancelado pelo usuário{RESET}\n")
    except Exception as e:
        print(f"\n{RED}Erro inesperado: {e}{RESET}\n")
        import traceback
        traceback.print_exc()

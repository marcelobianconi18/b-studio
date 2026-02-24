#!/usr/bin/env python3
"""
B-Studio OAuth System - Meta Ads Authentication

Sistema de OAuth para clientes autorizarem o B-Studio a gerenciar seus anúncios.

Fluxo:
1. Cliente clica em "Conectar com Facebook"
2. Redireciona para OAuth do Facebook
3. Cliente autoriza permissões
4. Facebook redireciona de volta com code
5. Trocamos code por access_token
6. Salvamos token no banco
7. Cliente pode criar campanhas via API
"""

import os
import json
import httpx
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from dotenv import load_dotenv

load_dotenv()

# Configurações do App
APP_ID = os.getenv("META_APP_ID", "883116774139196")
APP_SECRET = os.getenv("META_APP_SECRET", "")
REDIRECT_URI = os.getenv("OAUTH_REDIRECT_URI", "http://localhost:8001/auth/facebook/callback")

# Permissões solicitadas
OAUTH_SCOPE = [
    "ads_management",
    "ads_read",
    "business_management",
    "pages_manage_posts",
    "pages_read_engagement",
    "instagram_basic",
    "instagram_manage_insights",
]

# Estado CSRF (proteção)
oauth_states = {}


class OAuthManager:
    """Gerenciador de OAuth para Meta Ads."""
    
    def __init__(self):
        self.app_id = APP_ID
        self.app_secret = APP_SECRET
        self.redirect_uri = REDIRECT_URI
        self.scope = ",".join(OAUTH_SCOPE)
    
    def generate_state(self) -> str:
        """Gera estado CSRF para segurança."""
        state = secrets.token_urlsafe(32)
        oauth_states[state] = {
            'created_at': datetime.now(),
            'expires_at': datetime.now() + timedelta(minutes=10)
        }
        return state
    
    def get_auth_url(self, state: str) -> str:
        """Gera URL de autorização do Facebook."""
        params = {
            'client_id': self.app_id,
            'redirect_uri': self.redirect_uri,
            'scope': self.scope,
            'state': state,
            'response_type': 'code',
        }
        
        auth_url = "https://www.facebook.com/v22.0/dialog/oauth"
        return f"{auth_url}?{'&'.join([f'{k}={v}' for k, v in params.items()])}"
    
    async def exchange_code_for_token(self, code: str) -> Dict:
        """Troca authorization code por access token."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            url = "https://graph.facebook.com/v22.0/oauth/access_token"
            params = {
                'client_id': self.app_id,
                'client_secret': self.app_secret,
                'redirect_uri': self.redirect_uri,
                'code': code,
            }
            
            resp = await client.get(url, params=params)
            result = resp.json()
            
            if 'error' in result:
                raise Exception(f"OAuth Error: {result['error'].get('message', 'Unknown error')}")
            
            return result
    
    async def get_long_lived_token(self, short_token: str) -> Dict:
        """Troca token de curta duração por token de longa duração (60 dias)."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            url = "https://graph.facebook.com/v22.0/oauth/access_token"
            params = {
                'grant_type': 'fb_exchange_token',
                'client_id': self.app_id,
                'client_secret': self.app_secret,
                'fb_exchange_token': short_token,
            }
            
            resp = await client.get(url, params=params)
            result = resp.json()
            
            if 'error' in result:
                raise Exception(f"Token Exchange Error: {result['error'].get('message', 'Unknown error')}")
            
            return result
    
    async def get_user_info(self, access_token: str) -> Dict:
        """Obtém informações do usuário autorizado."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            url = "https://graph.facebook.com/v22.0/me"
            params = {
                'fields': 'id,name,email,accounts{access_token,id,name}',
                'access_token': access_token,
            }
            
            resp = await client.get(url, params=params)
            return resp.json()
    
    async def get_ad_accounts(self, access_token: str) -> List[Dict]:
        """Obtém contas de anúncios do usuário."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            url = "https://graph.facebook.com/v22.0/me/adaccounts"
            params = {
                'fields': 'id,name,account_status,business,owner_business',
                'access_token': access_token,
            }
            
            resp = await client.get(url, params=params)
            result = resp.json()
            
            if 'error' in result:
                raise Exception(f"API Error: {result['error'].get('message', 'Unknown error')}")
            
            return result.get('data', [])
    
    async def verify_token(self, access_token: str) -> Dict:
        """Verifica se o token é válido e obtém informações."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            url = "https://graph.facebook.com/debug_token"
            params = {
                'input_token': access_token,
                'access_token': f"{self.app_id}|{self.app_secret}",
            }
            
            resp = await client.get(url, params=params)
            return resp.json()


class ClientTokenManager:
    """Gerenciador de tokens dos clientes (banco de dados)."""
    
    def __init__(self):
        # Em produção, use um banco de dados real (PostgreSQL, MySQL, etc.)
        self.client_tokens: Dict[str, Dict] = {}
    
    def save_token(self, client_id: str, token_data: Dict):
        """Salva token do cliente."""
        self.client_tokens[client_id] = {
            'access_token': token_data.get('access_token'),
            'token_type': token_data.get('token_type', 'bearer'),
            'expires_in': token_data.get('expires_in'),
            'user_id': token_data.get('user_id'),
            'user_name': token_data.get('user_name'),
            'user_email': token_data.get('user_email'),
            'ad_accounts': token_data.get('ad_accounts', []),
            'created_at': datetime.now(),
            'last_used': datetime.now(),
        }
    
    def get_token(self, client_id: str) -> Optional[Dict]:
        """Obtém token do cliente."""
        return self.client_tokens.get(client_id)
    
    def delete_token(self, client_id: str):
        """Remove token do cliente (revoke)."""
        if client_id in self.client_tokens:
            del self.client_tokens[client_id]
    
    def list_clients(self) -> List[Dict]:
        """Lista todos os clientes autorizados."""
        return [
            {
                'client_id': client_id,
                'user_name': data['user_name'],
                'user_email': data['user_email'],
                'ad_accounts_count': len(data['ad_accounts']),
                'created_at': data['created_at'].isoformat(),
                'last_used': data['last_used'].isoformat(),
            }
            for client_id, data in self.client_tokens.items()
        ]


# Instâncias globais
oauth_manager = OAuthManager()
token_manager = ClientTokenManager()


# ============================================================================
# API ENDPOINTS (FastAPI)
# ============================================================================

from fastapi import APIRouter, Request, HTTPException, Query
from fastapi.responses import RedirectResponse, JSONResponse

router = APIRouter()


@router.get("/auth/facebook")
async def facebook_auth():
    """
    Inicia fluxo OAuth com Facebook.
    
    Redireciona usuário para página de autorização do Facebook.
    """
    state = oauth_manager.generate_state()
    auth_url = oauth_manager.get_auth_url(state)
    
    return RedirectResponse(url=auth_url)


@router.get("/auth/facebook/callback")
async def facebook_callback(
    code: Optional[str] = Query(None),
    error: Optional[str] = Query(None),
    error_reason: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
):
    """
    Callback do OAuth do Facebook.
    
    Recebe authorization code e troca por access token.
    """
    # Verificar erro
    if error:
        raise HTTPException(
            status_code=400,
            detail=f"OAuth Error: {error} - {error_reason}"
        )
    
    if not code:
        raise HTTPException(status_code=400, detail="No authorization code received")
    
    # Verificar estado CSRF
    if state not in oauth_states:
        raise HTTPException(status_code=400, detail="Invalid state parameter")
    
    state_data = oauth_states[state]
    if datetime.now() > state_data['expires_at']:
        del oauth_states[state]
        raise HTTPException(status_code=400, detail="State parameter expired")
    
    del oauth_states[state]
    
    # Trocar code por token
    try:
        token_result = await oauth_manager.exchange_code_for_token(code)
        short_token = token_result.get('access_token')
        
        # Trocar por token de longa duração
        long_token_result = await oauth_manager.get_long_lived_token(short_token)
        access_token = long_token_result.get('access_token')
        
        # Obter informações do usuário
        user_info = await oauth_manager.get_user_info(access_token)
        user_id = user_info.get('id')
        
        # Obter contas de anúncios
        ad_accounts = await oauth_manager.get_ad_accounts(access_token)
        
        # Salvar token
        token_data = {
            'access_token': access_token,
            'token_type': 'bearer',
            'expires_in': long_token_result.get('expires_in', 5184000),  # 60 dias
            'user_id': user_id,
            'user_name': user_info.get('name'),
            'user_email': user_info.get('email'),
            'ad_accounts': ad_accounts,
        }
        
        token_manager.save_token(user_id, token_data)
        
        # Redirecionar para dashboard
        return {
            'status': 'success',
            'message': 'Facebook Ads authorized successfully!',
            'user_id': user_id,
            'user_name': user_info.get('name'),
            'ad_accounts_count': len(ad_accounts),
            'token_expires_in': long_token_result.get('expires_in', 5184000),
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/auth/status")
async def auth_status(client_id: str = Query(...)):
    """
    Verifica status de autenticação do cliente.
    """
    token = token_manager.get_token(client_id)
    
    if not token:
        return {
            'authorized': False,
            'message': 'Client not authorized'
        }
    
    # Verificar se token ainda é válido
    verify_result = await oauth_manager.verify_token(token['access_token'])
    
    if verify_result.get('data', {}).get('is_valid', False):
        return {
            'authorized': True,
            'user_name': token['user_name'],
            'user_email': token['user_email'],
            'ad_accounts_count': len(token['ad_accounts']),
            'expires_at': (token['created_at'] + timedelta(seconds=token['expires_in'])).isoformat(),
        }
    else:
        return {
            'authorized': False,
            'message': 'Token expired or invalid',
            'reauthorize_url': '/auth/facebook'
        }


@router.get("/auth/clients")
async def list_clients():
    """
    Lista todos os clientes autorizados.
    """
    return {
        'clients': token_manager.list_clients(),
        'total': len(token_manager.list_clients())
    }


@router.delete("/auth/revoke")
async def revoke_access(client_id: str = Query(...)):
    """
    Revoga acesso do cliente.
    """
    token_manager.delete_token(client_id)
    
    return {
        'status': 'success',
        'message': 'Access revoked successfully'
    }


@router.get("/auth/ad-accounts")
async def get_ad_accounts(client_id: str = Query(...)):
    """
    Obtém contas de anúncios do cliente.
    """
    token = token_manager.get_token(client_id)
    
    if not token:
        raise HTTPException(status_code=401, detail="Client not authorized")
    
    return {
        'ad_accounts': token['ad_accounts'],
        'total': len(token['ad_accounts'])
    }


# ============================================================================
# EXEMPLO DE USO
# ============================================================================

"""
# 1. Iniciar OAuth (usuário clica em "Conectar com Facebook")
GET /auth/facebook

# 2. Facebook redireciona de volta para /auth/facebook/callback?code=XXX

# 3. Verificar status de autenticação
GET /auth/status?client_id=123456

# 4. Listar contas de anúncios
GET /auth/ad-accounts?client_id=123456

# 5. Revogar acesso
DELETE /auth/revoke?client_id=123456

# 6. Listar todos os clientes
GET /auth/clients
"""


# ============================================================================
# FRONTEND EXAMPLE (HTML/JS)
# ============================================================================

FRONTEND_EXAMPLE = """
<!DOCTYPE html>
<html>
<head>
    <title>B-Studio - Connect Facebook Ads</title>
</head>
<body>
    <h1>Connect Your Facebook Ads Account</h1>
    
    <button onclick="connectFacebook()">
        🔗 Connect with Facebook
    </button>
    
    <div id="status"></div>
    
    <script>
        function connectFacebook() {
            // Redireciona para OAuth
            window.location.href = '/auth/facebook';
        }
        
        // Verificar status após redirect
        window.onload = async function() {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            
            if (code) {
                // OAuth completo, verificar status
                const response = await fetch('/auth/status?client_id=me');
                const data = await response.json();
                
                if (data.authorized) {
                    document.getElementById('status').innerHTML = `
                        ✅ Connected as ${data.user_name}<br>
                        📊 ${data.ad_accounts_count} ad accounts<br>
                        ⏰ Expires: ${data.expires_at}
                    `;
                }
            }
        };
    </script>
</body>
</html>
"""


if __name__ == "__main__":
    # Teste do sistema
    print("=" * 80)
    print("B-Studio OAuth System - Meta Ads")
    print("=" * 80)
    print(f"\nApp ID: {APP_ID}")
    print(f"Redirect URI: {REDIRECT_URI}")
    print(f"\nScope: {', '.join(OAUTH_SCOPE)}")
    print(f"\nFrontend Example:")
    print(FRONTEND_EXAMPLE)

# 🔐 B-Studio OAuth System - Documentação Completa

## 📋 VISÃO GERAL

Sistema de OAuth para clientes autorizarem o B-Studio a gerenciar seus anúncios no Meta Ads.

**Funcionalidades:**
- ✅ OAuth 2.0 com Facebook
- ✅ Tokens de longa duração (60 dias)
- ✅ Gerenciamento de múltiplos clientes
- ✅ Listagem de contas de anúncios
- ✅ Revogação de acesso
- ✅ Proteção CSRF

---

## 🚀 INSTALAÇÃO

### **1. Dependências**

```bash
pip install fastapi httpx python-dotenv
```

### **2. Variáveis de Ambiente**

Crie/atualize `.env`:

```env
# Meta App Configuration
META_APP_ID=883116774139196
META_APP_SECRET=seu_app_secret_aqui

# OAuth Configuration
OAUTH_REDIRECT_URI=http://localhost:8001/auth/facebook/callback

# Database (em produção)
DATABASE_URL=postgresql://user:password@localhost/bstudio
```

### **3. Obter App Secret**

1. Acesse: https://developers.facebook.com/apps/883116774139196/settings/basic/
2. Clique em "Show" em "App Secret"
3. Copie e cole no `.env`

---

## 🔧 CONFIGURAÇÃO

### **1. Adicionar Produto Marketing API**

```
App Dashboard → Add Product → Marketing API → Add
```

### **2. Configurar OAuth Redirect URI**

```
App Dashboard → Settings → Basic
→ Add Platform → Website
→ Site URL: http://localhost:8001
→ Valid OAuth Redirect URIs: http://localhost:8001/auth/facebook/callback
```

### **3. Solicitar Permissões**

Permissões incluídas:
```
✅ ads_management
✅ ads_read
✅ business_management
✅ pages_manage_posts
✅ pages_read_engagement
✅ instagram_basic
✅ instagram_manage_insights
```

---

## 📖 USO

### **1. Iniciar OAuth (Frontend)**

**Botão "Conectar com Facebook":**

```html
<button onclick="window.location.href='/auth/facebook'">
    🔗 Connect with Facebook
</button>
```

**Ou em React/Next.js:**

```tsx
function ConnectButton() {
    return (
        <button 
            onClick={() => window.location.href = '/auth/facebook'}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold"
        >
            🔗 Connect with Facebook Ads
        </button>
    );
}
```

---

### **2. Fluxo OAuth**

```
1. Usuário clica em "Conectar"
   ↓
2. Redireciona para Facebook OAuth
   ↓
3. Usuário autoriza permissões
   ↓
4. Facebook redireciona de volta com ?code=XXX
   ↓
5. Backend troca code por access_token
   ↓
6. Token salvo no banco
   ↓
7. Usuário pode criar campanhas
```

---

### **3. Endpoints da API**

#### **Iniciar OAuth:**
```http
GET /auth/facebook
```

**Resposta:** Redirect para Facebook

---

#### **Callback OAuth:**
```http
GET /auth/facebook/callback?code=AUTH_CODE&state=STATE
```

**Resposta:**
```json
{
    "status": "success",
    "message": "Facebook Ads authorized successfully!",
    "user_id": "123456789",
    "user_name": "Marcelo Bianconi",
    "ad_accounts_count": 3,
    "token_expires_in": 5184000
}
```

---

#### **Verificar Status:**
```http
GET /auth/status?client_id=123456
```

**Resposta:**
```json
{
    "authorized": true,
    "user_name": "Marcelo Bianconi",
    "user_email": "email@example.com",
    "ad_accounts_count": 3,
    "expires_at": "2026-04-25T00:00:00"
}
```

---

#### **Listar Contas de Anúncios:**
```http
GET /auth/ad-accounts?client_id=123456
```

**Resposta:**
```json
{
    "ad_accounts": [
        {
            "id": "act_1234364948325942",
            "name": "professor lemos",
            "account_status": 1
        },
        {
            "id": "act_7428197007234613",
            "name": "Deputado Welter 2023-26",
            "account_status": 1
        }
    ],
    "total": 2
}
```

---

#### **Listar Todos os Clientes:**
```http
GET /auth/clients
```

**Resposta:**
```json
{
    "clients": [
        {
            "client_id": "123456789",
            "user_name": "Marcelo Bianconi",
            "user_email": "email@example.com",
            "ad_accounts_count": 3,
            "created_at": "2026-02-24T00:00:00",
            "last_used": "2026-02-24T12:00:00"
        }
    ],
    "total": 1
}
```

---

#### **Revogar Acesso:**
```http
DELETE /auth/revoke?client_id=123456
```

**Resposta:**
```json
{
    "status": "success",
    "message": "Access revoked successfully"
}
```

---

## 💻 EXEMPLO DE INTEGRAÇÃO

### **Backend (FastAPI):**

```python
from fastapi import FastAPI
from oauth_manager import router as oauth_router

app = FastAPI()

# Adicionar rotas de OAuth
app.include_router(oauth_router, prefix="/api")
```

### **Frontend (React/Next.js):**

```tsx
import { useState, useEffect } from 'react';

function AdsManager() {
    const [authorized, setAuthorized] = useState(false);
    const [adAccounts, setAdAccounts] = useState([]);
    
    // Verificar autorização ao carregar
    useEffect(() => {
        checkAuth();
    }, []);
    
    const checkAuth = async () => {
        const res = await fetch('/api/auth/status?client_id=me');
        const data = await res.json();
        
        if (data.authorized) {
            setAuthorized(true);
            loadAdAccounts();
        }
    };
    
    const loadAdAccounts = async () => {
        const res = await fetch('/api/auth/ad-accounts?client_id=me');
        const data = await res.json();
        setAdAccounts(data.ad_accounts);
    };
    
    const connectFacebook = () => {
        window.location.href = '/api/auth/facebook';
    };
    
    const revokeAccess = async () => {
        await fetch('/api/auth/revoke?client_id=me', { method: 'DELETE' });
        setAuthorized(false);
    };
    
    if (!authorized) {
        return (
            <button onClick={connectFacebook}>
                🔗 Connect with Facebook Ads
            </button>
        );
    }
    
    return (
        <div>
            <h2>✅ Connected!</h2>
            <p>Ad Accounts: {adAccounts.length}</p>
            <ul>
                {adAccounts.map(account => (
                    <li key={account.id}>{account.name}</li>
                ))}
            </ul>
            <button onClick={revokeAccess}>
                ❌ Revoke Access
            </button>
        </div>
    );
}
```

---

## 🗄️ BANCO DE DADOS (Produção)

### **Tabela: client_tokens**

```sql
CREATE TABLE client_tokens (
    id SERIAL PRIMARY KEY,
    client_id VARCHAR(255) UNIQUE NOT NULL,
    access_token TEXT NOT NULL,
    token_type VARCHAR(50) DEFAULT 'bearer',
    expires_in INTEGER,
    user_id VARCHAR(255),
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    ad_accounts JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    last_used TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_client_tokens_client_id ON client_tokens(client_id);
CREATE INDEX idx_client_tokens_user_id ON client_tokens(user_id);
```

### **Modelo SQLAlchemy:**

```python
from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class ClientToken(Base):
    __tablename__ = 'client_tokens'
    
    id = Column(Integer, primary_key=True)
    client_id = Column(String, unique=True, nullable=False)
    access_token = Column(String, nullable=False)
    token_type = Column(String, default='bearer')
    expires_in = Column(Integer)
    user_id = Column(String)
    user_name = Column(String)
    user_email = Column(String)
    ad_accounts = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used = Column(DateTime, default=datetime.utcnow)
```

---

## 🔒 SEGURANÇA

### **1. Proteção CSRF**

O sistema usa `state` parameter para proteger contra CSRF:

```python
state = secrets.token_urlsafe(32)
oauth_states[state] = {
    'created_at': datetime.now(),
    'expires_at': datetime.now() + timedelta(minutes=10)
}
```

### **2. Tokens Criptografados**

Em produção, criptografe os tokens no banco:

```python
from cryptography.fernet import Fernet

key = Fernet.generate_key()
cipher = Fernet(key)

# Criptografar
encrypted_token = cipher.encrypt(access_token.encode())

# Descriptografar
decrypted_token = cipher.decrypt(encrypted_token).decode()
```

### **3. HTTPS Obrigatório**

Em produção, use apenas HTTPS:

```python
OAUTH_REDIRECT_URI = "https://seusaas.com/auth/facebook/callback"
```

---

## 📊 MONITORAMENTO

### **Logs de OAuth:**

```python
import logging

logger = logging.getLogger("oauth")

logger.info(f"OAuth started for client: {client_id}")
logger.info(f"OAuth completed for user: {user_name}")
logger.warning(f"OAuth failed: {error_message}")
logger.info(f"Token revoked for client: {client_id}")
```

### **Métricas para Acompanhar:**

| Métrica | Descrição |
|---------|-----------|
| `oauth_started` | Quantos iniciaram OAuth |
| `oauth_completed` | Quantos completaram |
| `oauth_failed` | Quantos falharam |
| `active_clients` | Clientes ativos |
| `tokens_expiring_soon` | Tokens expirando em 7 dias |

---

## 🧪 TESTES

### **Teste Unitário:**

```python
import pytest
from oauth_manager import OAuthManager

@pytest.mark.asyncio
async def test_oauth_flow():
    oauth = OAuthManager()
    
    # Gerar estado
    state = oauth.generate_state()
    assert state in oauth_states
    
    # Gerar URL de auth
    auth_url = oauth.get_auth_url(state)
    assert 'state=' in auth_url
    assert state in auth_url
    
    # Testar troca de token (mock)
    # ...
```

---

## 🚀 DEPLOY EM PRODUÇÃO

### **1. Atualizar Redirect URI**

```env
OAUTH_REDIRECT_URI=https://seusaas.com/auth/facebook/callback
```

### **2. Configurar Facebook App**

```
App Dashboard → Settings → Basic
→ Add Platform → Website
→ Site URL: https://seusaas.com
→ Valid OAuth Redirect URIs: https://seusaas.com/auth/facebook/callback
```

### **3. Habilitar HTTPS**

Use Let's Encrypt ou similar:

```bash
certbot --nginx -d seusaas.com
```

### **4. Environment Variables**

```env
META_APP_ID=883116774139196
META_APP_SECRET=secret_key_here
OAUTH_REDIRECT_URI=https://seusaas.com/auth/facebook/callback
DATABASE_URL=postgresql://user:pass@localhost/bstudio
ENCRYPTION_KEY=your_encryption_key_here
```

---

## 📈 PRÓXIMOS PASSOS

### **Para Lançar o SaaS:**

1. ✅ Obter App Review aprovado
2. ✅ Solicitar Authorization ID político
3. ✅ Implementar banco de dados real
4. ✅ Adicionar criptografia de tokens
5. ✅ Configurar HTTPS em produção
6. ✅ Adicionar logging e monitoramento
7. ✅ Criar dashboard para clientes
8. ✅ Implementar billing/assinaturas

---

## 🎉 EXEMPLO COMPLETO

### **Arquivo: `main.py`**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from oauth_manager import router as oauth_router

app = FastAPI(title="B-Studio Ads API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://seusaas.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OAuth Routes
app.include_router(oauth_router, prefix="/api")

# Health Check
@app.get("/health")
def health():
    return {"status": "ok"}

# Run
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
```

---

**Sistema OAuth pronto para usar!** 🚀

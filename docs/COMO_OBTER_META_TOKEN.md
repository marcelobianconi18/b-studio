# 📘 Como Obter Facebook Access Token e Meta Ad Account ID

## Opção 1: Via Pipeboard (RECOMENDADO - Mais Fácil)

O Pipeboard simplifica a autenticação com a Meta Ads API.

### Passo 1: Acesse o Pipeboard
1. Vá para **https://pipeboard.co**
2. Clique em **"Connect Meta Account"** ou **"Get Started"**
3. Faça login com sua conta do Facebook

### Passo 2: Obtenha seu Token
1. Após conectar, vá para **Settings** ou **API Tokens**
2. Copie seu token (ex: `pk_8d419db95ee54af0a873fe187620e5e3`)

### Passo 3: Configure no B-Studio
```bash
# No backend/.env
PIPEBOARD_API_TOKEN=pk_8d419db95ee54af0a873fe187620e5e3
```

### Passo 4: Teste a conexão
```bash
cd /Volumes/SSD\ Externo/repositórios/b-studio/backend
python test_pb_auth.py
```

---

## Opção 2: Via Facebook Developers (Manual)

### Passo 1: Crie um App no Facebook Developers

1. Acesse **https://developers.facebook.com/**
2. Clique em **"Meus Apps"** → **"Criar App"**
3. Selecione **"Outro"** → **"Negócios"**
4. Preencha:
   - **Nome do App**: `B-Studio Auth`
   - **Email de contato**: seu@email.com
5. Clique em **"Criar App"**

### Passo 2: Configure o App

1. No dashboard do app, vá em **"Configurações"** → **"Básico"**
2. Anote:
   - **ID do App** (App ID)
   - **Segredo do App** (App Secret) - clique em "Mostrar"

3. Em **"Adicionar Plataforma"** → **"Site"**
   - URL do site: `http://localhost:8001`

4. Em **"Configurações"** → **"Básico"**
   - **URI de Redirecionamento OAuth Válida**: `http://localhost:8888/callback`

### Passo 3: Gere o Token de Acesso

#### Método A: Usando o Graph API Explorer (Rápido)

1. Acesse **https://developers.facebook.com/tools/explorer/**
2. Selecione seu app no dropdown
3. Clique em **"Generate Access Token"**
4. Conceda as permissões:
   - `business_management`
   - `pages_show_list`
   - `pages_read_engagement`
   - `read_insights`
   - `instagram_basic`
   - `instagram_manage_insights`
   - `public_profile`

5. Copie o token gerado (ex: `EAAxxxx...`)

#### Método B: Via OAuth Flow (Automático no B-Studio)

```bash
cd /Volumes/SSD\ Externo/repositórios/b-studio/backend

# 1. Configure as variáveis de ambiente
export META_APP_ID="779761636818489"
export META_APP_SECRET="seu_app_secret_aqui"

# 2. Execute o script de autenticação
python wait_for_meta_auth.py

# 3. O navegador abrirá automaticamente
# 4. Faça login e autorize o app
# 5. O token será salvo automaticamente no cache
```

### Passo 4: Encontre seu Ad Account ID

#### Método A: Via Graph API Explorer

1. Com o token gerado, faça esta requisição:
```
GET https://graph.facebook.com/v22.0/me/adaccounts?access_token=SEU_TOKEN
```

2. A resposta será:
```json
{
  "data": [
    {
      "id": "act_1234567890",
      "name": "Minha Conta de Anúncios"
    }
  ]
}
```

3. Copie o `id` (ex: `act_1234567890`)

#### Método B: Via Gerenciador de Anúncios

1. Acesse **https://www.facebook.com/adsmanager/**
2. Olhe a URL no navegador:
   ```
   https://www.facebook.com/adsmanager/manage/campaigns?act=1234567890
   ```
3. O número após `act=` é seu Ad Account ID
4. Adicione `act_` na frente: `act_1234567890`

---

## Passo 5: Configure no B-Studio

Edite o arquivo `backend/.env`:

```bash
# Opção Pipeboard (RECOMENDADO)
PIPEBOARD_API_TOKEN=pk_8d419db95ee54af0a873fe187620e5e3

# Opção Manual (se não usar Pipeboard)
META_APP_ID=779761636818489
META_APP_SECRET=seu_app_secret_aqui
META_ACCESS_TOKEN=EAAxxxx...seu_token_aqui
META_AD_ACCOUNT_ID=act_1234567890

# Configurações adicionais
FACEBOOK_ACCESS_TOKEN=EAAxxxx...seu_token_aqui
FACEBOOK_PAGE_ID=1234567890
```

---

## Passo 6: Teste a Conexão

```bash
cd /Volumes/SSD\ Externo/repositórios/b-studio/backend

# Teste com Pipeboard
python test_pb_auth.py

# Teste geral da API
python test_api_out.txt

# Ou inicie o backend e teste via navegador
source venv/bin/activate
uvicorn main:app --reload --port 8001

# Acesse: http://localhost:8001/api/ads/campaigns
```

---

## 🔍 Solução de Problemas

### Erro: "Token Malformed"
- Verifique se o token tem mais de 20 caracteres
- Tokens do Facebook começam com `EAA` ou `EAAC`

### Erro: "Permissions Missing"
- Revogue o token em: https://www.facebook.com/settings?tab=security
- Gere um novo token com todas as permissões

### Erro: "Token Expirado"
- Tokens manuais expiram em 1-2 horas
- Use o método de troca para token de longa duração (60 dias)
- Ou use Pipeboard (gerencia renovação automática)

### Erro: "Ad Account Not Found"
- Verifique se o Ad Account ID tem o prefixo `act_`
- Confirme que você tem acesso à conta de anúncios

---

## 📞 Suporte Pipeboard

- **Site**: https://pipeboard.co
- **Docs**: https://pipeboard.co/docs
- **Email**: info@pipeboard.co
- **MCP URL**: `https://mcp.pipeboard.co/meta-ads-mcp?token=pk_8d419db95ee54af0a873fe187620e5e3`

---

## 📚 Links Úteis

- [Facebook Graph API Explorer](https://developers.facebook.com/tools/explorer/)
- [Meta Ads API Docs](https://developers.facebook.com/docs/marketing-api/reference)
- [Token de Acesso](https://developers.facebook.com/docs/facebook-login/access-tokens/)
- [Gerenciador de Anúncios](https://www.facebook.com/adsmanager/)

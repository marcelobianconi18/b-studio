# 🔧 Configurar Permissões do Instagram - Guia Passo a Passo

**Data:** 21 de Fevereiro de 2026  
**App:** Bia Internal (ID: 883116774139196)  
**Objetivo:** Habilitar posts e insights do Instagram

---

## 📋 Passo 1: Acessar App Dashboard

**URL:** https://developers.facebook.com/apps/883116774139196/dashboard/

1. Faça login no Facebook
2. Clique em "Ver Detalhes" no app "Bia Internal"

---

## 📋 Passo 2: Adicionar Produtos do Instagram

### 2.1. Instagram Basic Display

1. **Menu Lateral** → **Products** → **+ Add Product**

2. **Busque por:** "Instagram Basic Display"

3. **Clique em:** "Set Up"

4. **Preencha:**
   - **Valid OAuth Redirect URIs:** `http://localhost:8001/callback`
   - **Deauthorize URL:** (opcional)
   - **Privacy Policy URL:** (opcional)

5. **Clique em:** "Save Changes"

### 2.2. Instagram Graph API

1. **Menu Lateral** → **Products** → **+ Add Product**

2. **Busque por:** "Instagram Graph API"

3. **Clique em:** "Set Up"

4. **Preencha:**
   - **Valid OAuth Redirect URIs:** `http://localhost:8001/callback`

5. **Clique em:** "Save Changes"

---

## 📋 Passo 3: Configurar Permissões e Features

### 3.1. Acessar App Review

1. **Menu Lateral** → **App Review** → **Permissions and Features**

### 3.2. Adicionar Permissões

1. **Clique em:** "Add Permissions and Features"

2. **Busque e selecione:**
   ```
   ✅ instagram_basic
   ✅ instagram_manage_insights
   ✅ instagram_content_publish
   ```

3. **Clique em:** "Save Changes"

### 3.3. Configurar Cada Permissão

Para cada permissão adicionada:

1. **Clique na permissão** (ex: `instagram_basic`)

2. **Preencha:**
   - **Description:** Descreva como seu app usa essa permissão
   - **Category:** Selecione a categoria apropriada
   - **Screenshots:** Adicione screenshots (opcional para desenvolvimento)

3. **Para desenvolvimento/teste:**
   - Não precisa de aprovação do Facebook
   - Funciona apenas para usuários adicionados como "Developers" ou "Testers"

4. **Clique em:** "Save"

---

## 📋 Passo 4: Adicionar Usuários de Teste

### 4.1. Acessar Roles

1. **Menu Lateral** → **App Review** → **Roles**

### 4.2. Adicionar Developers

1. **Clique em:** "Add" em **Administrators** ou **Developers**

2. **Digite seu nome ou email** do Facebook

3. **Selecione:** "Full Access"

4. **Clique em:** "Assign Role"

5. **Aceite o convite** que chegará no seu Facebook

---

## 📋 Passo 5: Gerar Token com Novas Permissões

### 5.1. Acessar Graph API Explorer

**URL:** https://developers.facebook.com/tools/explorer/

### 5.2. Selecionar App

1. **Dropdown "Application":** Selecione "Bia Internal"

### 5.3. Gerar Token

1. **Clique em:** "Generate Access Token"

2. **Faça login** se necessário

3. **Marque TODAS estas permissões:**

   **Instagram:**
   ```
   ✅ instagram_basic
   ✅ instagram_manage_insights
   ✅ instagram_content_publish
   ```

   **Facebook Pages:**
   ```
   ✅ pages_show_list
   ✅ pages_read_engagement
   ✅ pages_manage_posts
   ```

   **Business:**
   ```
   ✅ business_management
   ```

   **Ads:**
   ```
   ✅ ads_management
   ✅ ads_read
   ```

4. **Clique em:** "Generate Token"

5. **Copie o token** (começa com `EAAM...`)

---

## 📋 Passo 6: Testar Token

### 6.1. Testar no Graph API Explorer

**URL:** https://developers.facebook.com/tools/explorer/

```
GET /v22.0/me/accounts?fields=instagram_business_account{id,username,name,followers_count,media_count}
```

**Resultado Esperado:**

```json
{
  "data": [
    {
      "id": "1632409693526970",
      "name": "Raquel Lopes - Estética",
      "instagram_business_account": {
        "id": "17841463501439038",
        "username": "esteticista.raquellopes",
        "name": "Raquel Lopes | Esteticista Ribeirão Preto",
        "followers_count": 365,
        "media_count": 23
      }
    }
  ]
}
```

### 6.2. Testar Posts do Instagram

```
GET /v22.0/17841463501439038/media?fields=id,caption,media_type,media_url,permalink,timestamp
```

**Resultado Esperado:**

```json
{
  "data": [
    {
      "id": "17890000000000000",
      "caption": "Texto do post...",
      "media_type": "IMAGE",
      "media_url": "https://...",
      "permalink": "https://instagram.com/p/...",
      "timestamp": "2026-02-21T..."
    }
  ]
}
```

### 6.3. Testar Insights do Instagram

```
GET /v22.0/17841463501439038/insights?metric=follower_count,impressions,reach,profile_views
```

**Resultado Esperado:**

```json
{
  "data": [
    {
      "name": "follower_count",
      "values": [{"value": 365}]
    },
    {
      "name": "impressions",
      "values": [{"value": 1234}]
    }
  ]
}
```

---

## 📋 Passo 7: Atualizar no B-Studio

### 7.1. Atualizar .env

**Arquivo:** `/Volumes/SSD Externo/repositórios/b-studio/backend/.env`

```env
# Substitua pelo NOVO token gerado
META_ACCESS_TOKEN=EAAMjMKWeJTwBQ... (token completo)
FACEBOOK_ACCESS_TOKEN=EAAMjMKWeJTwBQ... (mesmo token)
```

### 7.2. Reiniciar Backend

```bash
# Pare o backend atual (Ctrl+C)

# Reinicie
cd /Volumes/SSD\ Externo/repositórios/b-studio/backend
source venv/bin/activate
uvicorn main:app --reload --port 8001
```

### 7.3. Testar Endpoints

```bash
# Listar contas Instagram
curl http://localhost:8001/api/social/instagram-accounts

# Ver posts
curl http://localhost:8001/api/social/instagram-posts

# Ver insights
curl http://localhost:8001/api/social/instagram-insights
```

---

## ✅ Checklist de Conclusão

- [ ] Acessar App Dashboard
- [ ] Adicionar Instagram Basic Display
- [ ] Adicionar Instagram Graph API
- [ ] Adicionar permissão `instagram_basic`
- [ ] Adicionar permissão `instagram_manage_insights`
- [ ] Adicionar permissão `instagram_content_publish`
- [ ] Adicionar usuários como developers
- [ ] Gerar novo token no Graph API Explorer
- [ ] Testar token no Graph API Explorer
- [ ] Atualizar token no `.env`
- [ ] Reiniciar backend
- [ ] Testar endpoints no B-Studio

---

## 🔗 Links Diretos

| Recurso | URL |
|---------|-----|
| **App Dashboard** | https://developers.facebook.com/apps/883116774139196/dashboard/ |
| **Graph API Explorer** | https://developers.facebook.com/tools/explorer/ |
| **App Review** | https://developers.facebook.com/apps/883116774139196/app-review/ |
| **Roles** | https://developers.facebook.com/apps/883116774139196/roles/ |

---

## ⏱️ Tempo Estimado

- **Configuração do App:** 10-15 minutos
- **Geração do Token:** 5 minutos
- **Testes:** 5 minutos
- **Total:** 20-25 minutos

---

## 🆘 Solução de Problemas

### Erro: "Application does not have permission"

**Causa:** Permissões não configuradas no app

**Solução:**
1. Volte ao Passo 3
2. Adicione todas as permissões listadas
3. Gere novo token

### Erro: "User is not authorized"

**Causa:** Usuário não está como developer/admin do app

**Solução:**
1. Volte ao Passo 4
2. Adicione seu usuário como Developer
3. Aceite o convite no Facebook

### Erro: "Instagram Business Account not found"

**Causa:** Instagram não está conectado à Página do Facebook

**Solução:**
1. Acesse a página no Facebook
2. Configurações → Instagram
3. Conecte a conta do Instagram

---

**Próxima ação:** Comece pelo Passo 1 e me avise quando encontrar alguma dificuldade!

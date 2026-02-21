# 📸 Guia Definitivo: Conectar Instagram no B-Studio

**Data:** 21 de Fevereiro de 2026  
**Tempo estimado:** 10-15 minutos

---

## 🎯 Objetivo

Configurar o acesso ao Instagram para que o B-Studio possa:
- ✅ Postar no Instagram automaticamente
- ✅ Ler métricas e insights do Instagram
- ✅ Criar anúncios no Instagram
- ✅ Agendar stories e posts

---

## 📋 Pré-requisitos

1. Ter uma conta do Instagram **Business** ou **Creator**
2. Ser **administrador** de pelo menos uma Página do Facebook
3. Ter o app **Bia Internal** criado no Facebook Developers

---

## 🔧 Passo a Passo Completo

### **PASSO 1: Conectar Instagram à Página do Facebook**

#### Opção A: Pelo Facebook (Desktop) - RECOMENDADO

1. **Acesse:** https://www.facebook.com/pages/

2. **Selecione a página** que deseja conectar:
   - Bianconi Estratégia& Marketing
   - Home Care Iguassu
   - Raquel Lopes - Estética
   - (Ou qualquer outra das suas 17 páginas)

3. **No menu da página**, clique em:
   - **Configurações** → **Instagram**

4. **Clique em:**
   - **"Conectar Conta do Instagram"**

5. **Faça login no Instagram:**
   - Digite seu usuário e senha do Instagram
   - Autorize a conexão

6. **Repita** para cada página que deseja conectar

#### Opção B: Pelo Instagram (Celular)

1. **Abra o Instagram** no celular

2. **Vá em:**
   - Perfil → Menu (☰) → **Configurações**

3. **Toque em:**
   - **Conta** → **Compartilhar em outros apps**

4. **Selecione:**
   - **Facebook**

5. **Escolha a página** do Facebook

6. **Repita** para cada conta do Instagram

---

### **PASSO 2: Verificar Conexão**

Depois de conectar, verifique se funcionou:

1. **Acesse:** https://www.facebook.com/pages/
2. **Selecione a página**
3. **Vá em:** Configurações → Instagram
4. **Deve aparecer:** "Conta do Instagram conectada: @seu_usuario"

---

### **PASSO 3: Gerar Token com Permissões do Instagram**

1. **Acesse o Graph API Explorer:**
   ```
   https://developers.facebook.com/tools/explorer/
   ```

2. **Selecione o App:**
   - Clique no dropdown "Application" (topo da página)
   - Digite: "Bia Internal"
   - Selecione: **Bia Internal (ID: 883116774139196)**

3. **Clique em "Generate Access Token":**
   - Um popup vai aparecer
   - Faça login no Facebook se necessário

4. **Marque TODAS estas permissões:**

   | Permissão | Obrigatória | O que faz |
   |-----------|-------------|-----------|
   | `instagram_basic` | ✅ | Lê dados básicos do Instagram |
   | `instagram_manage_insights` | ✅ | Lê métricas do Instagram |
   | `pages_show_list` | ✅ | Lista páginas do Facebook |
   | `pages_read_engagement` | ✅ | Lê engajamento das páginas |
   | `read_insights` | ✅ | Lê analytics |
   | `business_management` | ✅ | Gerencia Business Manager |
   | `ads_management` | ✅ | Cria anúncios |
   | `ads_read` | ✅ | Lê dados de anúncios |

5. **Clique em "Generate Token"**

6. **Copie o token gerado:**
   - Será um texto LONGO começando com `EAAM...`
   - Clique no ícone de 📋 (copiar)
   - **Guarde em um local seguro!**

---

### **PASSO 4: Testar o Token**

Com o token copiado, teste se está funcionando:

```bash
# Substitua SEU_TOKEN_AQUI pelo token copiado
curl -s "https://graph.facebook.com/v22.0/me/accounts?fields=instagram_business_account{id,username,name}&access_token=SEU_TOKEN_AQUI"
```

**Resultado esperado:**

```json
{
  "data": [
    {
      "id": "584995248032729",
      "name": "Bianconi Estratégia& Marketing",
      "instagram_business_account": {
        "id": "17841400000000000",
        "username": "bianconi_marketing",
        "name": "Bianconi Marketing"
      }
    }
  ]
}
```

Se aparecer `instagram_business_account`, **FUNCIONOU!** 🎉

---

### **PASSO 5: Salvar Token no B-Studio**

1. **Abra o arquivo:**
   ```
   /Volumes/SSD Externo/repositórios/b-studio/backend/.env
   ```

2. **Localize estas linhas:**
   ```env
   FACEBOOK_ACCESS_TOKEN=...
   META_ACCESS_TOKEN=...
   ```

3. **Substitua pelo NOVO token:**
   ```env
   FACEBOOK_ACCESS_TOKEN=EAAMjMKWeJTwBQ... (token completo)
   META_ACCESS_TOKEN=EAAMjMKWeJTwBQ... (mesmo token)
   ```

4. **Salve o arquivo**

---

### **PASSO 6: Reiniciar o Backend**

```bash
# Pare o backend atual (Ctrl+C ou mate o processo)
kill <PID_DO_BACKEND>

# Reinicie
cd /Volumes/SSD\ Externo/repositórios/b-studio/backend
source venv/bin/activate
uvicorn main:app --reload --port 8001
```

---

### **PASSO 7: Testar no B-Studio**

```bash
# Testar contas do Instagram
curl http://localhost:8001/api/social/instagram-accounts

# Testar posts do Instagram
curl http://localhost:8001/api/social/instagram-posts

# Testar insights do Instagram
curl http://localhost:8001/api/social/instagram-insights
```

---

## 🎉 Sucesso!

Se os comandos acima retornarem dados do Instagram, **está tudo configurado!**

---

## ❌ Solução de Problemas

### Erro: "Instagram Business Account not found"

**Causa:** Instagram não está conectado à Página do Facebook

**Solução:**
1. Volte ao PASSO 1
2. Conecte o Instagram à página
3. Certifique-se de usar Instagram **Business** ou **Creator**

---

### Erro: "Invalid OAuth access token"

**Causa:** Token expirado ou inválido

**Solução:**
1. Volte ao PASSO 3
2. Gere um NOVO token
3. Atualize no arquivo `.env`

---

### Erro: "Missing permissions"

**Causa:** Token não tem permissões do Instagram

**Solução:**
1. Volte ao PASSO 3
2. Marque TODAS as permissões listadas
3. Gere novo token

---

### Erro: "Account not an Instagram Business account"

**Causa:** Instagram é conta pessoal

**Solução:**
1. No Instagram, vá em **Configurações**
2. **Conta** → **Mudar para conta profissional**
3. Selecione **Business** ou **Creator**
4. Volte ao PASSO 1

---

## 📞 Links Úteis

| Recurso | URL |
|---------|-----|
| **Graph API Explorer** | https://developers.facebook.com/tools/explorer/ |
| **Facebook Pages** | https://www.facebook.com/pages/ |
| **Instagram API Docs** | https://developers.facebook.com/docs/instagram-api |
| **Meta Ads Manager** | https://www.facebook.com/adsmanager/ |

---

## 📊 Status Atual

| Item | Status |
|------|--------|
| **Facebook Pages** | ✅ 17 páginas |
| **Instagram Conectado** | ❌ 0 contas |
| **Token com permissões IG** | ❌ Não |
| **App Bia Internal** | ✅ Criado |

---

## ✅ Checklist Final

- [ ] Conectar Instagram a pelo menos 1 página do Facebook
- [ ] Gerar token com permissões `instagram_basic` e `instagram_manage_insights`
- [ ] Salvar token no arquivo `backend/.env`
- [ ] Reiniciar backend
- [ ] Testar endpoint `/api/social/instagram-accounts`

---

**Última atualização:** 2026-02-21  
**Documento:** `/Volumes/SSD Externo/repositórios/b-studio/docs/GUIA_INSTAGRAM.md`

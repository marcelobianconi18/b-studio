# 🔄 Token Atualizado para Instagram

**Data:** 21 de Fevereiro de 2026  
**Status:** Instagram @bianconimkt conectado à página Bianconi Estratégia& Marketing

---

## ✅ Instagram Conectado!

A página **Bianconi Estratégia& Marketing** agora tem Instagram conectado:
- **Facebook:** Bianconi Estratégia& Marketing (ID: 584995248032729)
- **Instagram:** @bianconimkt

---

## 🔑 Próximo Passo: Gerar Novo Token

O token atual foi gerado **antes** da conexão do Instagram. Para acessar os dados do Instagram, você precisa gerar um **novo token** com as permissões atualizadas.

### **Instruções Rápidas:**

1. **Acesse:** https://developers.facebook.com/tools/explorer/

2. **Selecione o App:** "Bia Internal" (ID: 883116774139196)

3. **Clique em:** "Generate Access Token"

4. **Marque TODAS estas permissões:**
   ```
   ✅ instagram_basic
   ✅ instagram_manage_insights
   ✅ pages_show_list
   ✅ pages_read_engagement
   ✅ read_insights
   ✅ business_management
   ✅ ads_management
   ✅ ads_read
   ```

5. **Copie o NOVO token** (começa com EAAM...)

6. **Me envie o token** que eu atualizo no `.env`

---

## 🧪 Teste Depois de Gerar o Token

```bash
# Substitua SEU_NOVO_TOKEN pelo token gerado
curl -s "https://graph.facebook.com/v22.0/me/accounts?fields=id,name,instagram_business_account{id,username,name}&access_token=SEU_NOVO_TOKEN" | python3 -m json.tool
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
        "username": "bianconimkt",
        "name": "Bianconi | Estratégia & Marketing"
      }
    }
  ]
}
```

---

## 📋 Depois de Atualizar o Token

1. **Salve no backend/.env:**
   ```env
   FACEBOOK_ACCESS_TOKEN=SEU_NOVO_TOKEN
   META_ACCESS_TOKEN=SEU_NOVO_TOKEN
   ```

2. **Reinicie o backend:**
   ```bash
   kill <PID>
   cd /Volumes/SSD\ Externo/repositórios/b-studio/backend
   source venv/bin/activate
   uvicorn main:app --reload --port 8001
   ```

3. **Teste no B-Studio:**
   ```bash
   curl http://localhost:8001/api/social/instagram-accounts
   curl http://localhost:8001/api/social/instagram-posts
   ```

---

## 🎯 Resumo

| Item | Status |
|------|--------|
| Instagram Conectado | ✅ @bianconimkt |
| Página Conectada | ✅ Bianconi Estratégia& Marketing |
| Token Atual | ❌ Sem permissões do Instagram |
| Novo Token Necessário | ⏳ Aguardando geração |

---

**Próxima ação:** Gere o novo token no Graph API Explorer e me envie!

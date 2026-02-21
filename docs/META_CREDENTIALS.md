# 📘 B-Studio - Meta Ads Credentials

**Última atualização:** 21 de Fevereiro de 2026

---

## 🔑 Meta (Facebook) App

| Campo | Valor |
|-------|-------|
| **Nome do App** | Bia Internal |
| **App ID** | `883116774139196` |
| **App Secret** | `ff5a99cc82281bd39090131211120de3` |

---

## 🔐 Access Token

**Token:** 
```
EAAMjMKWeJTwBQZCnScBZClGe6darPgzs8aTt5wbxmPmwHZARdr6UNacCx2a1eqCGqM0UZCJpxHgKvpUxZB19XnVmUhY0MwSgGE5YvqpyZACDH0oYMW0ZA0jYrcELsTUPRZCkcGKUCGWjWOZA0htxFIJ3d2b8EnqfImNGzzL0DZBKnZBAlQf106MR0VEBJaCo6t5KRaw
```

**Tipo:** Long-lived token (60 dias de validade)  
**Última atualização:** 2026-02-21  
**Permissões:** business_management, pages_show_list, read_insights, instagram_basic

---

## 📊 Ad Account

**ID:** `act_205746393557583`  
**URL:** https://www.facebook.com/adsmanager/manage/campaigns?act=205746393557583

---

## 🌐 Pipeboard (Alternative Auth)

**API Token:** `pk_8d419db95ee54af0a873fe187620e5e3`  
**MCP URL:** `https://mcp.pipeboard.co/meta-ads-mcp?token=pk_8d419db95ee54af0a873fe187620e5e3`

---

## 🧪 Testes

### Testar conexão com a API:
```bash
cd /Volumes/SSD\ Externo/repositórios/b-studio/backend
source venv/bin/activate

# Test 1: Health check
curl http://localhost:8001/health

# Test 2: List campaigns
curl http://localhost:8001/api/ads/campaigns

# Test 3: List ad accounts
curl http://localhost:8001/api/ads/accounts
```

### Testar autenticação:
```bash
python test_pb_auth.py
```

---

## 📁 Arquivos de Configuração

### Backend `.env`:
Local: `/Volumes/SSD Externo/repositórios/b-studio/backend/.env`

```env
META_APP_ID=883116774139196
META_APP_SECRET=ff5a99cc82281bd39090131211120de3
META_ACCESS_TOKEN=EAAMjMKWeJTwBQ5q5imuC6unzcInZCDcfLjsXzEzTfz8fdCa64GG1fn5J5tCFjEuZBBEZBzi0uMVr59wZALtIYgQSCytWMxqYG7cajH74fe6UhSPpMZBc0yStOv7fakWsk9CMEBy6qJZBIIhe8IjzF0khlYGpeP8CivEqM7GpFfbZAk1pH3zLv0cTFBZCzf7GRo8GDVfIBC4yPWEnzUSbU28cnFyjL5mQZC8XylkiCG1vAHJ02b9OeMtKqcP1hkpPGf5w4ZCXxQNKDsDw4ZD
META_AD_ACCOUNT_ID=act_205746393557583
```

### Frontend `.env.local`:
Local: `/Volumes/SSD Externo/repositórios/b-studio/frontend/.env.local`

```env
NEXT_PUBLIC_PIPEBOARD_API_TOKEN=pk_8d419db95ee54af0a873fe187620e5e3
NEXT_PUBLIC_API_URL=http://localhost:8001
```

---

## 🔄 Renovação de Token

Os tokens do Facebook expiram em **60 dias**. Para renovar:

1. Acesse: https://developers.facebook.com/tools/explorer/
2. Selecione o app **Bia Internal**
3. Clique em **Generate Access Token**
4. Substitua no arquivo `.env`
5. Reinicie o backend

---

## 🔒 Segurança

⚠️ **IMPORTANTE:** Nunca compartilhe estes arquivos ou faça commit no Git!

- `.env` está no `.gitignore`
- Mantenha as credenciais em segredo
- Use Pipeboard para produção (gerencia renovação automática)

---

## 📞 Links Úteis

| Recurso | URL |
|---------|-----|
| **Meta App Dashboard** | https://developers.facebook.com/apps/883116774139196/ |
| **Graph API Explorer** | https://developers.facebook.com/tools/explorer/ |
| **Ads Manager** | https://www.facebook.com/adsmanager/manage/campaigns?act=205746393557583 |
| **Pipeboard** | https://pipeboard.co |
| **Meta API Docs** | https://developers.facebook.com/docs/marketing-api |

---

## ✅ Status

- [x] App Meta criado
- [x] Access Token gerado
- [x] Ad Account configurado
- [x] Backend `.env` atualizado
- [x] Frontend `.env.local` criado
- [x] Testes de conexão realizados

**Último teste:** 2026-02-21  
**Status:** ✅ Funcionando

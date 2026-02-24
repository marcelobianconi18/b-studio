# 🔧 Modo de Testes - Multi-Contas B-Studio

## 📋 Visão Geral

O B-Studio agora suporta **múltiplas contas** para testes e desenvolvimento. Você pode alternar entre diferentes:
- Facebook Pages
- Instagram Accounts
- Ad Accounts

---

## 🎯 **Como Funciona**

### **Padrão (Produção)**
- Usa `FACEBOOK_PAGE_ID` do `.env`
- Automático, sem configuração necessária

### **Modo de Testes**
- Permite selecionar qualquer conta disponível
- Via parâmetros na URL
- Via componente UI `AccountSelector`

---

## 🚀 **Como Usar**

### **Opção 1: Via URL (Rápido)**

#### **Facebook Insights:**
```bash
# Usando conta padrão (.env)
https://bia.bianconimkt.com/social/insights?platform=facebook

# Usando conta específica
https://bia.bianconimkt.com/social/insights?platform=facebook&page_id=416436651784721
```

#### **Instagram Insights:**
```bash
# Auto-detectar Instagram da página
https://bia.bianconimkt.com/social/insights?platform=instagram&page_id=416436651784721

# Instagram específico
https://bia.bianconimkt.com/social/insights?platform=instagram&instagram_id=17841407100278860
```

#### **Meta Ads Insights:**
```bash
# Usando conta de anúncios específica
https://bia.bianconimkt.com/social/insights?platform=ads&page_id=416436651784721&ad_account_id=act_205746393557583
```

---

### **Opção 2: Via UI (AccountSelector)**

Adicione o componente na página:

```tsx
import AccountSelector from "@/components/social/AccountSelector";

function SocialInsightsPage() {
    const [selectedPageId, setSelectedPageId] = useState<string>();
    const [selectedInstagramId, setSelectedInstagramId] = useState<string>();

    const handleAccountSelect = (pageId: string, instagramId?: string) => {
        setSelectedPageId(pageId);
        if (instagramId) setSelectedInstagramId(instagramId);
    };

    return (
        <div>
            {/* Seletor de Contas */}
            <AccountSelector 
                onAccountSelect={handleAccountSelect}
                selectedPageId={selectedPageId}
                selectedInstagramId={selectedInstagramId}
            />

            {/* Insights da conta selecionada */}
            <SocialInsights 
                page_id={selectedPageId}
                instagram_id={selectedInstagramId}
            />
        </div>
    );
}
```

---

## 📊 **API Endpoints**

### **1. Listar Contas Disponíveis**

```http
GET /api/social/accounts
```

**Resposta:**
```json
{
    "facebook_pages": [
        {
            "id": "416436651784721",
            "name": "Professor Lemos",
            "username": "professorlemos",
            "followers": 135987,
            "has_instagram": true,
            "instagram_id": "17841407100278860"
        },
        // ... mais 16 páginas
    ],
    "instagram_accounts": [
        {
            "id": "17841407100278860",
            "username": "professorlemos",
            "name": "José Rodrigues Lemos",
            "followers": 19263,
            "page_id": "416436651784721",
            "page_name": "Professor Lemos"
        },
        // ... mais 8 instagrams
    ],
    "ad_accounts": [
        {
            "id": "act_205746393557583",
            "name": "Conta de Anúncios 1",
            "status": 1
        },
        // ... mais contas
    ],
    "total": {
        "facebook_pages": 17,
        "instagram_accounts": 9,
        "ad_accounts": 10
    }
}
```

---

### **2. Obter Insights (com seleção de conta)**

```http
GET /api/social/insights?platform=facebook&page_id={page_id}
GET /api/social/insights?platform=instagram&instagram_id={instagram_id}
```

**Parâmetros:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `platform` | string | ✅ Sim | `facebook`, `instagram`, ou `ads` |
| `period` | string | ❌ Não | `7d`, `14d`, `30d`, `90d` (padrão: `30d`) |
| `page_id` | string | ❌ Não | Facebook Page ID (usa .env se não fornecer) |
| `instagram_id` | string | ❌ Não | Instagram Business Account ID |

---

## 📱 **Contas Disponíveis (Exemplo)**

### **Facebook Pages (17):**
1. Professor Lemos (135,987 seguidores) ✅ Instagram
2. GoodWork Consultoria de RH ✅ Instagram
3. Bianconi Estratégia& Marketing ✅ Instagram
4. Sr.Bollo ✅ Instagram
5. Guaíra Box Express ✅ Instagram
6. Cometa Network ✅ Instagram
7. ... (mais 11)

### **Instagram Accounts (9):**
1. @professorlemos (19,263 seguidores)
2. @goodwork.rh (748 seguidores)
3. @senhor.bollo (813 seguidores)
4. @guairaboxexpress (312 seguidores)
5. @cometanetwork (285 seguidores)
6. @bianconimkt (2 seguidores)
7. ... (mais 3)

### **Ad Accounts (10+):**
1. act_205746393557583
2. act_2108227609269354
3. act_476013293022191
4. ... (mais 7)

---

## 🧪 **Casos de Uso**

### **Caso 1: Testar Diferentes Clientes**

```bash
# Ver insights do Professor Lemos
GET /api/social/insights?platform=instagram&page_id=416436651784721

# Ver insights da GoodWork RH
GET /api/social/insights?platform=instagram&page_id=110515578092294

# Ver insights do Sr.Bollo
GET /api/social/insights?platform=instagram&page_id=108320035526141
```

### **Caso 2: Comparar Performance**

```javascript
// Comparar Instagram de diferentes contas
const accounts = [
    { page_id: '416436651784721', name: 'Professor Lemos' },
    { page_id: '110515578092294', name: 'GoodWork RH' },
    { page_id: '108320035526141', name: 'Sr.Bollo' },
];

for (const account of accounts) {
    const insights = await fetch(
        `/api/social/insights?platform=instagram&page_id=${account.page_id}`
    );
    // Analisar dados...
}
```

### **Caso 3: Dashboard Multi-Cliente**

```tsx
// Dashboard que mostra todos os clientes
function MultiClientDashboard() {
    const [accounts, setAccounts] = useState([]);
    
    useEffect(() => {
        // Buscar todas as contas
        fetch('/api/social/accounts')
            .then(r => r.json())
            .then(setAccounts);
    }, []);
    
    return (
        <div>
            {accounts.facebook_pages.map(page => (
                <ClientCard 
                    key={page.id}
                    page={page}
                    insightsUrl={`/api/social/insights?platform=instagram&page_id=${page.id}`}
                />
            ))}
        </div>
    );
}
```

---

## 🔐 **Permissões Necessárias**

O token no `.env` precisa ter:

```
✅ pages_show_list
✅ pages_read_engagement
✅ instagram_basic
✅ instagram_manage_insights
✅ ads_read
✅ business_management
```

---

## 🛠️ **Scripts Úteis**

### **Listar Contas (CLI)**

```bash
cd backend
python3 get_available_accounts.py
```

**Saída:**
```
================================================================================
CONTAS DISPONÍVEIS PARA SELEÇÃO
================================================================================

📘 PÁGINAS FACEBOOK:
--------------------------------------------------------------------------------
   📷 Professor Lemos (416436651784721)
      Followers: 135,987
      Instagram ID: 17841407100278860
   📷 GoodWork Consultoria de RH (110515578092294)
      Followers: ...
   ...

📊 CONTAS DE ANÚNCIOS:
--------------------------------------------------------------------------------
   ✅ Conta de Anúncios 1 (act_205746393557583)
   ...

📷 INSTAGRAM DETAILS:
--------------------------------------------------------------------------------
   📷 @professorlemos (17841407100278860)
      Name: José Rodrigues Lemos
      Followers: 19,263
      Linked to: Professor Lemos (416436651784721)
   ...

💾 Dados salvos em: available_accounts.json
```

---

## 📝 **Exemplos de Código**

### **React/Next.js**

```tsx
// Hook para buscar insights de uma conta
function useInsights(platform: string, pageId?: string, instagramId?: string) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const params = new URLSearchParams({ platform });
        if (pageId) params.set('page_id', pageId);
        if (instagramId) params.set('instagram_id', instagramId);
        
        fetch(`/api/social/insights?${params}`)
            .then(r => r.json())
            .then(setData)
            .finally(() => setLoading(false));
    }, [platform, pageId, instagramId]);
    
    return { data, loading };
}

// Uso
const { data, loading } = useInsights('instagram', '416436651784721');
```

### **Python**

```python
import requests

# Listar contas
accounts = requests.get('http://localhost:8001/api/social/accounts').json()

# Ver insights de uma conta específica
insights = requests.get(
    'http://localhost:8001/api/social/insights',
    params={
        'platform': 'instagram',
        'page_id': '416436651784721'
    }
).json()

print(f"Seguidores: {insights['page_followers']['value']}")
```

---

## 🎯 **Próximos Passos (Roadmap)**

- [ ] Integração com sistema de usuários (cada usuário vê suas contas)
- [ ] Salvar contas favoritas
- [ ] Comparar múltiplas contas lado a lado
- [ ] Exportar relatórios por conta
- [ ] Agendar posts para diferentes contas

---

## ❓ **FAQ**

### **Q: Posso usar em produção?**
R: Sim! O modo padrão (sem parâmetros) usa a conta do `.env`. O modo de testes é opcional.

### **Q: Quantas contas posso ter?**
R: Ilimitado! O sistema lista todas as contas que o token tem acesso.

### **Q: Preciso de permissões especiais?**
R: Sim, o token precisa de `pages_show_list`, `instagram_basic`, e `ads_read`.

### **Q: Funciona para múltiplos usuários?**
R: Atualmente todos usam o mesmo token. Em breve, cada usuário conectará suas próprias contas.

---

## 📚 **Links Úteis**

- [Facebook Graph API Docs](https://developers.facebook.com/docs/graph-api)
- [Instagram Insights API](https://developers.facebook.com/docs/instagram-api/reference/insights)
- [Meta Ads Insights](https://developers.facebook.com/docs/marketing-api/insights)

---

**Criado em:** 24 de Fevereiro de 2026  
**Versão:** 1.0.0  
**Manutenção:** Equipe B-Studio

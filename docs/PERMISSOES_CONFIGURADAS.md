# 📋 Permissões do App Facebook - B-Studio

**App ID:** 883116774139196  
**App Name:** Bia Internal  
**Data:** 24 de Fevereiro de 2026

---

## ✅ **PERMISSÕES JÁ CONFIGURADAS NO CÓDIGO**

### **Backend (`backend/app/services/meta_engine/auth.py`)**

```python
AUTH_SCOPE = "business_management,public_profile,pages_show_list,pages_read_engagement,read_insights,instagram_basic,instagram_manage_insights"
```

| Permissão | Status | Para que serve |
|-----------|--------|----------------|
| `business_management` | ✅ No código | Gerenciar Business Manager |
| `public_profile` | ✅ No código | Perfil público do usuário |
| `pages_show_list` | ✅ No código | Listar páginas gerenciadas |
| `pages_read_engagement` | ✅ No código | Ler engajamento das páginas |
| `read_insights` | ✅ No código | Ler insights (métricas) |
| `instagram_basic` | ✅ No código | Dados básicos do Instagram |
| `instagram_manage_insights` | ✅ No código | **Insights detalhados do Instagram** |

---

### **Frontend (`frontend/app/login/page.tsx`)**

```typescript
scope: "public_profile,email,ads_management,ads_read,pages_manage_posts,pages_read_engagement,business_management"
```

| Permissão | Status | Para que serve |
|-----------|--------|----------------|
| `public_profile` | ✅ No código | Perfil do usuário |
| `email` | ✅ No código | Email do usuário |
| `ads_management` | ✅ No código | Criar/gerenciar anúncios |
| `ads_read` | ✅ No código | Ler dados de anúncios |
| `pages_manage_posts` | ✅ No código | Publicar nas páginas |
| `pages_read_engagement` | ✅ No código | Ler engajamento |
| `business_management` | ✅ No código | Business Manager |

---

### **Auth Router (`backend/app/routers/auth.py`)**

```python
scope = "ads_management,ads_read,business_management,instagram_basic,instagram_manage_comments,instagram_content_publish,pages_show_list,pages_read_engagement,pages_manage_metadata,pages_manage_ads,public_profile"
```

| Permissão | Status | Para que serve |
|-----------|--------|----------------|
| `ads_management` | ✅ No código | Criar anúncios |
| `ads_read` | ✅ No código | Ler anúncios |
| `business_management` | ✅ No código | Business Manager |
| `instagram_basic` | ✅ No código | Instagram básico |
| `instagram_manage_comments` | ✅ No código | Gerenciar comentários |
| `instagram_content_publish` | ✅ No código | Publicar no Instagram |
| `pages_show_list` | ✅ No código | Listar páginas |
| `pages_read_engagement` | ✅ No código | Ler engajamento |
| `pages_manage_metadata` | ✅ No código | Gerenciar metadados |
| `pages_manage_ads` | ✅ No código | Gerenciar anúncios das páginas |
| `public_profile` | ✅ No código | Perfil público |

---

## 📊 **RESUMO CONSOLIDADO**

### **Permissões PARA O QUE PRECISAMOS:**

| Categoria | Permissão | Backend | Frontend | Auth Router | Necessária? |
|-----------|-----------|---------|----------|-------------|-------------|
| **Básicas** | `public_profile` | ✅ | ✅ | ✅ | ✅ Sim |
| **Básicas** | `email` | ❌ | ✅ | ❌ | ✅ Sim |
| **Básicas** | `business_management` | ✅ | ✅ | ✅ | ✅ Sim |
| **Páginas** | `pages_show_list` | ✅ | ❌ | ✅ | ✅ Sim |
| **Páginas** | `pages_read_engagement` | ✅ | ✅ | ✅ | ✅ Sim |
| **Páginas** | `pages_manage_posts` | ❌ | ✅ | ❌ | ⚠️ Opcional |
| **Páginas** | `pages_manage_metadata` | ❌ | ❌ | ✅ | ⚠️ Opcional |
| **Páginas** | `pages_manage_ads` | ❌ | ❌ | ✅ | ⚠️ Opcional |
| **Instagram** | `instagram_basic` | ✅ | ❌ | ✅ | ✅ Sim |
| **Instagram** | `instagram_manage_insights` | ✅ | ❌ | ❌ | ✅ **SIM!** |
| **Instagram** | `instagram_manage_comments` | ❌ | ❌ | ✅ | ⚠️ Opcional |
| **Instagram** | `instagram_content_publish` | ❌ | ❌ | ✅ | ⚠️ Opcional |
| **Anúncios** | `ads_management` | ❌ | ✅ | ✅ | ✅ Sim |
| **Anúncios** | `ads_read` | ❌ | ✅ | ✅ | ✅ Sim |
| **Insights** | `read_insights` | ✅ | ❌ | ❌ | ✅ Sim |

---

## 🎯 **PERMISSÕES CRÍTICAS PARA INSIGHTS**

### **Para Instagram Insights (O QUE QUEREMOS):**

| Permissão | Status | Onde está |
|-----------|--------|-----------|
| `instagram_basic` | ✅ Configurada | Backend + Auth Router |
| `instagram_manage_insights` | ✅ Configurada | **Apenas no Backend** |

### **Para Facebook Page Insights:**

| Permissão | Status | Onde está |
|-----------|--------|-----------|
| `pages_read_engagement` | ✅ Configurada | Backend + Frontend + Auth Router |
| `read_insights` | ✅ Configurada | Apenas no Backend |

### **Para Ads Insights:**

| Permissão | Status | Onde está |
|-----------|--------|-----------|
| `ads_read` | ✅ Configurada | Frontend + Auth Router |
| `ads_management` | ✅ Configurada | Frontend + Auth Router |

---

## ⚠️ **INCONSISTÊNCIAS ENCONTRADAS**

### **1. `instagram_manage_insights` NÃO está no Frontend**

**Problema:** O login pelo frontend não solicita esta permissão.

**Solução:** Adicionar ao scope do frontend:

```typescript
// frontend/app/login/page.tsx - Linha ~124
scope: "public_profile,email,ads_management,ads_read,pages_manage_posts,pages_read_engagement,business_management,instagram_basic,instagram_manage_insights,read_insights"
```

---

### **2. `read_insights` NÃO está no Frontend**

**Problema:** Necessária para ler insights detalhados.

**Solução:** Adicionar ao scope do frontend (mesma linha acima).

---

### **3. `instagram_basic` NÃO está no Frontend**

**Problema:** Necessária para dados básicos do Instagram.

**Solução:** Adicionar ao scope do frontend (mesma linha acima).

---

## ✅ **O QUE FAZER AGORA**

### **Passo 1: Atualizar Frontend**

Editar `frontend/app/login/page.tsx`:

```typescript
scope: "public_profile,email,ads_management,ads_read,pages_manage_posts,pages_read_engagement,business_management,instagram_basic,instagram_manage_insights,read_insights"
```

### **Passo 2: Verificar no Facebook Developer**

Acesse: https://developers.facebook.com/apps/883116774139196/app-review/permissions-and-features/

**Verifique se estas permissões estão:**
- [ ] `instagram_basic` - Adicionada
- [ ] `instagram_manage_insights` - Adicionada
- [ ] `pages_read_engagement` - Adicionada
- [ ] `read_insights` - Adicionada
- [ ] `ads_read` - Adicionada
- [ ] `ads_management` - Adicionada

### **Passo 3: Submeter para Review**

Se alguma permissão estiver como "Not Added":
1. Clique em "Add Permissions and Features"
2. Adicione as faltantes
3. Preencha descrição de uso
4. Submeta para review

---

## 📝 **DESCRIÇÃO PARA REVIEW (Copiar e Colar)**

**Para `instagram_manage_insights`:**

```
B-Studio uses instagram_manage_insights to provide analytics and performance 
metrics for Instagram Business accounts managed by our marketing agency.

Our team manages multiple client Instagram accounts (including @professorlemos) 
and needs access to:
- Follower count and growth trends
- Post impressions and reach
- Profile views and engagement metrics
- Content performance analytics

This data is displayed in our internal dashboard to help optimize content 
strategy and report results to clients.

Only authorized team members (admins of the app) have access to this data.
We do not share or sell any Instagram data to third parties.
```

**Para `pages_read_engagement`:**

```
B-Studio uses pages_read_engagement to analyze the performance of Facebook 
Pages we manage for our clients.

We need this permission to:
- Track post engagement (reactions, comments, shares)
- Measure reach and impressions
- Analyze audience demographics
- Generate performance reports

This is used internally by our marketing agency team only.
```

**Para `read_insights`:**

```
B-Studio uses read_insights to access analytics data for Facebook Pages 
and Instagram accounts we manage.

We use this data to:
- Display metrics in our internal dashboard
- Create performance reports for clients
- Optimize content strategy based on data
- Track growth over time

Data is only accessible to authorized team members.
```

---

## 🎯 **CHECKLIST FINAL**

- [ ] Atualizar scope no frontend (`login/page.tsx`)
- [ ] Verificar permissões no Facebook Developer
- [ ] Adicionar permissões faltantes (se houver)
- [ ] Preencher descrições de uso
- [ ] Gravar vídeo de demonstração
- [ ] Submeter para review
- [ ] Aguardar aprovação (2-7 dias)
- [ ] Após aprovado: testar insights

---

## 📊 **STATUS ATUAL**

| Permissão | No Código | No Facebook | Review Needed? |
|-----------|-----------|-------------|----------------|
| `instagram_basic` | ✅ | ⚠️ Verificar | ✅ Sim |
| `instagram_manage_insights` | ✅ | ⚠️ Verificar | ✅ Sim |
| `pages_read_engagement` | ✅ | ⚠️ Verificar | ✅ Sim |
| `read_insights` | ✅ | ⚠️ Verificar | ✅ Sim |
| `ads_read` | ✅ | ⚠️ Verificar | ✅ Sim |
| `ads_management` | ✅ | ⚠️ Verificar | ✅ Sim |

**⚠️ = Precisa verificar no Facebook Developer Dashboard**

---

**Próxima ação:** Verificar no Facebook Developer quais permissões já estão aprovadas! 🔍

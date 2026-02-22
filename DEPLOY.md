# Deploy no Coolify com Domínio Personalizado (Hostinger)

## Pré-requisitos
- VPS rodando Coolify
- Domínio configurado na Hostinger
- Docker e Docker Compose instalados na VPS

---

## 1. Configurar DNS na Hostinger

No painel da Hostinger, aponte o domínio para sua VPS:

| Tipo | Nome | Valor | TTL |
|------|------|-------|-----|
| A | @ | `<IP da sua VPS>` | Automático |
| A | www | `<IP da sua VPS>` | Automático |

---

## 2. Configurar no Coolify

### 2.1 Adicionar o Projeto
1. No Coolify, clique em **Add New** → **Application**
2. Selecione o repositório do b-studio
3. Escolha **Docker Compose** como tipo de build

### 2.2 Configurar Domínio
1. Vá em **Settings → Domains**
2. Adicione: `seudominio.com` e `www.seudominio.com`
3. O Coolify vai configurar automaticamente o SSL (Let's Encrypt)

### 2.3 Variáveis de Ambiente
No Coolify, adicione as variáveis do `.env.example`:
```
FACEBOOK_ACCESS_TOKEN=seu_token
FACEBOOK_PAGE_ID=sua_page_id
NEXT_PUBLIC_API_URL=http://localhost:8001
```

---

## 3. Atualizar nginx.conf

Edite o arquivo `nginx.conf` e substitua pelo seu domínio:

```nginx
server_name bia.bianconimkt.com;
```

---

## 4. SSL/HTTPS

O Coolify gerencia SSL automaticamente via Let's Encrypt.

Se precisar configurar manualmente no nginx:

```nginx
# HTTPS
server {
    listen 443 ssl http2;
    server_name seudominio.com www.seudominio.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # ... resto da configuração
}
```

---

## 5. Deploy Local (Testes)

```bash
# Copiar .env.example para .env
cp .env.example .env

# Editar .env com suas credenciais

# Subir todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar
docker-compose down
```

---

## 6. Estrutura de Serviços

| Serviço | Porta | Descrição |
|---------|-------|-----------|
| nginx | 80/443 | Reverse proxy |
| frontend | 3000 | Next.js (interno) |
| backend | 8001 | FastAPI (interno) |
| worker | - | Celery worker |
| redis | 6379 | Cache/Queue (interno) |

---

## 7. Troubleshooting

### Verificar logs
```bash
docker-compose logs frontend
docker-compose logs backend
docker-compose logs nginx
```

### Reiniciar serviços
```bash
docker-compose restart
```

### Rebuild
```bash
docker-compose up -d --build
```

---

## 8. Como Funciona em Outros Projetos

Se você já usa esse padrão em outro projeto, o processo é o mesmo:

1. **DNS** → Aponta domínio para IP da VPS
2. **Coolify** → Gerencia deploy, SSL e reverse proxy
3. **Docker Compose** → Orquestra os containers
4. **Nginx** → Distribui requisições (frontend/backend)

A única diferença é o domínio e as variáveis de ambiente específicas de cada projeto.

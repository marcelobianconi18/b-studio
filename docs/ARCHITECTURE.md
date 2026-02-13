# B-Studio Architecture
**O "Braço Executor" da Bia**

Este projeto (B-Studio) é responsável pela **execução e gestão** de campanhas de marketing, enquanto a Bia (BiageoFinal) cuida da **inteligência e estratégia**.

## 1. Visão Geral
O B-Studio consome a API da Bia para obter dados de público, criativos e estratégia, e utiliza suas próprias APIs integradas (Meta, Google) para agendar e publicar conteúdo.

## 2. Estrutura de Diretórios
- `backend/`: API FastAPI focada em agendamento, filas (Celery) e gestão de anúncios.
- `frontend/`: Interface Next.js focada em Calendário, Kanban e Dashboards de Performance.

## 3. Fluxo de Integração (O "Cérebro" e o "Músculo")

### A. Criação de Post (Fluxo "Criativo")
1.  **Usuário (B-Studio):** Clica em "Novo Post com IA".
2.  **B-Studio (Backend):** Chama `BiageoFinal/api/v1/briefing/{id}/strategy` para pegar:
    *   Persona (Tom de voz)
    *   Dores/Desejos do público
    *   Melhores horários (já calculados pela Bia)
3.  **B-Studio (AI):** Gera 3 opções de Copy + 3 opções de Imagem.
4.  **Usuário:** Aprova opção B.
5.  **B-Studio (Scheduler):** Agenda para `Sexta-feira, 18:00`.

### B. Criação de Anúncio (Fluxo "Ads Express")
1.  **Usuário (B-Studio):** Seleciona um post já publicado.
2.  **B-Studio (Backend):** Chama `BiageoFinal/api/v1/geo/city/{id}/hotspots` para pegar:
    *   Os 5 melhores bairros (Hotspots validados via OSM/IBGE).
    *   Interesses e Comportamentos (Meta Ads Targeting).
3.  **B-Studio (Ads Manager):** Cria automaticamente a Campanha no Facebook Ads com esses parâmetros exatos.
    *   *Sem necessidade de configurar manualmente no Gerenciador de Negócios.*

## 4. Stack Tecnológico Sugerido
- **Backend:** Python (FastAPI) + Celery (Filas) + Redis (Cache/Broker)
- **Frontend:** Next.js + TailwindCSS + Shadcn/ui (para Calendários e Modais)
- **Banco de Dados:** PostgreSQL (Compartilhado com Bia ou Separado com FK lógica)

## 5. Próximos Passos
1.  Configurar ambiente Python (`venv`, `requirements.txt`).
2.  Configurar ambiente Node (`npm install`).
3.  Criar Models de `Post`, `Schedule`, `Campaign`.
4.  Implementar OAuth com Facebook/Instagram.

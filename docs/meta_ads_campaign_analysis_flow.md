# BStudio - Fluxo de Analise de Campanhas Meta Ads

## Objetivo
Definir um fluxo padrao para o BStudio analisar campanhas encerradas (ou sob demanda), gerar leitura executiva confiavel e destacar:
- Sucessos
- Pontos de atencao
- Proximas acoes

O desenho cobre dois cenarios:
- Campanhas orientadas a receita (vendas, leads com fechamento)
- Campanhas orientadas a impacto e crescimento (influenciadores, politicos, ONGs, sem meta de receita direta)

## Principios de arquitetura
- Fonte de verdade: Meta Marketing API + dados persistidos no backend do BStudio.
- Calculo de metricas: deterministico no backend (nunca no LLM).
- LLM: camada de interpretacao e narrativa baseada em dados calculados.
- Rastreabilidade: toda conclusao exibida precisa apontar para metricas/fatos.
- Hibrido: analise em tempo real sob demanda + consolidacao historica periodica.

## Fluxo operacional (ponta a ponta)
1. Gatilho de analise
- Manual: usuario clica em "Analisar campanha".
- Automatico: campanha entra em `PAUSED`, `ARCHIVED` ou passa de `end_time`.

2. Coleta de dados
- Coleta em nivel `campaign`, `adset` e `ad`.
- Captura `insights` agregados e diarios (`time_increment=1`).
- Captura breakdowns relevantes: `age`, `gender`, `region/country`, `placement`, `device_platform`.

3. Normalizacao e persistencia
- Normaliza em tabelas de fatos (diario e consolidado).
- Salva snapshot final da campanha para comparacao historica.
- Versiona o relatorio para auditoria (ex.: `report_version`).

4. Calculo de KPIs e score
- Backend calcula KPIs universais.
- Backend calcula KPIs por objetivo da campanha.
- Backend gera scores:
- `delivery_score`
- `efficiency_score`
- `goal_score`
- `final_score`

5. Deteccao de sucessos e pontos de atencao
- Regras deterministicas com thresholds fixos + baseline da conta.
- Exemplo: "CTR 32% acima da media da conta" ou "Frequencia > 3.5 com queda de CTR".

6. Camada IA (narrativa)
- Envia para o modelo somente o payload resumido (JSON pequeno).
- IA devolve:
- resumo executivo
- pontos fortes (com evidencia)
- pontos de atencao (com risco)
- acoes recomendadas por prioridade

7. Entrega no dashboard
- Usuario ve cartoes de KPI, score final, insights e recomendacoes.
- Relatorio fica salvo no historico da campanha.

## Campos universais a expor no dashboard
Esses campos servem para qualquer nicho e qualquer objetivo:

### Identificacao da campanha
- `campaign_id`
- `campaign_name`
- `objective`
- `status`
- `start_time`
- `end_time`
- `analyzed_at`

### Entrega e alcance
- `amount_spent`
- `impressions`
- `reach`
- `frequency`
- `cpm`

### Trafego e interesse
- `clicks`
- `link_clicks`
- `outbound_clicks`
- `ctr`
- `cpc`
- `landing_page_views`
- `cost_per_landing_page_view`

### Qualidade e criativo
- `video_3s_views` (quando aplicavel)
- `video_25p_views` (quando aplicavel)
- `video_50p_views` (quando aplicavel)
- `video_95p_views` (quando aplicavel)
- `thruplays` (quando aplicavel)
- `engagement_actions` (reacoes, comentarios, compartilhamentos)
- `save_share_ratio` (quando houver dado)

### Conversao (quando existir evento)
- `leads`
- `cost_per_lead`
- `qualified_leads` (via CRM, quando integrado)
- `purchases` (quando aplicavel)
- `cost_per_purchase` (quando aplicavel)
- `conversion_rate` (clique para evento alvo)

## Campos por objetivo (o que muda por tipo de campanha)
### 1) Vendas e fechamento
Campos prioritarios:
- `purchases`
- `purchase_value`
- `roas`
- `cost_per_purchase`
- `checkout_initiated`
- `add_to_cart`

Leituras importantes:
- funil criativo (view -> click -> add_to_cart -> purchase)
- receita por criativo / adset / placement

### 2) Captura de leads
Campos prioritarios:
- `leads`
- `cost_per_lead`
- `lead_form_open_rate`
- `lead_form_completion_rate`
- `qualified_lead_rate` (quando CRM integrado)
- `cost_per_qualified_lead`

Leituras importantes:
- gargalo entre abertura e envio do formulario
- qualidade por publico e por criativo

### 3) Crescimento de audiencia e influencia (sem receita direta)
Campos prioritarios:
- `profile_visits`
- `follows` (quando rastreavel)
- `cost_per_follow` (quando houver investimento)
- `engagement_rate`
- `share_rate`
- `save_rate`
- `video_completion_rate`
- `message_interactions` (DM/WhatsApp/Messenger, quando aplicavel)

Leituras importantes:
- crescimento liquido de audiencia durante janela da campanha
- conteudos/angulos com maior poder de compartilhamento
- sinais de mobilizacao da audiencia

## Cruzamentos de dados que "enchem os olhos" (e vendem valor)
### Matriz criativo x publico x posicionamento
- Mostra os top 3 combinacoes vencedoras e as piores.
- Exibe ganho potencial estimado ao redistribuir verba.

### Fatiga de criativo
- Cruza `frequency` com tendencia de `ctr`, `cpc` e `engagement_rate`.
- Sinaliza quando manter campanha piora eficiencia.

### Heatmap de horario e dia
- Cruza horario/dia com custo por acao alvo.
- Recomenda janela ideal de entrega para proxima campanha.

### Geo e perfil de resposta
- Cruza regiao + faixa etaria + genero com KPI alvo.
- Ajuda nichos locais (politicos/ONGs) a encontrar polos de resposta.

### Qualidade de lead x origem de midia
- Cruza dados do CRM com `campaign/adset/ad`.
- Mostra de onde vem lead que vira reuniao/fechamento.

### Impacto sem receita (influencia/politica/ONG)
- Cruza `share_rate`, `save_rate`, `completion_rate`, `message_interactions`.
- Gera score de mobilizacao e aderencia da mensagem.

## Rubrica universal de sucesso e atencao
Recomendacao de classificacao:
- `Sucesso`: KPI >= meta ou >= baseline + margem positiva
- `Atencao`: KPI abaixo da meta por margem relevante
- `Critico`: queda consistente em KPI principal + aumento de custo

Exemplos de regras:
- Sucesso: `ctr >= baseline_ctr * 1.20`
- Atencao: `frequency > 3.5` e `ctr` caindo por 3 dias
- Critico: `cpl > target_cpl * 1.35` por mais de 2 dias

## Payload recomendado para IA (resumido e seguro)
O LLM nao deve receber dados brutos extensos. Enviar payload compacto:
- Identificacao da campanha
- KPIs finais
- Top 3 sucessos (com metrica)
- Top 3 alertas (com metrica)
- Top 5 combinacoes de cruzamentos
- Contexto do objetivo (`sales`, `lead_gen`, `growth`, `awareness`, `advocacy`)

## Formato de resposta da IA no dashboard
### Bloco 1 - Resumo executivo
- 3 a 5 linhas com resultado geral da campanha

### Bloco 2 - O que funcionou
- Lista de 3 a 5 pontos com evidencia numerica

### Bloco 3 - O que exige atencao
- Lista de 3 a 5 pontos com impacto e risco

### Bloco 4 - Proximas acoes
- 3 recomendacoes acionaveis (prioridade alta/media/baixa)
- Cada recomendacao com expectativa de ganho

## Estrutura minima de dados no backend
Tabelas sugeridas:
- `campaign_kpi_daily`
- `campaign_kpi_summary`
- `campaign_breakdown_summary`
- `campaign_analysis_report`
- `campaign_goal_target`

Campos chave adicionais:
- `organization_id`
- `ad_account_id`
- `campaign_id`
- `report_version`
- `analysis_mode` (`manual` ou `auto`)
- `goal_type` (`sales`, `lead_gen`, `growth`, `awareness`, `advocacy`)

## Estrategia de implantacao (sem travar produto)
1. MVP (rapido)
- Botao "Analisar campanha"
- Coleta via Meta API
- KPIs universais + regras de sucesso/atencao
- Resposta IA com resumo e recomendacoes

2. V2 (valor comercial)
- Cruzamentos avancados
- Baselines por conta e por objetivo
- Comparativo entre campanhas

3. V3 (escala)
- Ingestao continua (Airbyte ou pipeline proprio)
- Modelagem analitica avancada (dbt em warehouse)
- Relatorios executivos recorrentes por conta

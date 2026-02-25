#!/usr/bin/env python3
"""
B-Studio Dashboard API - Client Campaign Management

API para gerenciar campanhas dos clientes via dashboard.
"""

from fastapi import APIRouter, HTTPException, Query, Body
from typing import Optional, Dict, List
from datetime import datetime
import json

router = APIRouter()

# Banco de dados temporário (em produção, use PostgreSQL)
campaigns_db = {}
clients_db = {}


# ============================================================================
# MODELOS
# ============================================================================

class Campaign:
    def __init__(self, data: Dict):
        self.id = data.get('id', f'camp_{datetime.now().timestamp()}')
        self.client_id = data.get('client_id')
        self.name = data.get('name')
        self.objective = data.get('objective', 'OUTCOME_ENGAGEMENT')
        self.status = data.get('status', 'PAUSED')
        self.budget_total = data.get('budget_total', 0)
        self.budget_daily = data.get('budget_daily', 0)
        self.start_date = data.get('start_date')
        self.end_date = data.get('end_date')
        self.ad_accounts = data.get('ad_accounts', [])
        self.targeting = data.get('targeting', {})
        self.creative = data.get('creative', {})
        self.created_at = data.get('created_at', datetime.now())
        self.updated_at = data.get('updated_at', datetime.now())
        self.metrics = data.get('metrics', {
            'impressions': 0,
            'reach': 0,
            'clicks': 0,
            'spend': 0,
            'conversions': 0,
            'ctr': 0,
            'cpm': 0,
            'cpc': 0,
        })
    
    def to_dict(self) -> Dict:
        return {
            'id': self.id,
            'client_id': self.client_id,
            'name': self.name,
            'objective': self.objective,
            'status': self.status,
            'budget_total': self.budget_total,
            'budget_daily': self.budget_daily,
            'start_date': self.start_date,
            'end_date': self.end_date,
            'ad_accounts': self.ad_accounts,
            'targeting': self.targeting,
            'creative': self.creative,
            'created_at': self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at,
            'updated_at': self.updated_at.isoformat() if isinstance(self.updated_at, datetime) else self.updated_at,
            'metrics': self.metrics,
        }


# ============================================================================
# ENDPOINTS DO DASHBOARD
# ============================================================================

@router.get("/dashboard")
async def get_dashboard(client_id: str = Query(...)):
    """
    Obtém dashboard completo do cliente.
    
    Retorna:
    - Resumo de campanhas
    - Métricas gerais
    - Contas de anúncios
    - Campanhas recentes
    """
    # Verificar se cliente está autorizado
    from oauth_manager import token_manager
    token = token_manager.get_token(client_id)
    
    if not token:
        raise HTTPException(status_code=401, detail="Client not authorized")
    
    # Obter campanhas do cliente
    client_campaigns = [c for c in campaigns_db.values() if c['client_id'] == client_id]
    
    # Calcular métricas consolidadas
    total_spend = sum(c.get('metrics', {}).get('spend', 0) for c in client_campaigns)
    total_impressions = sum(c.get('metrics', {}).get('impressions', 0) for c in client_campaigns)
    total_clicks = sum(c.get('metrics', {}).get('clicks', 0) for c in client_campaigns)
    total_conversions = sum(c.get('metrics', {}).get('conversions', 0) for c in client_campaigns)
    
    # Campanhas por status
    active_campaigns = len([c for c in client_campaigns if c['status'] == 'ACTIVE'])
    paused_campaigns = len([c for c in client_campaigns if c['status'] == 'PAUSED'])
    
    return {
        'client': {
            'id': client_id,
            'name': token.get('user_name'),
            'email': token.get('user_email'),
        },
        'summary': {
            'total_campaigns': len(client_campaigns),
            'active_campaigns': active_campaigns,
            'paused_campaigns': paused_campaigns,
            'total_spend': total_spend,
            'total_impressions': total_impressions,
            'total_clicks': total_clicks,
            'total_conversions': total_conversions,
            'avg_ctr': (total_clicks / total_impressions * 100) if total_impressions > 0 else 0,
            'avg_cpc': (total_spend / total_clicks) if total_clicks > 0 else 0,
        },
        'ad_accounts': token.get('ad_accounts', []),
        'recent_campaigns': sorted(client_campaigns, key=lambda x: x['created_at'], reverse=True)[:5],
    }


@router.get("/dashboard/campaigns")
async def get_campaigns(
    client_id: str = Query(...),
    status: Optional[str] = Query(None),
    limit: int = Query(50),
    offset: int = Query(0),
):
    """
    Lista campanhas do cliente com filtros.
    """
    from oauth_manager import token_manager
    token = token_manager.get_token(client_id)
    
    if not token:
        raise HTTPException(status_code=401, detail="Client not authorized")
    
    # Filtrar campanhas
    client_campaigns = [c for c in campaigns_db.values() if c['client_id'] == client_id]
    
    if status:
        client_campaigns = [c for c in client_campaigns if c['status'] == status]
    
    # Paginação
    total = len(client_campaigns)
    campaigns = client_campaigns[offset:offset + limit]
    
    return {
        'campaigns': campaigns,
        'total': total,
        'limit': limit,
        'offset': offset,
    }


@router.get("/dashboard/campaigns/{campaign_id}")
async def get_campaign(campaign_id: str, client_id: str = Query(...)):
    """
    Obtém detalhes de uma campanha específica.
    """
    from oauth_manager import token_manager
    token = token_manager.get_token(client_id)
    
    if not token:
        raise HTTPException(status_code=401, detail="Client not authorized")
    
    if campaign_id not in campaigns_db:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign = campaigns_db[campaign_id]
    
    if campaign['client_id'] != client_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return campaign


@router.post("/dashboard/campaigns")
async def create_campaign(
    client_id: str = Query(...),
    campaign_data: Dict = Body(...),
):
    """
    Cria nova campanha.
    """
    from oauth_manager import token_manager
    token = token_manager.get_token(client_id)
    
    if not token:
        raise HTTPException(status_code=401, detail="Client not authorized")
    
    # Validar dados obrigatórios
    required_fields = ['name', 'objective', 'budget_total', 'start_date', 'end_date']
    for field in required_fields:
        if field not in campaign_data:
            raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
    
    # Criar campanha
    campaign = Campaign({
        'client_id': client_id,
        'name': campaign_data['name'],
        'objective': campaign_data['objective'],
        'status': 'PAUSED',  # Começa pausada para revisão
        'budget_total': campaign_data['budget_total'],
        'budget_daily': campaign_data.get('budget_daily', 0),
        'start_date': campaign_data['start_date'],
        'end_date': campaign_data['end_date'],
        'ad_accounts': campaign_data.get('ad_accounts', []),
        'targeting': campaign_data.get('targeting', {}),
        'creative': campaign_data.get('creative', {}),
    })
    
    campaigns_db[campaign.id] = campaign.to_dict()
    
    return {
        'status': 'success',
        'message': 'Campaign created successfully',
        'campaign': campaign.to_dict(),
    }


@router.put("/dashboard/campaigns/{campaign_id}")
async def update_campaign(
    campaign_id: str,
    client_id: str = Query(...),
    campaign_data: Dict = Body(...),
):
    """
    Atualiza campanha existente.
    """
    from oauth_manager import token_manager
    token = token_manager.get_token(client_id)
    
    if not token:
        raise HTTPException(status_code=401, detail="Client not authorized")
    
    if campaign_id not in campaigns_db:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign = campaigns_db[campaign_id]
    
    if campaign['client_id'] != client_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Atualizar campos
    updatable_fields = ['name', 'status', 'budget_total', 'budget_daily', 'targeting', 'creative']
    for field in updatable_fields:
        if field in campaign_data:
            campaign[field] = campaign_data[field]
    
    campaign['updated_at'] = datetime.now()
    campaigns_db[campaign_id] = campaign
    
    return {
        'status': 'success',
        'message': 'Campaign updated successfully',
        'campaign': campaign,
    }


@router.delete("/dashboard/campaigns/{campaign_id}")
async def delete_campaign(campaign_id: str, client_id: str = Query(...)):
    """
    Exclui campanha.
    """
    from oauth_manager import token_manager
    token = token_manager.get_token(client_id)
    
    if not token:
        raise HTTPException(status_code=401, detail="Client not authorized")
    
    if campaign_id not in campaigns_db:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign = campaigns_db[campaign_id]
    
    if campaign['client_id'] != client_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    del campaigns_db[campaign_id]
    
    return {
        'status': 'success',
        'message': 'Campaign deleted successfully',
    }


@router.post("/dashboard/campaigns/{campaign_id}/activate")
async def activate_campaign(campaign_id: str, client_id: str = Query(...)):
    """
    Ativa campanha (muda status para ACTIVE).
    """
    from oauth_manager import token_manager
    token = token_manager.get_token(client_id)
    
    if not token:
        raise HTTPException(status_code=401, detail="Client not authorized")
    
    if campaign_id not in campaigns_db:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign = campaigns_db[campaign_id]
    
    if campaign['client_id'] != client_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    campaign['status'] = 'ACTIVE'
    campaign['updated_at'] = datetime.now()
    campaigns_db[campaign_id] = campaign
    
    return {
        'status': 'success',
        'message': 'Campaign activated successfully',
        'campaign': campaign,
    }


@router.post("/dashboard/campaigns/{campaign_id}/pause")
async def pause_campaign(campaign_id: str, client_id: str = Query(...)):
    """
    Pausa campanha (muda status para PAUSED).
    """
    from oauth_manager import token_manager
    token = token_manager.get_token(client_id)
    
    if not token:
        raise HTTPException(status_code=401, detail="Client not authorized")
    
    if campaign_id not in campaigns_db:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign = campaigns_db[campaign_id]
    
    if campaign['client_id'] != client_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    campaign['status'] = 'PAUSED'
    campaign['updated_at'] = datetime.now()
    campaigns_db[campaign_id] = campaign
    
    return {
        'status': 'success',
        'message': 'Campaign paused successfully',
        'campaign': campaign,
    }


@router.get("/dashboard/metrics")
async def get_metrics(
    client_id: str = Query(...),
    campaign_id: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
):
    """
    Obtém métricas detalhadas.
    """
    from oauth_manager import token_manager
    token = token_manager.get_token(client_id)
    
    if not token:
        raise HTTPException(status_code=401, detail="Client not authorized")
    
    # Se tiver campaign_id, retorna métricas da campanha
    if campaign_id:
        if campaign_id not in campaigns_db:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        campaign = campaigns_db[campaign_id]
        return {
            'campaign_id': campaign_id,
            'metrics': campaign.get('metrics', {}),
        }
    
    # Senão, retorna métricas consolidadas
    client_campaigns = [c for c in campaigns_db.values() if c['client_id'] == client_id]
    
    total_spend = sum(c.get('metrics', {}).get('spend', 0) for c in client_campaigns)
    total_impressions = sum(c.get('metrics', {}).get('impressions', 0) for c in client_campaigns)
    total_clicks = sum(c.get('metrics', {}).get('clicks', 0) for c in client_campaigns)
    total_conversions = sum(c.get('metrics', {}).get('conversions', 0) for c in client_campaigns)
    
    return {
        'total_spend': total_spend,
        'total_impressions': total_impressions,
        'total_clicks': total_clicks,
        'total_conversions': total_conversions,
        'avg_ctr': (total_clicks / total_impressions * 100) if total_impressions > 0 else 0,
        'avg_cpc': (total_spend / total_clicks) if total_clicks > 0 else 0,
        'avg_cpm': (total_spend / total_impressions * 1000) if total_impressions > 0 else 0,
        'campaigns_count': len(client_campaigns),
    }

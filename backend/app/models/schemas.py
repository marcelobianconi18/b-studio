
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date

class PostCreate(BaseModel):
    message: str
    image_url: Optional[str] = None
    scheduled_time: Optional[datetime] = None  # If None, post immediately

class PostResponse(BaseModel):
    id: str  # Task ID or Post ID
    status: str
    message: str


class CampaignAnalyzeRequest(BaseModel):
    goal_type: str = "sales"
    analysis_mode: str = "manual"


class CampaignAnalysisScores(BaseModel):
    delivery: float
    efficiency: float
    goal: float
    final: float


class CampaignAnalysisMetrics(BaseModel):
    amount_spent: float
    impressions: int
    reach: int
    frequency: float
    clicks: int
    link_clicks: int
    outbound_clicks: int
    ctr: float
    cpc: float
    cpm: float
    leads: int
    purchases: int
    purchase_value: float
    cost_per_lead: Optional[float] = None
    cost_per_purchase: Optional[float] = None
    roas: Optional[float] = None


class CampaignDailyMetricResponse(BaseModel):
    date_start: Optional[date] = None
    date_stop: Optional[date] = None
    amount_spent: float
    impressions: int
    reach: int
    clicks: int
    ctr: float
    cpc: float
    cpm: float
    leads: int
    purchases: int


class CampaignRecommendationItem(BaseModel):
    priority: str
    title: str
    description: str
    expected_impact: str


class CampaignAnalysisReportResponse(BaseModel):
    report_id: int
    campaign_id: str
    campaign_name: Optional[str] = None
    objective: Optional[str] = None
    status: Optional[str] = None
    goal_type: str
    analysis_mode: str
    analyzed_at: datetime
    days_analyzed: int
    scores: CampaignAnalysisScores
    metrics: CampaignAnalysisMetrics
    success_points: List[str]
    attention_points: List[str]
    recommended_actions: List[CampaignRecommendationItem]
    executive_summary: str
    daily_metrics: List[CampaignDailyMetricResponse]

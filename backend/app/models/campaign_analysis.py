from sqlalchemy import Column, Integer, String, DateTime, Float, JSON, Date, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class CampaignAnalysisReport(Base):
    __tablename__ = "campaign_analysis_reports"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(String, index=True, nullable=False)
    campaign_name = Column(String, nullable=True)
    objective = Column(String, nullable=True)
    campaign_status = Column(String, nullable=True)
    ad_account_id = Column(String, nullable=True)
    goal_type = Column(String, default="sales")
    analysis_mode = Column(String, default="manual")

    amount_spent = Column(Float, default=0.0)
    impressions = Column(Integer, default=0)
    reach = Column(Integer, default=0)
    frequency = Column(Float, default=0.0)
    clicks = Column(Integer, default=0)
    link_clicks = Column(Integer, default=0)
    outbound_clicks = Column(Integer, default=0)
    ctr = Column(Float, default=0.0)
    cpc = Column(Float, default=0.0)
    cpm = Column(Float, default=0.0)
    leads = Column(Integer, default=0)
    purchases = Column(Integer, default=0)
    purchase_value = Column(Float, default=0.0)
    cost_per_lead = Column(Float, nullable=True)
    cost_per_purchase = Column(Float, nullable=True)
    roas = Column(Float, nullable=True)

    delivery_score = Column(Float, default=0.0)
    efficiency_score = Column(Float, default=0.0)
    goal_score = Column(Float, default=0.0)
    final_score = Column(Float, default=0.0)

    success_points = Column(JSON, default=list)
    attention_points = Column(JSON, default=list)
    recommended_actions = Column(JSON, default=list)
    executive_summary = Column(String, nullable=True)
    raw_metrics = Column(JSON, default=dict)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    daily_metrics = relationship("CampaignKpiDaily", back_populates="report", cascade="all, delete-orphan")


class CampaignKpiDaily(Base):
    __tablename__ = "campaign_kpi_daily"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("campaign_analysis_reports.id"), index=True, nullable=False)
    campaign_id = Column(String, index=True, nullable=False)

    date_start = Column(Date, nullable=True)
    date_stop = Column(Date, nullable=True)
    amount_spent = Column(Float, default=0.0)
    impressions = Column(Integer, default=0)
    reach = Column(Integer, default=0)
    frequency = Column(Float, default=0.0)
    clicks = Column(Integer, default=0)
    link_clicks = Column(Integer, default=0)
    outbound_clicks = Column(Integer, default=0)
    ctr = Column(Float, default=0.0)
    cpc = Column(Float, default=0.0)
    cpm = Column(Float, default=0.0)
    leads = Column(Integer, default=0)
    purchases = Column(Integer, default=0)
    purchase_value = Column(Float, default=0.0)
    raw_metrics = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    report = relationship("CampaignAnalysisReport", back_populates="daily_metrics")

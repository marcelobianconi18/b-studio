
from sqlalchemy import Column, Integer, String, DateTime, JSON, Enum, Boolean, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class AgentMode(enum.Enum):
    MANUAL = "manual"
    HYBRID = "hybrid"
    AUTOMATIC = "automatic"

class AgentSettings(Base):
    __tablename__ = "agent_settings"
    id = Column(Integer, primary_key=True, index=True)
    mode = Column(String, default=AgentMode.MANUAL.value)
    risk_profile = Column(String, default="moderate") # conservative, moderate, aggressive
    last_updated = Column(DateTime(timezone=True), onupdate=func.now())

class Recommendation(Base):
    __tablename__ = "recommendations"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    content = Column(String)
    campaign_id = Column(String, index=True)
    impact_score = Column(Integer) # 1-10
    is_executed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AutonomousAction(Base):
    __tablename__ = "autonomous_actions"
    id = Column(Integer, primary_key=True, index=True)
    action_type = Column(String) # PAUSE, SCALE_UP, SCALE_DOWN
    campaign_id = Column(String)
    reason = Column(String)
    status = Column(String, default="completed")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class HistoricalAudit(Base):
    __tablename__ = "historical_audits"
    id = Column(Integer, primary_key=True, index=True)
    report_json = Column(JSON)
    summary_text = Column(String)
    period_days = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

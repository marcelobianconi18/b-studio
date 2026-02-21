
"""
Intelligence Core Module
Handles advanced market intelligence, data correlation, and scoring logic.
"""
from .census_client import census_client
from .scorer import market_scorer

__all__ = ["census_client", "market_scorer"]

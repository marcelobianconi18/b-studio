
from typing import Dict, Any, List, Optional
import math
import logging

logger = logging.getLogger("BiaMarketScorer")

class MarketScorer:
    """
    Calculates the 'Opportunity Score' (0-100) for a given location.
    
    Factors:
    1. Demographics (Income/Pop): Higher is better (usually).
    2. Competition (OSM): Lower is better (Blue Ocean) OR Higher is better (Cluster Strategy).
    3. Audience (Meta): Higher Reach/Lower CPM is better.
    """
    
    def calculate_score(
        self, 
        income_level: float, 
        population_density: float, 
        competitor_count: int, 
        meta_reach: int, 
        meta_cpm: float,
        strategy: str = "blue_ocean" # or 'cluster'
    ) -> Dict[str, Any]:
        
        # 1. Income Score (0-100)
        # Normalized against a baseline (e.g. R$ 3500 avg Brazil)
        # Cap at R$ 15k for max score to avoid skew
        income_score = min(100, (income_level / 15000.0) * 100)
        
        # 2. Audience Score (0-100)
        # Based on Reach Density (People per km2 in target)
        # Heuristic: 1000 people reach = good start
        audience_score = min(100, (meta_reach / 5000.0) * 80 + 20)
        
        # 3. Competition Score (0-100)
        # In Blue Ocean: 0 competitors = 100 score. 10+ = 0 score.
        # In Cluster: 5-10 competitors = 100 score (hot zone). 0 = 0 score.
        if strategy == "blue_ocean":
            comp_score = max(0, 100 - (competitor_count * 10))
        else:
            # Bell curve around 7 competitors
            dist = abs(competitor_count - 7)
            comp_score = max(0, 100 - (dist * 15))
            
        # Weighted Final Score
        # Income: 40%, Audience: 30%, Competition: 30%
        final_score = (income_score * 0.4) + (audience_score * 0.3) + (comp_score * 0.3)
        
        return {
            "total_score": round(final_score, 1),
            "details": {
                "income_score": round(income_score, 1),
                "audience_score": round(audience_score, 1),
                "competition_score": round(comp_score, 1)
            },
            "verdict": self._get_verdict(final_score)
        }
        
    def _get_verdict(self, score: float) -> str:
        if score >= 85: return "Excelente (Hotspot)"
        if score >= 70: return "Muito Bom"
        if score >= 50: return "Médio/Regular"
        return "Baixo Potencial"

market_scorer = MarketScorer()

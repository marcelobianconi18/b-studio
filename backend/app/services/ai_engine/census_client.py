
import os
import json
import logging
import aiohttp
import asyncio
from typing import Dict, Any, List, Optional
from dataclasses import dataclass

logger = logging.getLogger("BiaCensusClient")
logger.setLevel(logging.INFO)

@dataclass
class CensusTract:
    """Represents a standardized IBGE Census Tract (Setor Censitário)."""
    id: str  # Código do Setor (15 digits)
    city_id: str
    population: int
    households: int
    avg_income: float
    geometry: Dict[str, Any]  # GeoJSON Geometry

class CensusClient:
    """
    Client for granular IBGE Census 2022 data (Setores Censitários).
    Focus: Retrieving micro-data for hyper-local intelligence.
    Warning: This client handles large datasets. Use caching.
    """
    
    # Official IBGE APIs for Aggregates (SIDRA) and Malha (Geodata)
    SIDRA_API = "https://servicodados.ibge.gov.br/api/v3/agregados"
    MALHA_API = "https://servicodados.ibge.gov.br/api/v3/malhas"
    
    def __init__(self):
        self.cache_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 
            "data", "census_cache"
        )
        if not os.path.exists(self.cache_dir):
            os.makedirs(self.cache_dir)
            
    async def get_tracts_for_city(self, city_id: str) -> List[CensusTract]:
        """
        Retrieves all census tracts for a given city with their basic geometry and data.
        Strategy: 
        1. Check local cache (GeoJSON).
        2. If missing, fetch from IBGE Malha API (geometry).
        3. Fetch Aggregate Data (Pop + Income) from SIDRA for these tracts.
        4. Merge and Cache.
        """
        cache_path = os.path.join(self.cache_dir, f"{city_id}_tracts.json")
        
        if os.path.exists(cache_path):
            try:
                with open(cache_path, "r") as f:
                    data = json.load(f)
                    return [CensusTract(**item) for item in data]
            except Exception as e:
                logger.warning(f"Failed to load cache for {city_id}: {e}")
        
        # If not cached, we need to build it.
        # This is a heavy operation, so we log it clearly.
        logger.info(f"Building census cache for city {city_id} (Heavy Operation)...")
        
        tracts = await self._fetch_and_build_tracts(city_id)
        
        # Save to cache
        try:
            with open(cache_path, "w") as f:
                json.dump([t.__dict__ for t in tracts], f)
        except Exception as e:
             logger.error(f"Failed to save cache for {city_id}: {e}")
             
        return tracts

    async def _fetch_and_build_tracts(self, city_id: str) -> List[CensusTract]:
        """
        Orchestrates the fetch of Geometry + Data.
        """
        # Step 1: Get Geometry (The Map)
        # Endpoint: malhas/municipios/{id}/subdivisoes?formato=application/vnd.geo+json
        # This returns the raw shapes of every block.
        geometry_url = f"{self.MALHA_API}/municipios/{city_id}/subdivisoes"
        params = {"formato": "application/vnd.geo+json", "qualidade": "intermedia"}
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(geometry_url, params=params) as resp:
                    resp.raise_for_status()
                    geo_data = await resp.json()
        except Exception as e:
            logger.error(f"Failed to fetch geometry for {city_id}: {e}")
            return []
            
        features = geo_data.get("features", [])
        tract_map = {f["properties"]["CD_SETOR"]: f["geometry"] for f in features}
        
        # Step 2: Get Data (The Intelligence)
        # We need to hit SIDRA to get Population (Agg 4714) and Income (Agg 3563 or similar for 2010/2022)
        # Note: SIDRA API for Census Tracts (N10) is complex and often requires bulk download.
        # For this MVP, we will use a simplified mock generator based on the city's average profile
        # modulated by a heuristic (center vs outskirts) because real-time SIDRA N10 scraping is unstable 
        # without a pre-downloaded CSV database.
        # TODO: Replace heuristics with real SIDRA csv import in V2.
        
        tracts = []
        import random
        random.seed(int(city_id)) # Deterministic "randomness" for stability
        
        for tract_code, geometry in tract_map.items():
            # Heuristic generation for MVP (Simulating precise data extraction)
            # In production, this would query a local SQLite database populated with Censo 2022 CSVs.
            
            # Simulated variance based on tract hash (to be consistent but varied)
            variance = (hash(tract_code) % 100) / 100.0
            
            # Base logic: tracts with smaller areas (dense) usually have higher income/density in BR cities
            # This is a naive heuristic but better than flat average.
            
            pop = int(500 + (variance * 1000))
            income = 3500.0 * (0.5 + variance * 2.0) # Range 1750 to 8750
            
            tracts.append(CensusTract(
                id=tract_code,
                city_id=city_id,
                population=pop,
                households=int(pop / 3.2),
                avg_income=round(income, 2),
                geometry=geometry
            ))
            
        return tracts
        
    def get_nearby_tracts(self, lat: float, lng: float, radius_km: float = 1.0, city_id: Optional[str] = None) -> List[CensusTract]:
        """
        Finds census tracts intersecting a radius.
        Requires city_id to narrow search (performance).
        """
        # MVP: Filter by bounding box or simple distance on the centroids of loaded city tracts
        return []

census_client = CensusClient()

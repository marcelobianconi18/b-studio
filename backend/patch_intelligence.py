import os

router_path = "/Volumes/SSD Externo/repositórios/b-studio/backend/app/routers/intelligence.py"

with open(router_path, 'r') as f:
    content = f.read()

new_route = """

# --- NEW BIA AI AGENT INTEGRATION ---

class AudienceAnalysisRequest(BaseModel):
    product_description: str
    platform: str = "instagram"
    objective: str = "SALES"
    tag_type: str = "general"
    limit: int = 5
    ticket: str = None
    investment: str = None
    location: str = None

@router.post("/agent-audience")
async def generate_agentic_audience(req: AudienceAnalysisRequest):
    \"\"\"
    Triggers the deep BIA Multi-Agent Flow (Planner + Meta MCP + Refiner)
    to generate optimal Meta Ads targeting strategies.
    \"\"\"
    from app.services.ai_engine.ai_assistant import BiaAIAssistant
    
    agent = BiaAIAssistant()
    
    result = await agent.generate_audience_tags(
        product_description=req.product_description,
        platform=req.platform,
        objective=req.objective,
        tag_type=req.tag_type,
        limit=req.limit,
        ticket=req.ticket,
        investment=req.investment,
        location=req.location,
        meta_research_required=True, # Forces the Agent MCP Flow
        suggestion_mode="balanced"
    )
    
    if not result or not result.get("success"):
        raise HTTPException(status_code=500, detail="Agent failed to resolve targeting via MCP.")
        
    return result

"""

if "generate_agentic_audience" not in content:
    with open(router_path, 'a') as f:
        f.write(new_route)
    print("Successfully patched app/routers/intelligence.py")
else:
    print("Route already exists.")

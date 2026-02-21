import asyncio
import os
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO)

# Add B-Studio backend to path
backend_path = "/Volumes/SSD Externo/repositórios/b-studio/backend"
sys.path.append(os.path.abspath(backend_path))

# Load .env
load_dotenv(dotenv_path=os.path.join(backend_path, '.env'))

from app.services.ai_engine.ai_assistant import BiaAIAssistant

async def test_agentic_flow():
    print("🧠 Starting B-Studio Agentic AI Flow (Bia Engine)...")
    
    # We simulate the payload that would come from the frontend
    agent = BiaAIAssistant()
    
    result = await agent.generate_tags(
        product_description="Curso online de culinária saudável e marmitas fit",
        platform="instagram",
        objective="SALES",
        tag_type="general",
        limit=5,
        ticket="R$ 197,00",
        investment="R$ 50/dia",
        location="Brasil",
        meta_research_required=True, # This forces the MCP Parallel flow!
        suggestion_mode="balanced"
    )
    
    print("\n--- 🎯 AGENT DECISION ---")
    if result.get("success"):
        print(f"Source: {result.get('source')}")
        print(f"Reasoning: {result.get('reasoning')}")
        print("\n🏆 Top Tags Recommended:")
        for tag in result.get("tags", []):
            print(f"- {tag}")
            
        print("\n⚙️ Agentic Flow Diagnostics:")
        flow = result.get("agentic_flow", {})
        print(f"Enabled: {flow.get('enabled')}")
        print(f"MCP Queries Planned: {flow.get('plan_queries')}")
        print(f"MCP Records Analyzed: {flow.get('meta_mcp_records')}")
    else:
        print("❌ Agent failed.")

if __name__ == "__main__":
    asyncio.run(test_agentic_flow())

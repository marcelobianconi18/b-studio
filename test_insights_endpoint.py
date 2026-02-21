import asyncio
from fastapi import Request
import os
import sys
from pathlib import Path

# Add B-Studio backend to path
sys.path.append(os.path.abspath("/Volumes/SSD Externo/repositórios/b-studio/backend"))

from app.routers.insights import get_insights

async def test_endpoint():
    print("Testing the live patched _try_fetch_live logic...")
    # call it as 'instagram' to trigger IG follower logic
    result = await get_insights(platform="instagram", period="30d")
    
    if result:
        print("\n✅ Success! The endpoint returned data.")
        print(f"Followers (Live injected): {result['page_followers']['value']}")
        print(f"Top Country: {result['demographics']['top_country']}")
        print(f"Total Reactions: {result['total_reactions']['value']}")
    else:
        print("❌ Failed to return data completely.")

if __name__ == "__main__":
    asyncio.run(test_endpoint())

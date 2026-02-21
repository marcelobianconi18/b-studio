
import asyncio
import os
import json
import sys

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

from backend.engine.meta_core.targeting import search_interests, search_behaviors, search_demographics

async def main():
    try:
        print("--- Searching Interests (query='marketing') ---")
        # Token should be in env or passed. Assuming env META_ACCESS_TOKEN if set, 
        # otherwise this might fail if not set in the shell context.
        # We'll try to run it.
        try:
             res_interests = await search_interests("marketing")
             print(res_interests[:500] + "...") 
        except Exception as e:
             print(f"Error searching interests: {e}")

        print("\n--- Searching Demographics (class='demographics') ---")
        try:
            res_demo = await search_demographics()
            print(res_demo[:500] + "...")
        except Exception as e:
            print(f"Error searching demographics: {e}")

    except Exception as e:
        print(f"General Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())

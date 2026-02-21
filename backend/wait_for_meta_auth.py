import asyncio
import os
import sys
import time
from pathlib import Path

# Add backend to path
backend_dir = Path('/Volumes/SSD Externo/repositórios/b-studio/backend')
sys.path.append(str(backend_dir))

from dotenv import load_dotenv
load_dotenv(dotenv_path=backend_dir / '.env')

from app.services.meta_engine.auth import start_callback_server, token_container, process_token_response, auth_manager
from app.services.meta_engine.utils import logger

async def main():
    print("Starting Meta Auth Monitor...")
    try:
        port = start_callback_server()
        print(f"Callback server listening on port {port}")
        print("Waiting for authentication (300s timeout)...")
        
        start_time = time.time()
        timeout = 300
        
        while time.time() - start_time < timeout:
            if token_container.get("token") or token_container.get("auth_code"):
                print("Token/Code received! Processing...")
                success = process_token_response(token_container)
                if success:
                    print("✅ Authentication successful and token saved to cache.")
                    # Show token preview (masked)
                    token = auth_manager.get_access_token()
                    if token:
                        print(f"Token preview: {token[:10]}...")
                    return True
                else:
                    print("❌ Failed to process token response.")
                    return False
            
            await asyncio.sleep(2)
            
        print("⏰ Timeout waiting for authentication.")
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    asyncio.run(main())

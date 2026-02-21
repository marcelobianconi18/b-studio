import os
import sys
from pathlib import Path

# Add backend to sys.path
backend_dir = Path("/Volumes/SSD Externo/repositórios/b-studio/backend")
sys.path.append(str(backend_dir))

from dotenv import load_dotenv
load_dotenv(dotenv_path=backend_dir / ".env")

from app.services.meta_engine.pipeboard_auth import pipeboard_auth_manager

print(f"Testing with API Token: {pipeboard_auth_manager.api_token[:10]}...")

print("\n--- Testing get_access_token() ---")
token = pipeboard_auth_manager.get_access_token()
if token:
    print(f"SUCCESS! Token retrieved: {token[:10]}...")
else:
    print("FAILED to retrieve token.")

print("\n--- Testing initiate_auth_flow() ---")
try:
    auth_data = pipeboard_auth_manager.initiate_auth_flow()
    print("SUCCESS!")
    print(auth_data)
except Exception as e:
    print(f"FAILED: {e}")


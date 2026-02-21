import os
import sys
import requests
from pathlib import Path

# Add backend to sys.path
backend_dir = Path("/Volumes/SSD Externo/repositórios/b-studio/backend")
sys.path.append(str(backend_dir))

from dotenv import load_dotenv
load_dotenv(dotenv_path=backend_dir / ".env")

api_token = os.environ.get("PIPEBOARD_API_TOKEN")
print(f"PIPEBOARD_API_TOKEN: {api_token[:10]}...")

# 1. Get Meta Token from Pipeboard
url = f"https://pipeboard.co/api/meta/token?api_token={api_token}"
r = requests.get(url)
if r.status_code != 200:
    print(f"Error getting token: {r.status_code} {r.text}")
    sys.exit(1)

meta_token = r.json().get('access_token')
print(f"META_TOKEN: {meta_token[:10]}...")

# 2. List Ad Accounts
r = requests.get(f"https://graph.facebook.com/v22.0/me/adaccounts?fields=name,account_id,id&access_token={meta_token}")
print("\nAD ACCOUNTS:")
for acc in r.json().get('data', []):
    print(f"- {acc['name']} ({acc['id']})")

# 3. Test insights for one Ad Account
if r.json().get('data'):
    acc_id = r.json().get('data')[0]['id']
    print(f"\nTesting insights for Ad Account: {acc_id}")
    r = requests.get(f"https://graph.facebook.com/v22.0/{acc_id}/insights?metric=impressions,reach,spend&date_preset=last_30d&access_token={meta_token}")
    print(f"Response: {r.status_code}")
    print(r.text)

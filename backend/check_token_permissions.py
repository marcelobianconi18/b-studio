#!/usr/bin/env python3
"""
Check current token permissions and connected accounts.
"""

import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

TOKEN = os.getenv("FACEBOOK_ACCESS_TOKEN")

async def check_permissions():
    print("=" * 80)
    print("VERIFICANDO PERMISSÕES DO TOKEN ATUAL")
    print("=" * 80)
    print(f"Token: {TOKEN[:30]}...")
    print("=" * 80)

    async with httpx.AsyncClient() as client:
        # Get permissions
        url = f"https://graph.facebook.com/v22.0/me/permissions?access_token={TOKEN}"
        resp = await client.get(url)
        perms_data = resp.json()
        
        if 'error' in perms_data:
            print(f"\n❌ Erro: {perms_data['error'].get('message', 'Unknown')}")
        else:
            print("\n📋 PERMISSÕES ATIVAS NO TOKEN:")
            print("-" * 80)
            
            permissions = perms_data.get('data', [])
            granted = [p for p in permissions if p.get('status') == 'granted']
            declined = [p for p in permissions if p.get('status') == 'declined']
            
            print(f"\n✅ CONCEDIDAS ({len(granted)}):")
            for p in sorted(granted, key=lambda x: x['permission']):
                print(f"   • {p['permission']}")
            
            if declined:
                print(f"\n❌ RECUSADAS ({len(declined)}):")
                for p in sorted(declined, key=lambda x: x['permission']):
                    print(f"   • {p['permission']}")
            
            # Check critical permissions
            print("\n" + "=" * 80)
            print("PERMISSÕES CRÍTICAS PARA INSIGHTS:")
            print("=" * 80)
            
            critical = [
                'instagram_basic',
                'instagram_manage_insights',
                'pages_read_engagement',
                'read_insights',
                'ads_read',
                'ads_management'
            ]
            
            granted_perms = [p['permission'] for p in granted]
            
            for perm in critical:
                status = "✅" if perm in granted_perms else "❌"
                print(f"   {status} {perm}")
            
            # Get user info
            print("\n" + "=" * 80)
            print("INFO DO USUÁRIO:")
            print("=" * 80)
            
            url = f"https://graph.facebook.com/v22.0/me?fields=id,name,email&access_token={TOKEN}"
            resp = await client.get(url)
            user_data = resp.json()
            
            if 'error' not in user_data:
                print(f"   ID: {user_data.get('id', 'N/A')}")
                print(f"   Nome: {user_data.get('name', 'N/A')}")
                print(f"   Email: {user_data.get('email', 'N/A')}")
            
            # Get pages
            print("\n" + "=" * 80)
            print("PÁGINAS DISPONÍVEIS:")
            print("=" * 80)
            
            url = f"https://graph.facebook.com/v22.0/me/accounts?access_token={TOKEN}"
            resp = await client.get(url)
            pages_data = resp.json()
            
            if 'error' not in pages_data:
                pages = pages_data.get('data', [])
                print(f"   Total: {len(pages)} página(s)")
                for page in pages:
                    print(f"   • {page.get('name', 'Unknown')} ({page['id']})")
                    
                    # Check Instagram for each page
                    ig_url = f"https://graph.facebook.com/v22.0/{page['id']}?fields=instagram_business_account&access_token={TOKEN}"
                    ig_resp = await client.get(ig_url)
                    ig_data = ig_resp.json()
                    
                    if 'instagram_business_account' in ig_data:
                        ig_id = ig_data['instagram_business_account']['id']
                        print(f"      📷 Instagram: {ig_id}")
                        
                        # Get Instagram info
                        ig_info_url = f"https://graph.facebook.com/v22.0/{ig_id}?fields=username,name,followers_count&access_token={TOKEN}"
                        ig_info_resp = await client.get(ig_info_url)
                        ig_info_data = ig_info_resp.json()
                        
                        if 'error' not in ig_info_data:
                            print(f"         @ {ig_info_data.get('username', 'N/A')} - {ig_info_data.get('followers_count', 0):,} followers")
            else:
                print(f"   ❌ Erro: {pages_data['error'].get('message', 'Unknown')}")

    print("\n" + "=" * 80)

if __name__ == "__main__":
    asyncio.run(check_permissions())

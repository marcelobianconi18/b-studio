#!/usr/bin/env python3
"""
Get all available accounts (Facebook Pages, Instagram, Ad Accounts)
for the current token.
"""

import asyncio
import httpx
import os
import json
from dotenv import load_dotenv

load_dotenv()

TOKEN = os.getenv("FACEBOOK_ACCESS_TOKEN")

async def get_all_accounts():
    print("=" * 80)
    print("CONTAS DISPONÍVEIS PARA SELEÇÃO")
    print("=" * 80)
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # 1. Get Facebook Pages
        print("\n📘 PÁGINAS FACEBOOK:")
        print("-" * 80)
        
        url = f"https://graph.facebook.com/v22.0/me/accounts?fields=id,name,username,followers_count,instagram_business_account&access_token={TOKEN}"
        resp = await client.get(url)
        pages_data = resp.json()
        
        pages = []
        if 'error' not in pages_data:
            for page in pages_data.get('data', []):
                page_info = {
                    'id': page['id'],
                    'name': page.get('name', 'Unknown'),
                    'username': page.get('username', 'N/A'),
                    'followers': page.get('followers_count', 0),
                    'has_instagram': 'instagram_business_account' in page,
                    'instagram_id': page['instagram_business_account']['id'] if 'instagram_business_account' in page else None
                }
                pages.append(page_info)
                
                ig_status = "📷" if page_info['has_instagram'] else "❌"
                print(f"   {ig_status} {page_info['name']} ({page_info['id']})")
                print(f"      Followers: {page_info['followers']:,}")
                if page_info['has_instagram']:
                    print(f"      Instagram ID: {page_info['instagram_id']}")
        else:
            print(f"   ❌ Erro: {pages_data['error'].get('message', 'Unknown')}")
        
        # 2. Get Ad Accounts
        print("\n📊 CONTAS DE ANÚNCIOS:")
        print("-" * 80)
        
        url = f"https://graph.facebook.com/v22.0/me/adaccounts?fields=id,name,account_status,business&access_token={TOKEN}"
        resp = await client.get(url)
        ads_data = resp.json()
        
        ad_accounts = []
        if 'error' not in ads_data:
            for ad_account in ads_data.get('data', []):
                ad_info = {
                    'id': ad_account['id'],
                    'name': ad_account.get('name', 'Unknown'),
                    'status': ad_account.get('account_status', 'Unknown')
                }
                ad_accounts.append(ad_info)
                print(f"   ✅ {ad_info['name']} ({ad_info['id']})")
                print(f"      Status: {ad_info['status']}")
        else:
            print(f"   ❌ Erro: {ads_data['error'].get('message', 'Unknown')}")
        
        # 3. Get Instagram Details for each connected account
        print("\n📷 INSTAGRAM DETAILS:")
        print("-" * 80)
        
        instagrams = []
        for page in pages:
            if page['has_instagram'] and page['instagram_id']:
                ig_id = page['instagram_id']
                
                # Get Instagram info
                ig_url = f"https://graph.facebook.com/v22.0/{ig_id}?fields=username,name,followers_count,biography&access_token={TOKEN}"
                ig_resp = await client.get(ig_url)
                ig_data = ig_resp.json()
                
                if 'error' not in ig_data:
                    ig_info = {
                        'id': ig_id,
                        'username': ig_data.get('username', 'N/A'),
                        'name': ig_data.get('name', 'N/A'),
                        'followers': ig_data.get('followers_count', 0),
                        'page_id': page['id'],
                        'page_name': page['name']
                    }
                    instagrams.append(ig_info)
                    print(f"   📷 @{ig_info['username']} ({ig_info['id']})")
                    print(f"      Name: {ig_info['name']}")
                    print(f"      Followers: {ig_info['followers']:,}")
                    print(f"      Linked to: {ig_info['page_name']} ({ig_info['page_id']})")
        
        # Save to JSON file for frontend use
        accounts_data = {
            'facebook_pages': pages,
            'instagram_accounts': instagrams,
            'ad_accounts': ad_accounts,
            'total': {
                'facebook_pages': len(pages),
                'instagram_accounts': len(instagrams),
                'ad_accounts': len(ad_accounts)
            }
        }
        
        with open('available_accounts.json', 'w', encoding='utf-8') as f:
            json.dump(accounts_data, f, indent=2, ensure_ascii=False)
        
        print("\n" + "=" * 80)
        print(f"💾 Dados salvos em: available_accounts.json")
        print(f"📊 Resumo:")
        print(f"   • Facebook Pages: {len(pages)}")
        print(f"   • Instagram Accounts: {len(instagrams)}")
        print(f"   • Ad Accounts: {len(ad_accounts)}")
        print("=" * 80)
        
        return accounts_data

if __name__ == "__main__":
    asyncio.run(get_all_accounts())

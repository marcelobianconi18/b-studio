#!/usr/bin/env python3
"""
Test script to verify Instagram connection for Professor Lemos page.
"""

import os
import asyncio
import httpx
from dotenv import load_dotenv

load_dotenv()

ACCESS_TOKEN = os.getenv("FACEBOOK_ACCESS_TOKEN")
PAGE_ID = os.getenv("FACEBOOK_PAGE_ID")

async def test_connection():
    print("=" * 80)
    print("TESTING INSTAGRAM CONNECTION - PROFESSOR LEMOS")
    print("=" * 80)
    print(f"Page ID: {PAGE_ID}")
    print(f"Token: {ACCESS_TOKEN[:20]}...")
    print("=" * 80)

    # Step 1: Verify token
    print("\n1. Verifying access token...")
    async with httpx.AsyncClient() as client:
        url = f"https://graph.facebook.com/v22.0/me?access_token={ACCESS_TOKEN}"
        resp = await client.get(url)
        data = resp.json()
        
        if 'error' in data:
            print(f"❌ Token validation failed: {data['error'].get('message', 'Unknown error')}")
            return False
        
        print(f"✅ Token valid! User: {data.get('name', 'Unknown')}")

    # Step 2: Get pages
    print("\n2. Fetching available pages...")
    async with httpx.AsyncClient() as client:
        url = f"https://graph.facebook.com/v22.0/me/accounts?access_token={ACCESS_TOKEN}"
        resp = await client.get(url)
        data = resp.json()
        
        if 'error' in data:
            print(f"❌ Failed to fetch pages: {data['error'].get('message', 'Unknown error')}")
            return False
        
        accounts = data.get('data', [])
        print(f"✅ Found {len(accounts)} page(s):")
        for acc in accounts:
            print(f"   - {acc.get('name', 'Unknown')} ({acc['id']})")

    # Step 3: Get Instagram account for Professor Lemos page
    print(f"\n3. Fetching Instagram account for page {PAGE_ID}...")
    async with httpx.AsyncClient() as client:
        url = f"https://graph.facebook.com/v22.0/{PAGE_ID}?fields=instagram_business_account&access_token={ACCESS_TOKEN}"
        resp = await client.get(url)
        data = resp.json()
        
        if 'error' in data:
            print(f"❌ Failed to get Instagram account: {data['error'].get('message', 'Unknown error')}")
            print(f"   Error details: {data['error']}")
            return False
        
        ig_account = data.get('instagram_business_account')
        if not ig_account:
            print(f"❌ No Instagram Business account connected to this page")
            print(f"   Page data: {data}")
            return False
        
        print(f"✅ Instagram Business Account found!")
        print(f"   ID: {ig_account['id']}")

    # Step 4: Get Instagram info
    print(f"\n4. Fetching Instagram account info...")
    async with httpx.AsyncClient() as client:
        url = f"https://graph.facebook.com/v22.0/{ig_account['id']}?fields=username,name,biography,followers_count,media_count&access_token={ACCESS_TOKEN}"
        resp = await client.get(url)
        data = resp.json()
        
        if 'error' in data:
            print(f"❌ Failed to get Instagram info: {data['error'].get('message', 'Unknown error')}")
            return False
        
        print(f"✅ Instagram Account Info:")
        print(f"   Username: @{data.get('username', 'N/A')}")
        print(f"   Name: {data.get('name', 'N/A')}")
        print(f"   Followers: {data.get('followers_count', 0):,}")
        print(f"   Media Count: {data.get('media_count', 0):,}")
        print(f"   Bio: {data.get('biography', 'N/A')[:100]}")

    # Step 5: Get Instagram insights
    print(f"\n5. Fetching Instagram insights...")
    async with httpx.AsyncClient() as client:
        url = f"https://graph.facebook.com/v22.0/{ig_account['id']}/insights?metric=follower_count,impressions,reach,profile_views&period=day&access_token={ACCESS_TOKEN}"
        resp = await client.get(url)
        data = resp.json()
        
        if 'error' in data:
            print(f"⚠️  Insights not available: {data['error'].get('message', 'Unknown error')}")
            print(f"   This may require additional permissions (instagram_manage_insights)")
        else:
            print(f"✅ Instagram Insights:")
            for metric in data.get('data', []):
                if metric.get('values'):
                    value = metric['values'][0].get('value', 0)
                    print(f"   {metric['name']}: {value:,}")

    print("\n" + "=" * 80)
    print("✅ ALL TESTS PASSED!")
    print("=" * 80)
    print("\nThe Instagram connection is working correctly.")
    print("You can now access insights at: /api/social/insights?platform=instagram")
    return True

if __name__ == "__main__":
    asyncio.run(test_connection())

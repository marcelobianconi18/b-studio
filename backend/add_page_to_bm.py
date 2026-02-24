#!/usr/bin/env python3
"""
Script para adicionar página órfã ao Business Manager.

Como você tem acesso ao portfólio, pode compartilhar a página.
"""

import httpx
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

ACCESS_TOKEN = os.getenv('FACEBOOK_ACCESS_TOKEN')
PAGE_ID = '111540438988959'
PORTFOLIO_ID = '387142802309764'
TARGET_BM_ID = '2827983370689483'  # deputadowelter

async def share_page_to_bm():
    async with httpx.AsyncClient(timeout=30.0) as client:
        print('=' * 80)
        print('ADICIONAR PÁGINA AO BUSINESS MANAGER')
        print('=' * 80)
        
        print(f'\n📄 Página: {PAGE_ID}')
        print(f'🏢 BM Destino: {TARGET_BM_ID}')
        print(f'📦 Portfólio Origem: {PORTFOLIO_ID}')
        
        # Método: Adicionar página ao BM
        print(f'\n🔄 Tentando adicionar página ao BM...')
        
        url = f'https://graph.facebook.com/v22.0/{TARGET_BM_ID}/owned_pages'
        params = {
            'page': PAGE_ID,
            'access_token': ACCESS_TOKEN
        }
        
        resp = await client.post(url, params=params)
        result = resp.json()
        
        if 'error' in result:
            error_msg = result['error'].get('message', 'Unknown error')
            print(f'\n❌ Erro ao adicionar:')
            print(f'   {error_msg}')
            
            if 'already' in error_msg.lower():
                print(f'\n✅ A página já está em algum BM!')
            elif 'permission' in error_msg.lower():
                print(f'\n⚠️  Sem permissão - precisa de acesso admin ao portfólio')
            elif 'ownership' in error_msg.lower():
                print(f'\n⚠️  Conflito de propriedade')
        else:
            print(f'\n✅ SUCESSO!')
            print(f'✅ Página adicionada ao Business Manager!')
            print(f'\n📍 Verifique em:')
            print(f'   https://business.facebook.com/{TARGET_BM_ID}/settings/pages')
        
        print('=' * 80)

asyncio.run(share_page_to_bm())

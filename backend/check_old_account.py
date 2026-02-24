#!/usr/bin/env python3
"""
Script para verificar se existe conta Facebook vinculada ao email antigo.
"""

import httpx
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

# Email antigo da campanha 2022
# SUBSTITUA PELO EMAIL REAL QUE VOCÊ TEM ACESSO
OLD_EMAIL = "SEU_EMAIL_ANTIGO@EMAIL.COM"

async def check_account_exists(email):
    """Verifica se existe conta Facebook neste email."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Tenta encontrar perfil pelo email
        url = "https://graph.facebook.com/v22.0/search"
        params = {
            "type": "user",
            "q": email,
            "access_token": "APP_ID|APP_SECRET"  # Não temos, mas vamos tentar outro método
        }
        
        # Método alternativo: tentar login
        url = "https://www.facebook.com/login/identify"
        data = {
            "email": email
        }
        
        resp = await client.post(url, data=data)
        
        return resp.text

async def main():
    print(f"\nVerificando conta para: {OLD_EMAIL}")
    print("\n⚠️  Este script é apenas informativo.")
    print("\nPara verificar manualmente:")
    print("1. Acesse: https://www.facebook.com/login/identify")
    print("2. Digite o email: " + OLD_EMAIL)
    print("3. Veja se o Facebook encontra a conta")
    print("\nSe encontrar:")
    print("✅ A conta existe - pode recuperar a senha")
    print("\nSe não encontrar:")
    print("❌ A conta foi excluída - precisa usar suporte Meta")

if __name__ == "__main__":
    asyncio.run(main())

from fastapi import APIRouter
import random

router = APIRouter()

@router.get("/insights")
def get_insights():
    """
    Returns data for Facebook Insights Dashboard (Looker Studio replica).
    """
    # Mock data to match the screenshot provided by user
    return {
        "page_followers": { "value": 344000, "change": 0.9 },
        "total_reactions": { "value": 73000, "change": 0.0 }, # Screenshot implies no change or stable
        "organic_video_views": { "value": 433000, "change": 9.7 },
        "engagements": { "value": 134000, "change": 108.5 },
        "number_of_posts": { "value": 157, "change": -53.4 },
        "organic_impressions": { "value": 0, "change": 0.0 }, # As seen in screenshot? Might be a bug in their data, so we replicate it
        "actions_split": { "reactions": 72756, "comments": 55941, "shares": 5672 },
        "top_posts": [
            {
                "id": "1",
                "image": "https://placehold.co/100x100/png",
                "message": "Para de andar na BR e vai trabalhar, Nikolas! ...",
                "date": "21 de jan. de 2026",
                "impressions": 0,
                "reach": 363785,
                "reactions": 15579,
                "comments": 16680,
                "shares": 1657,
                "video_views": 250328
            },
            {
                "id": "2",
                "image": "https://placehold.co/100x100/png",
                "message": "2026 tá aí já! ...",
                "date": "11 de jan. de 2026",
                "impressions": 0,
                "reach": 231882,
                "reactions": 13469,
                "comments": 3415,
                "shares": 279,
                "video_views": 0
            },
            {
                "id": "3",
                "image": "https://placehold.co/100x100/png",
                "message": "Hoje é dia de TBT dessa obra que orgulha o Paraná...",
                "date": "15 de jan. de 2026",
                "impressions": 0,
                "reach": 180500,
                "reactions": 8500,
                "comments": 1200,
                "shares": 540,
                "video_views": 120000
            }
        ],
        "demographics": {
            "gender": { "male": 45, "female": 55 },
            "age": [
                {"range": "13-17", "male": 5, "female": 6},
                {"range": "18-24", "male": 15, "female": 18},
                {"range": "25-34", "male": 22, "female": 25},
                {"range": "35-44", "male": 18, "female": 20},
                {"range": "45-54", "male": 12, "female": 14},
                {"range": "55-64", "male": 8, "female": 9},
                {"range": "65+", "male": 4, "female": 6}
            ],
            "top_cities": [
                {"city": "São Paulo", "count": 12500},
                {"city": "Rio de Janeiro", "count": 8200},
                {"city": "Belo Horizonte", "count": 5100},
                {"city": "Curitiba", "count": 4800},
                {"city": "Salvador", "count": 3200}
            ]
        }
    }

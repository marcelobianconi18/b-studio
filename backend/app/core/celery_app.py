
from celery import Celery
import os
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "b_studio_worker",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.worker"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],  # Ignore other content
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "check-ads-performance-every-hour": {
            "task": "tasks.periodic_intelligence_check",
            "schedule": 3600.0, # Every hour
        },
    },
)

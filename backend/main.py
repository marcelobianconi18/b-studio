
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from app.routers import posts, ads, auth, intelligence, social, system, dashboard, insights
from app.core.database import engine, Base

# Import OAuth and Dashboard routers
from oauth_manager import router as oauth_router
from dashboard_api import router as dashboard_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="B-Studio API",
    description="Backend for Scheduling & Ads Management (The Execution Arm of Bia)",
    version="0.1.0"
)

# CORS Configuration
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(posts.router, prefix="/api/posts", tags=["posts"])
app.include_router(ads.router, prefix="/api/ads", tags=["ads"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(intelligence.router, prefix="/api/intelligence", tags=["intelligence"])
app.include_router(social.router, prefix="/api/social", tags=["social"])
app.include_router(insights.router, prefix="/api/social", tags=["social-insights"])
app.include_router(system.router, prefix="/api/system", tags=["system"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])

# OAuth Routes
app.include_router(oauth_router, prefix="/api", tags=["oauth"])

# Dashboard Routes
app.include_router(dashboard_router, prefix="/api", tags=["dashboard-api"])

@app.get("/")
def read_root():
    return {"message": "B-Studio Backend is Running 🚀"}

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "b-studio-api"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)

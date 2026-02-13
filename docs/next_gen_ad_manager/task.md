# Implementation Checklist

## 🚀 Phase 1: Core "War Room" (Gestor de Tráfego)
- [x] **Backend: Meta Marketing API Integration**
    - [x] Set up `MetaAdsService` (fetch campaigns, insights).
    - [x] Standardize data models for Ad Account, Campaign, AdSet, Ad.
    - [x] 1-Year Historical Audit endpoint.
- [x] **Frontend: Dashboard MVP**
    - [x] Connect to backend API.
    - [x] Real-time metrics display (Spend, CPC, CTR).
    - [x] "Agent Mode" toggle (Auto-Pilot / Manual).
    - [x] Historical Audit UI.

## 🎨 Phase 2: "The Bridge" (Social Media Studio)
- [x] **Backend: Organic Data Fetching**
    - [x] `get_page_insights` (Reach, Engagement, Growth).
    - [x] AI analysis of "Blended Reach" (Organic + Paid).
- [x] **Frontend: Social Studio**
    - [x] Dedicated "Creative Studio" Dashboard.
    - [x] Sidebar Navigation (Ads vs Social).
    - [x] Smart Publisher (Preview & Schedule Interface).

## 📥 Phase 3: Unified Inbox & CRM
- [x] **Backend: Interaction Manager**
    - [x] Polling service for latest comments/DMs.
    - [x] AI Intent Classification (HOT, WARM, COLD).
- [x] **Frontend: Inbox UI**
    - [x] Unified Inbox Interface with "Heat Tags".
    - [x] Filter by "Paid Comments" (Sales Desk Module).

## ⚙️ Phase 4: Infrastructure & Reliability
- [ ] **API Health Monitoring**
    - [ ] Middleware to track Meta API latency and errors.

## 🧠 Phase 5: The "Next-Gen" Intelligence (New Modules)
- [x] **Module 3: Asset Liquidity Hub**
    - [x] **Backend**: `MetaAdsService.get_ad_insights_daily` (Fetch daily CTR/Freq).
    - [x] **Backend**: `StrategistAgent.check_creative_fatigue` (Logic: Drop > 20%).
    - [x] **Frontend**: Fatigue Alert Widget in Dashboard.
- [x] **Module 1: Organic-to-Paid Engine**
    - [x] **Backend**: `MetaService.get_post_insights` (Fetch Reach/Engagement for posts).
    - [x] **Backend**: `StrategistAgent.detect_viral_anomalies` (Calc Engagement Rate, Flag > 2x Avg).
    - [x] **Frontend**: "Viral Alert" Widget in Dashboard.
- [x] **Module 4: True ROI Dashboard**
    - [x] **Backend**: `FinancialService` for blended cost calculations.
    - [x] **Frontend**: Settings input for "Fixed Agency/Team Cost".
    - [x] **Frontend**: Dashboard widgets for "True CAC" and "Blended ROI".

## 🛡️ Phase 6: Production Hardening (SaaS Ready)
- [x] **API Resilience (Graph API)**
    - [x] Implement `tenacity` for retry logic with exponential backoff on all Meta API calls.
    - [x] Handle Rate Limiting (429) & Token Expiration errors gracefully.
- [ ] **Multi-Tenancy & Security**
- [ ] **Multi-Tenancy & Security**
    - [ ] Enforce `organization_id` filtering on all DB queries (Row-Level Security).
    - [ ] Verify JWT token scope for every request.
- [ ] **Frontend State Management**
    - [ ] Refactor data fetching to use `React Query` (TanStack Query) or `SWR`.
    - [ ] Implement optimistic updates for cleaner UX (no flickering).

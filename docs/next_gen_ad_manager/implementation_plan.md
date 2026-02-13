# Next-Gen AdManager Implementation Plan

## Goal Description
Upgrade the "Ads Manager" from a standard interface to a proactive "Strategy Partner". This involves implementing the 4 key modules from the architecture report: Organic-to-Paid Engine, Sales Desk customizations, Asset Liquidity Hub, and True ROI Dashboard.

## User Review Required
> [!IMPORTANT]
> **Financial Inputs**: To calculate "True ROI", the user will need to input/configure their "Fixed Costs" (Agency Fee/Team Cost). We will need to create a settings interface for this.

## Proposed Changes

### Backend

#### [MODIFY] [meta_api.py](file:///Volumes/SSD%20Externo/reposit%C3%B3rios/b-studio/backend/app/services/meta_api.py)
- **Organic-to-Paid Engine**:
    - Enhance `get_page_n_posts` to include `insights.metric(post_impressions,post_engagements)` for each post.
    - Currently we only fetch basic fields; we need the metrics to calculate Engagement Rate (ER).

#### [MODIFY] [intelligence.py](file:///Volumes/SSD%20Externo/reposit%C3%B3rios/b-studio/backend/app/services/intelligence.py)
- **Organic-to-Paid Engine**:
    - Add `detect_viral_anomalies()`:
        - Fetch last 10 organic posts with insights.
        - Calculate Average ER (Engagement Rate = Engagements / Impressions).
        - Identify posts where `ER > Avg_ER * 1.5` (50% above average).
        - Flag these as "Viral Candidates" for boosting.

#### [MODIFY] [routers/intelligence.py](file:///Volumes/SSD%20Externo/reposit%C3%B3rios/b-studio/backend/app/routers/intelligence.py)
- Add endpoint `/api/intelligence/viral-monitor` to expose the anomalies.

### Frontend

#### [MODIFY] [page.tsx](file:///Volumes/SSD%20Externo/reposit%C3%B3rios/b-studio/frontend/app/page.tsx)
- **Organic-to-Paid Engine**:
    - Add "Viral Alert" widget next to "Fatigue Monitor".
    - Show the viral post with a "Boost Now" simulation button.

## Verification Plan

### Automated Logic Tests
- Unit test for `detect_viral_anomalies`: Feed mock organic data with one outlier and verify it gets flagged.

### Manual User Flow
1.  **Dashboard Check**: See if "Viral Alerts" widget appears.
2.  **Verify Logic**: Ensure the "Viral" post actually has higher engagement stats than the others (we can verify in the UI metrics).

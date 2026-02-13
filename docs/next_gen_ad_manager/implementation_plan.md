# Next-Gen AdManager Implementation Plan

## Goal Description
Upgrade the "Ads Manager" to a production-ready SaaS level by implementing robust error handling and API resilience.

## User Review Required
> [!IMPORTANT]
> **Production Hardening**: We are entering a stabilization phase. New features are paused in favor of reliability.

## Proposed Changes

### Backend Infrastructure

#### [MODIFY] [requirements.txt](file:///Volumes/SSD%20Externo/reposit%C3%B3rios/b-studio/backend/requirements.txt)
- Added `tenacity` library for advanced retry logic.

#### [MODIFY] [meta_api.py](file:///Volumes/SSD%20Externo/reposit%C3%B3rios/b-studio/backend/app/services/meta_api.py)
- **Retry Logic**:
    - Decorate API methods with `@retry`.
    - implementation: `stop=stop_after_attempt(3)`, `wait=wait_exponential(multiplier=1, min=4, max=10)`.
    - Retry on `requests.exceptions.RequestException` and 5xx errors.

#### [MODIFY] [meta_ads.py](file:///Volumes/SSD%20Externo/reposit%C3%B3rios/b-studio/backend/app/services/meta_ads.py)
- **Retry Logic**:
    - Apply similar `@retry` decorators to `get_campaigns`, `get_insights`, etc.
    - Handle `OAuthException` explicitly (Trigger alert for token refresh).

## Verification Plan

### Automated Logic Tests
- **Simulate Failure**: Temporarily break the API URL or disconnect network to verify retries occur 3 times before failing.
- **Rate Limit Simulation**: Mock a 429 response and verify exponential backoff wait time.

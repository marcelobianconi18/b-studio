
# B-Studio Automation Backend

This backend service handles the automation logic for B-Studio, specifically scheduling and publishing posts to Meta (Facebook).

## Prerequisites

- **Redis**: Must be installed and running (`brew install redis && brew services start redis`)
- **Python 3**: Installed via Homebrew or system.

## Setup

1.  **Environment Variables**:
    Edit `backend/.env` and add your Facebook Page credentials:
    ```env
    FACEBOOK_ACCESS_TOKEN=your_token_here
    FACEBOOK_PAGE_ID=your_page_id_here
    REDIS_URL=redis://localhost:6379/0
    ```

2.  **Install Dependencies**:
    ```bash
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    ```

## Running the Services

You need three terminal windows (or use `make` commands):

1.  **Redis** (if not running as service):
    ```bash
    redis-server
    ```

2.  **API Server** (FastAPI):
    ```bash
    cd backend
    source venv/bin/activate
    uvicorn main:app --reload --port 8001
    ```

3.  **Task Worker** (Celery):
    ```bash
    cd backend
    source venv/bin/activate
    export PYTHONPATH=$PYTHONPATH:.
    celery -A app.core.celery_app worker --loglevel=info
    ```

4.  **Task Scheduler** (Celery Beat):
    ```bash
    cd backend
    source venv/bin/activate
    export PYTHONPATH=$PYTHONPATH:.
    celery -A app.core.celery_app beat --loglevel=info
    ```

## Agent Modes

The system supports three operation modes:
-   **Manual**: No AI intervention.
-   **Hybrid**: AI analyzes data every hour and generates "Recommendations" in the dashboard.
-   **Automatic**: AI analyzes data and takes actions (like pausing ads) autonomously based on performance.

Run the test script to schedule a dummy post:
```bash
python backend/test_schedule_post.py
```
Check the worker logs to see the task execution result.

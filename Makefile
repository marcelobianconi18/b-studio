
# Makefile for B-Studio

PYTHON := python3
VENV := backend/venv
BIN := $(VENV)/bin

.PHONY: install services run-api run-worker clean

install:
	$(PYTHON) -m venv $(VENV)
	$(BIN)/pip install -r backend/requirements.txt

services:
	brew services start redis || true

run-api:
	cd backend && ../$(BIN)/uvicorn main:app --reload --port 8001

run-worker:
	cd backend && ../$(BIN)/celery -A app.core.celery_app worker --loglevel=info

clean:
	rm -rf $(VENV)
	find . -type d -name "__pycache__" -exec rm -rf {} +

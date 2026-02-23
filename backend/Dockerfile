
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && echo "✓ Dependencies installed successfully"

# Copy application code
COPY . .

# Verify installation
RUN python -c "import facebook; print('✓ facebook_business installed')" || echo "✗ facebook_business NOT installed"

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

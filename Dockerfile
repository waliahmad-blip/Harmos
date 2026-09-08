# syntax=docker/dockerfile:1
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH="/app"

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY packages/ ./packages/
COPY apps/ ./apps/

# Create unprivileged runtime user
RUN useradd -m -u 1000 harmos && \
    chown -R harmos:harmos /app
USER harmos

EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://127.0.0.1:8001/ || exit 1

CMD ["python", "-m", "uvicorn", "apps.gateway.main:app", "--host", "0.0.0.0", "--port", "8001"]

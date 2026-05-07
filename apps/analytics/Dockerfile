FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (gcc needed for some Python packages)
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY apps/analytics/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY apps/analytics/src ./src

# Create non-root user
RUN useradd -m -u 1000 worker && chown -R worker:worker /app
USER worker

CMD ["celery", "-A", "src.celery_app", "worker", "--loglevel=info", "--concurrency=2"]

FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    libgeos-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
# torch's default PyPI wheel bundles multi-GB CUDA libraries we never use here
# (no GPU in this deployment) and is slow/fragile to pull under constrained
# Docker build environments. Installing the CPU-only build from PyTorch's own
# index first is both smaller (~200MB vs ~2GB+) and more reliable.
RUN pip install --no-cache-dir torch==2.4.1 --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/app/ml_models
RUN chmod +x entrypoint.sh

EXPOSE 8000

CMD ["./entrypoint.sh"]

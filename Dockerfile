# ── Base image ───────────────────────────────────────────────────────────────
FROM python:3.11-slim

# curl_cffi needs a C compiler to build its native extension
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# ── App setup ─────────────────────────────────────────────────────────────────
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

# ── HF Spaces always exposes port 7860 ────────────────────────────────────────
EXPOSE 7860

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]

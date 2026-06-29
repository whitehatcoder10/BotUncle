# ---- Stage 1: install Python dependencies ----
FROM python:3.11-slim AS builder

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ---- Stage 2: small runtime image ----
FROM python:3.11-slim

# Run as a non-root user (safer in production)
RUN groupadd --system app && useradd --system --gid app app

WORKDIR /app

COPY --from=builder /install /usr/local
COPY . .

RUN chown -R app:app /app

USER app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

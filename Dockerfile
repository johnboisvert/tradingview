FROM python:3.11-slim-bookworm

ENV PYTHONUNBUFFERED=1
WORKDIR /app

COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r requirements.txt

COPY . /app/

RUN useradd -m appuser \
 && mkdir -p /app/data /tmp/ai_trader \
 && chown -R appuser:appuser /app /tmp/ai_trader

USER appuser

CMD ["sh","-c","uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --log-level info"]

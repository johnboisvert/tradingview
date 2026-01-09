FROM python:3.11-slim-bookworm

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app

COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r requirements.txt

COPY *.py /app/

RUN useradd -m appuser
USER appuser

# Ne PAS forcer PORT ici. Railway le fournit.
# ENV PORT=8000  <-- à enlever

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]

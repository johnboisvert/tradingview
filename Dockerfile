FROM python:3.11-slim-bookworm

WORKDIR /app

# Bonnes pratiques + défaut DB_DIR (tu peux l’override dans Railway)
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    DB_DIR=/app/data

# Dépendances
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir -r /app/requirements.txt

# Code
COPY . /app

# Dossiers nécessaires (volume + runtime)
RUN mkdir -p /app/data /tmp/ai_trader \
 && chmod -R 777 /app/data /tmp/ai_trader

# Entrypoint
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh \
 && chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

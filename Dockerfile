# ============================================================================
# 🐳 CryptoIA Trading Platform - Dockerfile
# Optimisé pour Railway et production
# ============================================================================

FROM python:3.11-slim-bookworm

# Métadonnées
LABEL maintainer="CryptoIA Team"
LABEL version="2.0"
LABEL description="CryptoIA Trading Platform"

# Variables d'environnement
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONFAULTHANDLER=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PORT=8080

# Répertoire de travail
WORKDIR /app

# Installer les dépendances système
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copier et installer les dépendances Python
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -r /app/requirements.txt

# Copier le code source
COPY . /app/

# Créer les répertoires nécessaires
RUN mkdir -p /app/data /app/logs /tmp/ai_trader /tmp/ebooks /tmp/uploads \
    && chmod -R 755 /app \
    && chmod -R 777 /app/data /tmp/ai_trader /tmp/ebooks /tmp/uploads

# Copier et configurer l'entrypoint
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh \
    && chmod +x /usr/local/bin/docker-entrypoint.sh

# Exposer le port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Entrypoint
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
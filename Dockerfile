FROM python:3.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFEROUSED=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Déps
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir -r /app/requirements.txt

# Code
COPY . /app/

# Dossiers (volume + tmp)
RUN mkdir -p /app/data /tmp/ai_trader /tmp/ebooks \
 && chmod -R 777 /app/data /tmp/ai_trader /tmp/ebooks

# Entrypoint
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh \
 && chmod +x /usr/local/bin/docker-entrypoint.sh

# (Optionnel mais utile)
EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

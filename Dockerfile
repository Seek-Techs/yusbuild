# YusBuild API - Django REST Framework
# Production-ready Dockerfile for BuildTech Solutions

FROM python:3.12-slim

# Environment
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=config.settings

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Work directory
WORKDIR /app

# Python dependencies
COPY requirements.txt .

RUN pip install --default-timeout=1000 --trusted-host pypi.org --trusted-host files.pythonhosted.org -r requirements.txt
# Copy project
COPY . .

# Create log directory
RUN mkdir -p /app/logs

# Collect static files
RUN python manage.py collectstatic --noinput

# Expose port
EXPOSE 8000

# Run gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "2", "--timeout", "60", "--access-logfile", "-", "--error-logfile", "-", "config.wsgi:application"]

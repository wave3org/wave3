# Use a pinned Python slim image on Debian Bookworm with security fixes
FROM python:3.11.11-slim-bookworm

# Set working directory
WORKDIR /app

# Apply latest OS security updates
RUN apt-get update \
	&& apt-get upgrade -y \
	&& rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY packages/ml/requirements.txt ./

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY packages/ml/ .

# Run the application
CMD ["python", "server.py"]

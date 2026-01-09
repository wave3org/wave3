# Use Python slim image for smaller size
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY packages/ml/requirements.txt ./

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY packages/ml/ .

# Run the application
CMD ["python", "ml.py"]

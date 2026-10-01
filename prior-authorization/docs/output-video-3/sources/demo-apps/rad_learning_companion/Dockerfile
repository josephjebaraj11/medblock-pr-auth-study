# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


# --- Stage 1: Build the React Frontend ---
FROM node:20-slim AS frontend-builder
WORKDIR /app
# Add a build argument to force a rebuild (and not use cache) when new code is pushed
ARG CACHE_BUSTER=1
COPY frontend/package.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# --- Stage 2: Build the Final Production Image with Flask ---
FROM python:3.10-slim
ENV PYTHONUNBUFFERED=1
ENV CACHE_DIR=/data/cache

# Set the NLTK data path environment variable.
# This tells NLTK where to look for data for ALL users.
ENV NLTK_DATA=/usr/local/share/nltk_data

# Install system dependencies first, as they change less frequently
RUN apt-get update && \
    apt-get install -y unzip --no-install-recommends

RUN useradd -m -s /bin/bash -u 1000 user
WORKDIR /app

# Copy and install Python requirements from the backend folder
COPY --chown=user:user backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download the required NLTK data.
# This command downloads it to the directory specified by $NLTK_DATA.
RUN python -m nltk.downloader -d $NLTK_DATA punkt punkt_tab

# Copy the entire backend application code
COPY --chown=user:user backend/ .

# Copy the built frontend from the first stage into the correct directory
COPY --chown=user:user --from=frontend-builder /app/dist ./frontend/dist

RUN mkdir -p $CACHE_DIR
RUN chmod -R 777 $CACHE_DIR

# Define the path to your potential zip file
ENV ZIP_FILE_PATH ./default_cache/rad-learn-cache.zip

# Conditionally unzip the file
RUN if [ -f "$ZIP_FILE_PATH" ]; then \
    unzip -o "$ZIP_FILE_PATH" -d $CACHE_DIR && \
    chmod -R 777 $CACHE_DIR && \
    rm "$ZIP_FILE_PATH"; \
fi

RUN mkdir /app/persistent_cache \
          /app/processed_figures_kb \
          /app/chroma_db_store

RUN chown user:user /app/persistent_cache \
                     /app/processed_figures_kb \
                     /app/chroma_db_store

# Switch to the non-root user for security
USER user

# Expose the port
EXPOSE 7860

# Run the production server
CMD ["gunicorn", \
     "--bind", "0.0.0.0:7860", \
     "--timeout", "600", \
     "--worker-class", "gthread", \
     "--workers", "1", \
     "--threads", "4", \
     "app:app"]
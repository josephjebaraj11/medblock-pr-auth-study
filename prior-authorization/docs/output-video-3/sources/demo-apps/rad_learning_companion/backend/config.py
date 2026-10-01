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

import os
from pathlib import Path

MEDGEMMA_LOCATION = os.environ.get("MEDGEMMA_LOCATION") # POSSIBLE VALUES are HUGGING_FACE, VERTEX_AI

GCLOUD_SA_KEY = os.environ.get("GCLOUD_SA_KEY", None)

HF_TOKEN = os.environ.get("HF_TOKEN", None)

USE_CACHE = os.getenv('USE_CACHE', 'true').lower() in ('true', '1', 't')
RANDOMIZE_CHOICES = os.getenv('RANDOMIZE_CHOICES', 'true').lower() in ('true', '1', 't')

BASE_DIR = Path(__file__).parent.resolve()

MEDGEMMA_ENDPOINT_URL = os.environ.get("MEDGEMMA_ENDPOINT_URL", None)

# path to the built React app's 'dist' folder
STATIC_DIR = BASE_DIR / 'frontend' / 'dist'

MANIFEST_CSV_PATH = BASE_DIR / 'data' / 'reports_manifest.csv'

MAX_NUMBER_OF_MCQ_QUESTIONS = 5

GUIDELINE_PDF_PATH = BASE_DIR / 'data' / 'who_chestxray_guideline_9241546778_eng.pdf'

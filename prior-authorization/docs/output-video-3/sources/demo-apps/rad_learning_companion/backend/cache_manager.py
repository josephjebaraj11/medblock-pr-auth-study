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

import logging
from dataclasses import asdict
from pathlib import Path

import diskcache as dc

from models import ClinicalMCQ, CaseSummary

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class CacheManager:
    """
    Manages a persistent, on-disk cache for the demo using diskcache.
    This class is thread-safe and process-safe.
    """

    def __init__(self, cache_directory: str | Path):
        self.cache_directory = cache_directory
        self.cache = dc.Cache(str(cache_directory))
        logger.info(f"✅ DemoCacheManager initialized. Cache directory: {cache_directory}")

    def get_all_mcqs_sequence(self, case_id: str) -> list[ClinicalMCQ] | None:
        """Retrieves the list of MCQs for a case."""
        mcq_list = self.cache.get(f"{case_id}_full_mcqs")
        if mcq_list is not None:
            return [ClinicalMCQ(**data) for data in mcq_list]
        return []

    def add_all_mcqs_to_case(self, case_id: str, all_mcqs: list[ClinicalMCQ]):
        """Set the list of MCQs to the given case in the cache."""
        with self.cache.transact():
            list_of_mcqs = [asdict(mcq) for mcq in all_mcqs]
            self.cache.set(f"{case_id}_full_mcqs", list_of_mcqs)
        logger.info(f"✅ Cache updated for case '{case_id}' with all MCQs.")

    def get_summary_template(self, case_id: str) -> CaseSummary | None:
        """Retrieves the summary template for a case."""
        template_dict = self.cache.get(f"{case_id}_summary_template")
        if template_dict:
            try:
                # The rationale will be empty in the template
                return CaseSummary.from_dict(template_dict)
            except (TypeError, KeyError):
                logger.error("Deserialization of the cached summary template failed.")
                return None
        return None

    def save_summary_template(self, case_id: str, template: CaseSummary):
        """Saves a summary template to the cache."""
        self.cache.set(f"{case_id}_summary_template", asdict(template))
        logger.info(f"✅ Summary template saved for case '{case_id}'.")

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

import csv
import json
import logging
import random
import re
from dataclasses import replace
from pathlib import Path

from config import BASE_DIR, RANDOMIZE_CHOICES
from models import Case, CaseSummary, AnswerLog, ConversationTurn, QuestionOutcome, ClinicalMCQ

# --- Configuration ---
# Configure basic logging (optional, adjust as needed)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def fetch_report(report_path: Path):
    """Report file reading utility function."""
    try:
        with open(report_path, 'r') as f:
            report = json.load(f)
        logger.info(f"Successfully loaded '{report_path}' into memory.")
        return report
    except FileNotFoundError:
        logger.error(f"ERROR: Could not find report file: {report_path}")
        return ""


def get_available_reports(reports_csv_path: Path):
    """Reads available reports as Cases for this demo."""
    available_reports: dict[str, Case] = {}
    if reports_csv_path.is_file():
        try:
            with (open(reports_csv_path, mode='r', encoding='utf-8') as csvfile):
                reader = csv.DictReader(csvfile)
                required_headers = {'case_id', 'case_condition_name', 'report_path', 'download_image_url', 'findings'}
                if not required_headers.issubset(reader.fieldnames):
                    logger.error(
                        f"CSV file {reports_csv_path} is missing one or more required headers: {required_headers - set(reader.fieldnames)}"
                    )
                else:
                    for row in reader:
                        case_id = row['case_id']
                        condition_name = row['case_condition_name']
                        report_path_from_csv = row['report_path']  # e.g., static/reports/report1.txt or empty
                        download_image_url_from_csv = row['download_image_url']
                        potential_findings = row['findings']

                        # Construct absolute path for report file validation (paths from CSV are relative to BASE_DIR)
                        abs_report_path_to_check = BASE_DIR / report_path_from_csv
                        if not abs_report_path_to_check.is_file():
                            logger.warning(
                                f"Image file not found for case '{case_id}' at '{abs_report_path_to_check}'. Skipping this entry.")
                            continue

                        if download_image_url_from_csv is None or download_image_url_from_csv == "":
                            logger.warning(
                                f"Download image url not found for case '{case_id}'. Skipping this entry.")
                            continue

                        ground_truth_labels = fetch_report(report_path_from_csv)
                        case = Case(
                            id=case_id,
                            condition_name=condition_name,
                            ground_truth_labels=ground_truth_labels,
                            download_image_url=download_image_url_from_csv,
                            potential_findings=potential_findings,
                        )
                        available_reports[str(case_id)] = case
                    logger.info(f"Loaded {len(available_reports)} report/image pairs from CSV.")

        except Exception as e:
            logger.error(f"Error reading or processing CSV file {reports_csv_path}: {e}", exc_info=True)
    else:
        logger.warning(f"Manifest CSV file not found at {reports_csv_path}. AVAILABLE_REPORTS will be empty.")
    return available_reports


def get_json_from_model_response(response_text: str) -> dict:
    """
    Robustly parses a JSON object from a response that may contain it
    within a markdown code block.
    """
    # This regex now looks for a JSON object starting with { and ending with }
    json_match = re.search(r"```json\s*(\{.*?\})\s*```", response_text, re.DOTALL)
    if json_match:
        json_str = json_match.group(1)
        try:
            return json.loads(json_str)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to decode JSON after extraction: {e}")
            raise Exception(f"Could not parse JSON from extracted block: {json_str}")

    # Fallback if the model misses the markdown block
    logger.warning("Could not find a ```json block. Falling back to raw search.")
    json_match_fallback = re.search(r"(\{.*\})", response_text, re.DOTALL)
    if json_match_fallback:
        return json.loads(json_match_fallback.group(1))

    raise Exception(f"Could not find or parse JSON object in the API response: {response_text}")


def get_potential_findings(case: Case) -> str:
    """Get potential findings for a case."""
    return case.potential_findings


def build_summary_template(case: Case, rag_cache: dict) -> CaseSummary:
    """Builds summary template with static data like potential_findings, guideline_resources and condition."""
    citation_string = ""  # Default
    rag_data = rag_cache.get(case.id, {})
    citations = rag_data.get("citations", [])
    if citations:
        citation_string = ', '.join(map(str, citations))

    return CaseSummary(
        med_gemma_interpretation="",
        potential_findings=get_potential_findings(case),
        rationale=[],
        guideline_specific_resource=citation_string,
        condition=case.condition_name
    )


def populate_rationale(summary_template: CaseSummary, conversation_history: list[ConversationTurn]) -> CaseSummary:
    """Populates rationale and interpretation depending on user journey."""
    correct_count = 0
    total_questions = len(conversation_history)
    rationale_logs = []

    for turn in conversation_history:
        question = turn.clinicalMcq.question
        choices = turn.clinicalMcq.choices
        model_answer_key = turn.clinicalMcq.answer
        user_attempt1_key = turn.userResponse.attempt1
        user_attempt2_key = turn.userResponse.attempt2
        correct_answer_text = choices.get(model_answer_key, f"N/A - Model Answer Key '{model_answer_key}' not found.")

        outcomes = []
        if user_attempt1_key != model_answer_key and user_attempt2_key != model_answer_key:
            user_attempt_key = user_attempt2_key if user_attempt2_key else user_attempt1_key
            incorrect_text = choices[user_attempt_key]
            outcomes.append(QuestionOutcome(type="Incorrect", text=incorrect_text))
        else:
            correct_count += 1
        outcomes.append(QuestionOutcome(type="Correct", text=correct_answer_text))

        rationale_logs.append(AnswerLog(question=question, outcomes=outcomes))

    accuracy = (correct_count / total_questions) * 100 if total_questions > 0 else 0

    if accuracy == 100:
        interpretation = f"Wonderful job! You achieved a perfect score of {accuracy:.0f}%, correctly identifying all key findings on your first attempt."
    elif accuracy >= 50:
        interpretation = f"Good job. You scored {accuracy:.0f}%, showing a solid understanding of the key findings for this case."
    else:
        interpretation = f"This was a challenging case, and you scored {accuracy:.0f}%. More preparation is needed. Review the rationale below for details."

    return CaseSummary(
        med_gemma_interpretation=interpretation,
        potential_findings=summary_template.potential_findings,
        rationale=rationale_logs,
        guideline_specific_resource=summary_template.guideline_specific_resource,
        condition=summary_template.condition,
    )


def randomize_mcqs(original_mcqs: list[ClinicalMCQ]) -> list[ClinicalMCQ]:
    """
    Takes a list of clinical MCQs and randomizes their answer choices.
    If an error occurs while randomizing a question, it returns the original question
    in its place and continues.
    """
    if not RANDOMIZE_CHOICES:
        return original_mcqs
    randomized_questions = []

    for q in original_mcqs:
        try:
            # --- Step 1: Identify the correct answer's text ---
            # Before shuffling, we save the actual string of the correct answer.
            correct_answer_text = q.choices[q.answer]

            # --- Step 2: Shuffle the choice values ---
            # We extract the choice texts into a list and shuffle them in place.
            choice_texts = list(q.choices.values())
            random.shuffle(choice_texts)

            # --- Step 3: Rebuild choices and find the new answer key (Concise version) ---
            # Pair the original sorted keys with the newly shuffled texts using zip.
            keys = sorted(q.choices.keys())
            new_choices = dict(zip(keys, choice_texts))

            # Efficiently find the new key corresponding to the correct answer's text.
            new_answer_key = next(key for key, value in new_choices.items() if value == correct_answer_text)

            # --- Step 4: Create an updated, immutable copy of the question ---
            # Using `dataclasses.replace` is a clean, Pythonic way to create a new
            # instance with updated values, promoting immutability.
            randomized_q = replace(q, choices=new_choices, answer=new_answer_key)
            randomized_questions.append(randomized_q)
        except Exception as e:
            # If any error occurs (e.g., KeyError from a bad answer key),
            # print a warning and append the original, unmodified question.
            logger.warning(f"Warning: Could not randomize question '{q.id}'. Returning original. Error: {e}")
            randomized_questions.append(q)

    return randomized_questions

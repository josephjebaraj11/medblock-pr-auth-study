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
import os
import shutil  # For zipping the cache directory
from dataclasses import asdict
from functools import wraps
from pathlib import Path

from flask import Blueprint, request, jsonify, current_app, send_from_directory

import case_util
import config
from background_task_manager import BackgroundTaskManager
from models import ConversationTurn

# Use pathlib to construct the path to the images directory
# This is more robust than relative string paths.
IMAGE_DIR = Path(__file__).parent / 'data/images'

main_bp = Blueprint('main', __name__)
logger = logging.getLogger(__name__)

@main_bp.after_request
def log_full_cycle(response):
    """
    This function runs after a request and has access to both
    the incoming 'request' and the outgoing 'response'.
    """
    if response.status_code != 200:
        logger.error(
            f"Request: {request.method} {request.path} | "
            f"Response Status: {response.status}"
        )
    # You MUST return the response object
    return response

@main_bp.route('/api/case/<case_id>/stub', methods=['GET'])
def get_case(case_id):
    available_reports = current_app.config["AVAILABLE_REPORTS"]
    if case_id not in available_reports:
        logger.error(f"Case Id {case_id} does not exist.")
        return jsonify({"error": f"Case Id {case_id} does not exist."}), 400

    return jsonify(asdict(available_reports.get(case_id)))


@main_bp.route('/api/case/stub', methods=['GET'])
def get_cases():
    available_reports = current_app.config["AVAILABLE_REPORTS"]
    cases = available_reports.values()
    return jsonify([asdict(case) for case in cases])


def rag_initialization_complete_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        task_manager: BackgroundTaskManager = current_app.config.get('TASK_MANAGER')

        # Check if RAG task has failed
        if task_manager.get_error("rag_system"):
            return jsonify({"error": "A critical background task failed. Check application logs."}), 500

        # Check if RAG task is still running
        if not task_manager.is_task_done("rag_system"):
            logger.warning("RAG initialization is running..")
            response = jsonify(
                {"status": "initializing", "message": "The system is starting up. Please try again in 60 seconds."})
            response.headers['Retry-After'] = 60
            return response, 503

        return f(*args, **kwargs)

    return decorated_function


@main_bp.route('/api/case/<case_id>/all-questions', methods=['GET'])
@rag_initialization_complete_required
def get_all_questions(case_id):
    """Retrieves all questions for a given case ID, prioritizing cached data and generating live questions via LLM if necessary."""
    logger.info(f"Retrieve all questions for the given case '{case_id}'")

    cache_manager = current_app.config['DEMO_CACHE']
    # 1. Check the cache first
    if config.USE_CACHE and cache_manager:
        all_mcqs_sequence = cache_manager.get_all_mcqs_sequence(case_id)
        if len(all_mcqs_sequence) > 0:
            logger.info(f"CACHE HIT for case '{case_id}'")
            randomized_choices_mcqs = case_util.randomize_mcqs(all_mcqs_sequence)
            return jsonify([asdict(mcq) for mcq in randomized_choices_mcqs])

    # 2. CACHE MISS: Generate live
    logger.info(
        f"CACHE MISS or cache disabled for case '{case_id}'. Generating live question...")

    llm_client = current_app.config['LLM_CLIENT']
    if not llm_client:
        logger.error(
            "LLM client (REST API) not initialized. Cannot process request.")
        return jsonify({"error": "LLM client not initialized."}), 500

    static_case_info = current_app.config['AVAILABLE_REPORTS'].get(case_id)
    if not static_case_info:
        logger.error(f"Static case data for id {case_id} not found.")
        return jsonify({"error": f"Static case data for id {case_id} not found."}), 404

    rag_cache = current_app.config.get('RAG_CONTEXT_CACHE', {})
    prefetched_data = rag_cache.get(case_id, {})
    guideline_context_string = prefetched_data.get("context_string", "")

    live_generated_mcqs = llm_client.generate_all_questions(
        case_data=asdict(static_case_info),
        guideline_context=guideline_context_string
    )

    if live_generated_mcqs is not None and len(live_generated_mcqs) > 0:
        # 3. WRITE-THROUGH: Update the cache with the new question if caching is enabled
        if config.USE_CACHE and cache_manager:
            cache_manager.add_all_mcqs_to_case(case_id, live_generated_mcqs)
        randomized_choices_mcqs = case_util.randomize_mcqs(live_generated_mcqs)
        return jsonify([asdict(mcq) for mcq in randomized_choices_mcqs]), 200
    else:
        logger.error("MCQ Sequence generation failed.")
        return jsonify(
            {"error": "MCQ Sequence generation failed."}), 500


@main_bp.route('/api/case/<case_id>/summarize', methods=['POST'])
@rag_initialization_complete_required
def get_case_summary(case_id):
    """
    API endpoint to generate a case summary.
    This version first attempts to load from cache, then falls back to building on the fly.
    """
    data = request.get_json(force=True)
    conversation_history_data = data.get('conversation_history')
    if not conversation_history_data:
        logger.error(f"Missing 'conversation_history' in request body for case {case_id}.")
        return jsonify({"error": f"Missing 'conversation_history' in request body for case {case_id}."}), 400

    try:
        summary_template = None
        # First, try to get the summary from the cache, if caching is enabled
        cache_manager = current_app.config.get('DEMO_CACHE')
        if cache_manager:
            summary_template = cache_manager.get_summary_template(case_id)
            if summary_template:
                logger.info(f"Summary template for case {case_id} found in cache.")

        # If cache is disabled OR the template was not in the cache, build it now
        if summary_template is None:
            logger.warning(f"Summary template for case {case_id} not in cache or cache disabled. Building on the fly.")
            static_case_info = current_app.config['AVAILABLE_REPORTS'].get(case_id)
            if not static_case_info:
                logger.error(f"Static case data for case {case_id} not found.")
                return jsonify({"error": f"Static case data for case {case_id} not found."}), 404
            summary_template = case_util.build_summary_template(static_case_info,
                                                                current_app.config.get('RAG_CONTEXT_CACHE', {}))
            if cache_manager:
                cache_manager.save_summary_template(case_id, summary_template)

        if summary_template is None:
            logger.error(f"Summary template not found for case {case_id}.")
            return jsonify({"error": f"An internal error occurred."}), 500

        # Once summary template is ready, we can programmatically populate rationale based on user's journey
        conversation_turns = [ConversationTurn.from_dict(turn) for turn in conversation_history_data]
        summary = case_util.populate_rationale(summary_template, conversation_turns)
        return jsonify(asdict(summary)), 200
    except Exception as e:
        logger.error(f"Error generating summary for case {case_id}: {e}", exc_info=True)
        return jsonify({"error": f"An internal error occurred: {e}"}), 500


@main_bp.route('/app/download_cache')
@rag_initialization_complete_required
def download_cache_zip():
    """Zips the cache directory and serves it for download."""
    zip_filename = "rad-learn-cache.zip"
    # Create the zip file in a temporary directory
    # Using /tmp is common in containerized environments
    temp_dir = "/tmp"
    zip_base_path = os.path.join(temp_dir, "rad-learn-cache")  # shutil adds .zip
    zip_filepath = zip_base_path + ".zip"

    # Ensure the cache directory exists before trying to zip it
    cache_manager = current_app.config.get('DEMO_CACHE')
    cache_directory = cache_manager.cache_directory

    if not os.path.isdir(cache_directory):
        logger.error(f"Cache directory not found at {cache_directory}")
        return jsonify({"error": f"Cache directory not found on server: {cache_directory}"}), 500

    try:
        logger.info(f"Creating zip archive of cache directory: {cache_directory} to {zip_filepath}")
        shutil.make_archive(
            zip_base_path,  # This is the base name, shutil adds the .zip extension
            "zip",
            cache_directory,  # This is the root directory to archive
        )
        logger.info("Zip archive created successfully.")
        # Send the file and then clean it up
        return send_from_directory(temp_dir, zip_filename, as_attachment=True)
    except Exception as e:
        logger.error(f"Error creating or sending zip archive of cache directory: {e}", exc_info=True)
        return jsonify({"error": f"Error creating or sending zip archive: {e}"}), 500

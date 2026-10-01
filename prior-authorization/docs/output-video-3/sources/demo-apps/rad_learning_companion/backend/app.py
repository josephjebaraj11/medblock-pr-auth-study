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
import sys

from flask import Flask, send_from_directory

import case_util
import config
from llm_client import VertexAILLMClient
from llm_client import HuggingFaceLLMClient
from background_task_manager import BackgroundTaskManager
from cache_manager import CacheManager
from rag.knowledge_base import KnowledgeBase
from rag.model_manager import ModelManager
from rag.rag_context_engine import RAGContextEngine, format_context_messages_to_string
from routes import main_bp


def _get_llm_client():
    """Initializes the LLM client and handles exit on failure."""
    logger = logging.getLogger(__name__)

    if config.MEDGEMMA_LOCATION == 'HUGGING_FACE':
        logger.info("HUGGING_FACE MedGemma end point initialized.")
        return HuggingFaceLLMClient(config.HF_TOKEN, config.MEDGEMMA_ENDPOINT_URL)
    elif config.MEDGEMMA_LOCATION == 'VERTEX_AI':
        logger.info("Vertex AI MedGemma end point initialized.")
        return VertexAILLMClient(config.GCLOUD_SA_KEY, config.MEDGEMMA_ENDPOINT_URL)

    logger.critical("LLM client failed to initialize. API calls will fail.")
    sys.exit("Exiting: LLM client initialization failed.")

def _initialize_rag_system(flask_app: Flask):
    """Checks for persistent cache and initializes the RAG system."""
    logger = logging.getLogger(__name__)
    rag_context_cache = {}

    # RAG Run is not needed if cache is present.
    if config.USE_CACHE:
        cache_manager = flask_app.config['DEMO_CACHE']
        if len(cache_manager.cache) > 0:
            logger.warning(f"The cache is not empty, so not initialising the RAG system.")
            return
        else:
            logger.info(f"The cache is empty, so resuming the RAG initialisation")

    try:
        logger.info("--- Initializing RAG System and pre-fetching context... ---")
        rag_model_manager = ModelManager()
        rag_models = rag_model_manager.load_models()
        if not rag_models.get("embedder"): raise RuntimeError("RAG embedder failed to load.")

        knowledge_base = KnowledgeBase(models=rag_models)
        knowledge_base.build(pdf_filepath=config.GUIDELINE_PDF_PATH)
        if not knowledge_base.retriever: raise RuntimeError("Failed to build the RAG retriever.")

        rag_engine = RAGContextEngine(knowledge_base=knowledge_base)

        all_cases = flask_app.config.get("AVAILABLE_REPORTS", {})
        for case_id, case_data in all_cases.items():
            ground_truth_labels = case_data.ground_truth_labels
            if not ground_truth_labels: continue
            rag_queries = [label.lower() for label in ground_truth_labels.keys()]
            if "normal" in rag_queries: continue
            retrieved_docs = rag_engine.retrieve_context_docs_for_simple_queries(rag_queries)
            citations = sorted(list(
                set(doc.metadata.get("page_number") for doc in retrieved_docs if doc.metadata.get("page_number"))))
            context_messages, _ = rag_engine.build_context_messages(retrieved_docs)
            context_string = format_context_messages_to_string(context_messages)
            rag_context_cache[case_id] = {"context_string": context_string, "citations": citations}

        logger.info("✅ RAG System ready.")
    except Exception as e:
        logger.critical(f"FATAL: RAG System failed to initialize: {e}", exc_info=True)
        sys.exit("Exiting: RAG system initialization failed.")

    flask_app.config['RAG_CONTEXT_CACHE'] = rag_context_cache


def _initialize_demo_cache(flask_app: Flask):
    """Initializes the disk cache for MCQs and summary templates."""
    logger = logging.getLogger(__name__)
    if config.USE_CACHE:
        cache_dir = os.getenv('CACHE_DIR', config.BASE_DIR / "persistent_cache")
        cache_manager = CacheManager(cache_dir)
        flask_app.config['DEMO_CACHE'] = cache_manager
        logger.info("✅ Cache Setup Complete.")
    else:
        logger.warning("⚠️ Caching is DISABLED.")
        flask_app.config['DEMO_CACHE'] = None


def _register_routes(flask_app: Flask):
    """Registers blueprints and defines static file serving."""
    flask_app.register_blueprint(main_bp)

    @flask_app.route('/', defaults={'path': ''})
    @flask_app.route('/<path:path>')
    def serve(path):
        if path != "" and os.path.exists(os.path.join(flask_app.static_folder, path)):
            return send_from_directory(flask_app.static_folder, path)
        else:
            return send_from_directory(flask_app.static_folder, 'index.html')


def create_app():
    """Creates and configures the Flask application by calling modular helper functions."""
    application = Flask(__name__, static_folder=config.STATIC_DIR)

    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - [%(name)s] - %(message)s')

    # Sequentially call setup functions
    application.config["LLM_CLIENT"] = _get_llm_client()
    application.config["AVAILABLE_REPORTS"] = case_util.get_available_reports(config.MANIFEST_CSV_PATH)
    _initialize_demo_cache(application)
    task_manager = BackgroundTaskManager()
    application.config['TASK_MANAGER'] = task_manager
    # RAG and Cache initialization in the background
    task_manager.start_task(key="rag_system", target_func=_initialize_rag_system, flask_app=application)
    _register_routes(application)

    return application


app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=7860, debug=True)

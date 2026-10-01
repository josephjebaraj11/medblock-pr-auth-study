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
from typing import List

from PIL import Image
from langchain_core.documents import Document as LangchainDocument

from .knowledge_base import KnowledgeBase

logger = logging.getLogger(__name__)


def format_context_messages_to_string(context_messages: list[dict]) -> str:
    """Takes a list of context message dicts and formats them into a single string."""
    if not context_messages:
        return "No relevant context was retrieved from the guideline document."

    full_text = [
        msg.get("text", "") for msg in context_messages if msg.get("type") == "text"
    ]
    return "\n".join(full_text)


class RAGContextEngine:
    """Uses a pre-built KnowledgeBase to retrieve and format context for queries."""

    def __init__(self, knowledge_base: KnowledgeBase, config_overrides: dict | None = None):
        if not isinstance(knowledge_base, KnowledgeBase) or not knowledge_base.retriever:
            raise ValueError("An initialized KnowledgeBase with a built retriever is required.")
        self.kb = knowledge_base
        self.config = self._get_default_config()
        if config_overrides:
            self.config.update(config_overrides)

    def _get_default_config(self):
        return {
            "FINAL_CONTEXT_TOP_K": 5,
            "CONTEXT_SELECTION_STRATEGY": "chapter_aware_window_expansion",
            "CONTEXT_WINDOW_SIZE": 0,
            "ADD_MAPPED_FIGURES_TO_PROMPT": False,
        }

    def get_context_messages(self, query_text: str) -> list[dict] | None:
        """Public API to get final, formatted context messages for a long query."""
        final_context_docs = self.retrieve_context_docs(query_text)
        if not final_context_docs:
            logger.warning(f"No relevant context found for query: {query_text}")
            return None
        context_messages, _ = self.build_context_messages(final_context_docs)
        return context_messages

    def retrieve_context_docs(self, query_text: str) -> list:
        """Handles both short and long queries to retrieve context documents."""
        logger.info(f"Retrieving context documents with query: {query_text}")
        if len(query_text.split()) > 5:
            logger.info("Long query detected. Decomposing into sub-queries...")
            temp_doc = LangchainDocument(page_content=query_text)
            enriched_temp_docs = self.kb.document_enricher([temp_doc], summarize=False)
            query_chunks_as_docs = self.kb.chunker(enriched_docs=enriched_temp_docs, display_results=False)
            sub_queries = list(set([doc.page_content for doc in query_chunks_as_docs]))
        else:
            logger.info("Short query detected. Using direct retrieval.")
            sub_queries = [query_text]
        return self.retrieve_context_docs_for_simple_queries(sub_queries)

    def get_context_messages_for_simple_queries(self, queries: list[str]) -> list:
        """Retrieves context docs and builds them into formatted messages."""
        final_context_docs = self.retrieve_context_docs_for_simple_queries(queries)
        if not final_context_docs:
            logger.warning(f"No relevant context found for queries: {queries}")
            return []
        context_messages, _ = self.build_context_messages(final_context_docs)
        return context_messages

    def retrieve_context_docs_for_simple_queries(self, queries: list[str]) -> list:
        """Invokes the retriever for a list of simple queries and selects the final documents."""
        logger.info(f"Retrieving context documents with simple queries: {queries}")
        retrieved_docs = []
        for query in queries:
            docs = self.kb.retriever.invoke(query)
            retrieved_docs.extend(docs)

        return RAGContextEngine.select_final_context(
            retrieved_docs=retrieved_docs,
            config=self.config,
            page_map=self.kb.page_map,
        )

    def build_context_messages(
            self, docs: List[LangchainDocument]
    ) -> tuple[list[dict], list[Image.Image]]:
        """Builds a structured list of messages by grouping consecutive text blocks."""
        if not docs:
            return [], []

        context_messages = []
        images_found = []
        prose_buffer = []

        def flush_prose_buffer():
            if prose_buffer:
                full_prose = "\n\n".join(prose_buffer)
                context_messages.append({"type": "text", "text": full_prose})
                prose_buffer.clear()

        add_images = self.config.get("ADD_MAPPED_FIGURES_TO_PROMPT", False)
        for i, doc in enumerate(docs):
            current_page = doc.metadata.get("page_number")
            is_new_page = (i > 0) and (current_page != docs[i - 1].metadata.get("page_number"))
            is_caption = doc.metadata.get("chunk_type") == "figure-caption"

            if is_new_page or (add_images and is_caption):
                flush_prose_buffer()

            if add_images and is_caption:
                source_info = f"--- Source: Page {current_page} ---"
                caption_text = f"{source_info}\n{doc.page_content}"
                context_messages.append({"type": "text", "text": caption_text})
                image_path = doc.metadata.get("linked_figure_path")
                if image_path and os.path.exists(image_path):
                    try:
                        image = Image.open(image_path).convert("RGB")
                        context_messages.append({"type": "image", "image": image})
                        images_found.append(image)
                    except Exception as e:
                        logger.warning(f"Could not load image {image_path}: {e}")
            else:
                if not prose_buffer:
                    source_info = f"--- Source: Page {current_page} ---"
                    prose_buffer.append(f"\n{source_info}\n")
                prose_buffer.append(doc.page_content)

        flush_prose_buffer()
        return context_messages, images_found

    @staticmethod
    def select_final_context(retrieved_docs: list, config: dict, page_map: dict) -> list:
        """Selects final context from retrieved documents using the specified strategy."""
        strategy = config.get("CONTEXT_SELECTION_STRATEGY")
        top_k = config.get("FINAL_CONTEXT_TOP_K", 5)

        def _calculate_block_frequencies(docs_list: list) -> list:
            blocks = {}
            for doc in docs_list:
                if block_id := doc.metadata.get("block_id"):
                    if block_id not in blocks:
                        blocks[block_id] = []
                    blocks[block_id].append(doc)
            return sorted(blocks.items(), key=lambda item: len(item[1]), reverse=True)

        def _expand_chunks_to_blocks(chunks: list) -> list:
            return [
                LangchainDocument(
                    page_content=c.metadata.get("original_block_text", c.page_content),
                    metadata=c.metadata,
                )
                for c in chunks
            ]

        final_context = []
        if strategy == "chapter_aware_window_expansion":
            if not retrieved_docs or not page_map:
                return []

            scored_blocks = _calculate_block_frequencies(retrieved_docs)
            if not scored_blocks:
                return _expand_chunks_to_blocks(retrieved_docs[:top_k])

            primary_hit_page = scored_blocks[0][1][0].metadata.get("page_number")
            important_pages = {
                c[0].metadata.get("page_number")
                for _, c in scored_blocks[:top_k]
                if c and c[0].metadata.get("page_number")
            }

            window_size = config.get("CONTEXT_WINDOW_SIZE", 0)
            pages_to_extract = set()
            for page_num in important_pages:
                current_chapter_info = page_map.get(page_num)
                if not current_chapter_info:
                    continue
                current_chapter_id = current_chapter_info["chapter_id"]
                pages_to_extract.add(page_num)
                for i in range(1, window_size + 1):
                    if (prev_info := page_map.get(page_num - i)) and prev_info["chapter_id"] == current_chapter_id:
                        pages_to_extract.add(page_num - i)
                    if (next_info := page_map.get(page_num + i)) and next_info["chapter_id"] == current_chapter_id:
                        pages_to_extract.add(page_num + i)

            sorted_pages = sorted(list(pages_to_extract))
            if primary_hit_page and primary_hit_page in page_map:
                final_context.extend(page_map[primary_hit_page]["blocks"])
            for page_num in sorted_pages:
                if page_num != primary_hit_page and page_num in page_map:
                    final_context.extend(page_map[page_num]["blocks"])

        elif strategy == "rerank_by_frequency":
            scored_blocks = _calculate_block_frequencies(retrieved_docs)
            representative_chunks = [chunks[0] for _, chunks in scored_blocks[:top_k]]
            final_context = _expand_chunks_to_blocks(representative_chunks)

        elif strategy == "select_by_rank":
            unique_docs_map = {f"{doc.metadata.get('block_id', '')}_{doc.page_content}": doc for doc in retrieved_docs}
            representative_chunks = list(unique_docs_map.values())[:top_k]
            final_context = _expand_chunks_to_blocks(representative_chunks)

        else:
            logger.warning(f"Unknown strategy '{strategy}'. Defaulting to top-k raw chunks.")
            final_context = retrieved_docs[:top_k]

        logger.info(f"Selected {len(final_context)} final context blocks using '{strategy}' strategy.")
        return final_context

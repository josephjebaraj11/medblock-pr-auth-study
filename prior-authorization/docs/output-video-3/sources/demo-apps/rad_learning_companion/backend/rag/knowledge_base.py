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

import concurrent.futures
import logging
import os
import re
from pathlib import Path
from typing import Dict, List

import fitz  # PyMuPDF
from PIL import Image
from langchain_core.documents import Document as LangchainDocument
from langchain_classic.retrievers import BM25Retriever, EnsembleRetriever
from langchain_text_splitters import NLTKTextSplitter
from langchain_community.vectorstores import Chroma
from tqdm import tqdm

logger = logging.getLogger(__name__)

IMAGE_SUMMARY_PROMPT = """Summarize key findings in this image."""


class KnowledgeBase:
    """Processes a source PDF and builds a self-contained, searchable RAG knowledge base."""

    def __init__(self, models: dict, config_overrides: dict | None = None):
        """Initializes the builder with necessary models and configuration."""
        self.embedder = models.get("embedder")
        self.ner_pipeline = models.get("ner_pipeline")

        # Set default config and apply any overrides
        self.config = self._get_default_config()
        if config_overrides:
            self.config.update(config_overrides)

        # For consistent chunking, the RAG query uses the same enriching and chunking logic as the knowledge base.
        self.document_enricher = self._enrich_documents
        self.chunker = self._create_chunks_from_documents
        self.retriever: EnsembleRetriever | None = None
        self.page_map: Dict[int, Dict] = {}
        self.source_filepath = ""

        # Create necessary directories from config
        Path(self.config["IMAGE_DIR"]).mkdir(parents=True, exist_ok=True)
        Path(self.config["CHROMA_PERSIST_DIR"]).mkdir(parents=True, exist_ok=True)

    def _get_default_config(self):
        """Returns the default configuration for the KnowledgeBase."""
        return {
            "IMAGE_DIR": Path("processed_figures_kb/"),
            "CHROMA_PERSIST_DIR": Path("chroma_db_store/"),
            "MEDICAL_ENTITY_TYPES_TO_EXTRACT": ["PROBLEM"],
            "EXTRACT_IMAGE_SUMMARIES": False,  # Disabled as we don't load the LLM here
            "FILTER_FIRST_PAGES": 6,
            "FIGURE_MIN_WIDTH": 30,
            "FIGURE_MIN_HEIGHT": 30,
            "SENTENCE_CHUNK_SIZE": 250,
            "CHUNK_FILTER_SIZE": 20,
            "RETRIEVER_TOP_K": 20,
            "ENSEMBLE_WEIGHTS_BM25,SENTENCE,NER": [0.2, 0.3, 0.5],
            "SENTENCE_SCORE_THRESHOLD": 0.6,
            "NER_SCORE_THRESHOLD": 0.5,
            "MAX_PARALLEL_WORKERS": 16,
        }

    def build(self, pdf_filepath: str):
        """The main public method to build the knowledge base from a PDF."""
        logger.info(f"--------- Building Knowledge Base from '{pdf_filepath}' ---------")
        pdf_path = Path(pdf_filepath)
        if not pdf_path.exists():
            logger.error(f"ERROR: PDF file not found at {pdf_filepath}")
            return None

        self.source_filepath = pdf_path

        # Step 1: Process the PDF and build the structured page_map.
        self.page_map = self._process_and_structure_pdf(pdf_path)
        all_docs = [
            doc for page_data in self.page_map.values() for doc in page_data["blocks"]
        ]

        # Step 2: Enrich documents with NER metadata.
        enriched_docs = self._enrich_documents(all_docs, self.config.get("EXTRACT_IMAGE_SUMMARIES", False))

        # Step 3: Chunk the enriched documents into final searchable units.
        final_chunks = self._create_chunks_from_documents(enriched_docs)

        # Step 4: Build the final ensemble retriever.
        self.retriever = self._build_ensemble_retriever(final_chunks)

        if self.retriever:
            logger.info(f"--------- Knowledge Base Built Successfully ---------")
        else:
            logger.error(f"--------- Knowledge Base Building Failed ---------")

        return self

    # --- Step 1: PDF Content Extraction ---
    def _process_and_structure_pdf(self, pdf_path: Path) -> dict:
        """Processes a PDF in parallel and directly builds the final page_map.

        This version is more efficient by opening the PDF only once.
        """
        logger.info("Step 1: Processing PDF and building structured page map...")
        page_map = {}

        try:
            # Improvement: Open the PDF ONCE to get all preliminary info
            with fitz.open(pdf_path) as doc:
                pdf_bytes_buffer = doc.write()
                page_count = len(doc)
                toc = doc.get_toc()

                # Improvement: Create a more robust chapter lookup map
                page_to_chapter_id = {}
                if toc:
                    chapters = [item for item in toc if item[0] == 1]
                    for i, (lvl, title, start_page) in enumerate(chapters):
                        end_page = (
                            chapters[i + 1][2] - 1 if i + 1 < len(chapters) else page_count
                        )
                        for page_num in range(start_page, end_page + 1):
                            page_to_chapter_id[page_num] = i

                # Create tasks for the thread pool (using a tuple as requested)
                tasks = [
                    (
                        pdf_bytes_buffer,
                        i,
                        self.config,
                        pdf_path.name,
                        page_to_chapter_id,
                    )
                    for i in range(self.config["FILTER_FIRST_PAGES"], page_count)
                ]

            # Parallel Processing
            num_workers = min(
                self.config["MAX_PARALLEL_WORKERS"], os.cpu_count() or 1
            )
            with concurrent.futures.ThreadPoolExecutor(
                    max_workers=num_workers
            ) as executor:
                futures = [
                    executor.submit(self.process_single_page, task) for task in tasks
                ]
                progress_bar = tqdm(
                    concurrent.futures.as_completed(futures),
                    total=len(tasks),
                    desc="Processing & Structuring Pages",
                )
                for future in progress_bar:
                    result = future.result()
                    if result:
                        # The worker now returns a fully formed dictionary for the page_map
                        page_map[result["page_num"]] = result["content"]

        except Exception as e:
            logger.error(f"❌ Failed to process PDF {pdf_path.name}: {e}")
            return {}

        logger.info(f"✅ PDF processed. Created a map of {len(page_map)} pages.")
        return dict(sorted(page_map.items()))

    # --- Step 2: Document Enrichment ---
    def _enrich_documents(
            self, docs: List[LangchainDocument], summarize: bool = False
    ) -> List[LangchainDocument]:
        """Enriches a list of documents with NER metadata and image summaries."""
        logger.info("\nStep 2: Enriching documents...")
        # NER Enrichment
        if self.ner_pipeline:
            logger.info("Adding NER metadata...")
            for doc in tqdm(docs, desc="Enriching with NER"):
                # 1. Skip documents that have no actual text content
                if not doc.page_content or not doc.page_content.strip():
                    continue

                try:
                    # 2. Process ONLY the text of the current document
                    processed_doc = self.ner_pipeline(doc.page_content)

                    # 3. Extract entities from the result. This result now
                    #    unambiguously belongs to the current 'doc'.
                    entities = [
                        ent.text
                        for ent in processed_doc.ents
                        if ent.type in self.config["MEDICAL_ENTITY_TYPES_TO_EXTRACT"]
                    ]

                    # 4. Assign the correctly mapped entities to the document's metadata
                    if entities:
                        # Using set() handles duplicates before sorting and joining
                        unique_entities = sorted(list(set(entities)))
                        doc.metadata["block_ner_entities"] = ", ".join(unique_entities)

                except Exception as e:
                    # Add error handling for robustness in case a single block fails
                    logger.warning(
                        f"\nWarning: Could not process NER for a block on page {doc.metadata.get('page_number', 'N/A')}: {e}")

        # Image Summary Enrichment
        if summarize:
            logger.info("Generating image summaries...")
            docs_with_figures = [
                doc for doc in docs if "linked_figure_path" in doc.metadata
            ]
            for doc in tqdm(docs_with_figures, desc="Summarizing Images"):
                try:
                    img = Image.open(doc.metadata["linked_figure_path"]).convert("RGB")
                    summary = self._summarize_image(img)
                    if summary:
                        doc.metadata["image_summary"] = summary
                except Exception as e:
                    logger.warning(
                        "Warning: Could not summarize image"
                        f" {doc.metadata.get('linked_figure_path', '')}: {e}"
                    )
        return docs

    def _summarize_image(self, pil_image: Image.Image) -> str:
        """Helper method to call the LLM for image summarization."""
        if not self.llm_pipeline:
            return ""
        messages = [{
            "role": "user",
            "content": [
                {"type": "text", "text": IMAGE_SUMMARY_PROMPT},
                {"type": "image", "image": pil_image},
            ],
        }]
        try:
            output = self.llm_pipeline(text=messages, max_new_tokens=150)
            return output[0]["generated_text"][-1]["content"].strip()
        except Exception:
            return ""

    # --- Step 3: Document Chunking ---
    def _create_chunks_from_documents(
            self, enriched_docs: List[LangchainDocument], display_results: bool = True
    ) -> List[LangchainDocument]:
        """Takes enriched documents and creates the final list of chunks for indexing.

        This method now has a single responsibility: chunking.
        """
        if display_results:
            logger.info("\nStep 3: Creating final chunks...")

        # Sentence Splitting
        if display_results:
            logger.info("Applying NLTK Sentence Splitting...")
        splitter = NLTKTextSplitter(chunk_size=self.config["SENTENCE_CHUNK_SIZE"])
        sentence_chunks = splitter.split_documents(enriched_docs)
        if display_results:
            logger.info(f"Generated {len(sentence_chunks)} sentence-level chunks.")

        # NER Entity Chunking (based on previously enriched metadata)
        if display_results:
            logger.info("Creating NER Entity Chunks...")
        ner_entity_chunks = [
            LangchainDocument(
                page_content=entity,
                metadata={**doc.metadata, "chunk_type": "ner_entity_standalone"},
            )
            for doc in enriched_docs
            if (entities_str := doc.metadata.get("block_ner_entities"))
            for entity in entities_str.split(", ")
            if entity
        ]
        if display_results:
            logger.info(f"Added {len(ner_entity_chunks)} NER entity chunks.")

        all_chunks = sentence_chunks + ner_entity_chunks
        return [chunk for chunk in all_chunks if chunk.page_content]

    # --- Step 4: Retriever Building ---
    def _build_ensemble_retriever(
            self, chunks: List[LangchainDocument]
    ) -> EnsembleRetriever | None:
        """Builds the final ensemble retriever from the chunks.

        This method was already well-focused.
        """
        if not chunks:
            logger.error("No chunks to build retriever from.")
            return None
        logger.info("\nStep 4: Building specialized retrievers...")
        sentence_chunks = [
            doc
            for doc in chunks
            if doc.metadata.get("chunk_type") != "ner_entity_standalone"
        ]
        ner_chunks = [
            doc
            for doc in chunks
            if doc.metadata.get("chunk_type") == "ner_entity_standalone"
        ]
        retrievers, weights = [], []

        if sentence_chunks:
            bm25_retriever = BM25Retriever.from_documents(sentence_chunks)
            bm25_retriever.k = self.config["RETRIEVER_TOP_K"]
            retrievers.append(bm25_retriever)
            weights.append(self.config["ENSEMBLE_WEIGHTS_BM25,SENTENCE,NER"][0])
            sentence_vs = Chroma.from_documents(
                documents=sentence_chunks,
                embedding=self.embedder,
                persist_directory=str(
                    self.config["CHROMA_PERSIST_DIR"] / "sentences"
                ),
            )
            vector_retriever = sentence_vs.as_retriever(
                search_type="similarity_score_threshold",
                search_kwargs={
                    "k": self.config["RETRIEVER_TOP_K"],
                    "score_threshold": self.config["SENTENCE_SCORE_THRESHOLD"],
                },
            )
            retrievers.append(vector_retriever)
            weights.append(self.config["ENSEMBLE_WEIGHTS_BM25,SENTENCE,NER"][1])

        if ner_chunks:
            ner_vs = Chroma.from_documents(
                documents=ner_chunks,
                embedding=self.embedder,
                persist_directory=str(self.config["CHROMA_PERSIST_DIR"] / "entities"),
            )
            ner_retriever = ner_vs.as_retriever(
                search_type="similarity_score_threshold",
                search_kwargs={
                    "k": self.config["RETRIEVER_TOP_K"],
                    "score_threshold": self.config["NER_SCORE_THRESHOLD"],
                },
            )
            retrievers.append(ner_retriever)
            weights.append(self.config["ENSEMBLE_WEIGHTS_BM25,SENTENCE,NER"][2])

        if not retrievers:
            logger.error("⚠️ Could not create any retrievers.")
            return None
        logger.info(f"Creating final ensemble with weights: {weights}")
        return EnsembleRetriever(retrievers=retrievers, weights=weights)

    @staticmethod
    def process_single_page(args_tuple: tuple) -> dict | None:
        """Worker function for parallel PDF processing.

        Processes one page and returns a structured dictionary for that page.
        """
        # Unpack arguments (still using a tuple as requested)
        pdf_bytes_buffer, page_num_idx, config, pdf_filename, page_to_chapter_id = (
            args_tuple
        )

        lc_documents = []
        page_num = page_num_idx + 1

        try:
            # Improvement: Use a 'with' statement for resource management
            with fitz.open(stream=pdf_bytes_buffer, filetype="pdf") as doc:
                page = doc[page_num_idx]
                # 1. Extract raw, potentially fragmented text blocks
                raw_text_blocks = page.get_text("blocks", sort=True)

                # 2. Immediately merge blocks into paragraphs >>>
                paragraph_blocks = KnowledgeBase._merge_text_blocks(raw_text_blocks)

                # 3. Process figures (no change)
                page_figures = []
                for fig_j, path_dict in enumerate(page.get_drawings()):
                    bbox = path_dict["rect"]
                    if (
                            bbox.is_empty
                            or bbox.width < config["FIGURE_MIN_WIDTH"]
                            or bbox.height < config["FIGURE_MIN_HEIGHT"]
                    ):
                        continue

                    # Improvement: More concise bounding box padding
                    padded_bbox = bbox + (-2, -2, 2, 2)
                    padded_bbox.intersect(page.rect)
                    if padded_bbox.is_empty:
                        continue

                    pix = page.get_pixmap(clip=padded_bbox, dpi=150)
                    if pix.width > 0 and pix.height > 0:
                        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                        img_path = (
                                config["IMAGE_DIR"]
                                / f"{Path(pdf_filename).stem}_p{page_num}_fig{fig_j + 1}.png"
                        )
                        img.save(img_path)
                        page_figures.append({
                            "bbox": bbox,
                            "path": str(img_path),
                            "id": f"Figure {fig_j + 1} on {pdf_filename}, page {page_num}",
                        })

                # 4. Process the clean PARAGRAPH blocks
                text_blocks_on_page = [
                    {
                        "bbox": fitz.Rect(x0, y0, x1, y1),
                        "text": text.strip(),
                        "original_idx": b_idx,
                    }
                    for b_idx, (x0, y0, x1, y1, text, _, _) in enumerate(
                        paragraph_blocks
                    )
                    if text.strip()
                ]

                # 5. Link captions and create documents
                potential_captions = [
                    b
                    for b in text_blocks_on_page
                    if re.match(r"^\s*Figure\s*\d+", b["text"], re.I)
                ]
                mapped_caption_indices = set()
                for fig_data in page_figures:
                    cap_text, cap_idx = KnowledgeBase.find_best_caption_for_figure(
                        fig_data["bbox"], potential_captions
                    )
                    if cap_text and cap_idx not in mapped_caption_indices:
                        mapped_caption_indices.add(cap_idx)
                        metadata = {
                            "source_pdf": pdf_filename,
                            "page_number": page_num,
                            "chunk_type": "figure-caption",
                            "linked_figure_path": fig_data["path"],
                            "linked_figure_id": fig_data["id"],
                            "block_id": f"{page_num}_{cap_idx}",
                            "original_block_text": cap_text,
                        }
                        lc_documents.append(
                            LangchainDocument(page_content=cap_text, metadata=metadata)
                        )

                for block_data in text_blocks_on_page:
                    if block_data["original_idx"] in mapped_caption_indices:
                        continue
                    if KnowledgeBase.should_filter_text_block(
                            block_data["text"],
                            block_data["bbox"],
                            page.rect.height,
                            config["CHUNK_FILTER_SIZE"],
                    ):
                        continue
                    metadata = {
                        "source_pdf": pdf_filename,
                        "page_number": page_num,
                        "chunk_type": "text_block",
                        "block_id": f"{page_num}_{block_data['original_idx']}",
                        "original_block_text": block_data["text"],
                    }
                    lc_documents.append(
                        LangchainDocument(
                            page_content=block_data["text"], metadata=metadata
                        )
                    )

        except Exception as e:
            logger.error(f"Error processing {pdf_filename} page {page_num}: {e}")
            return None

        if not lc_documents:
            return None

        # Structure the final output
        lc_documents.sort(
            key=lambda d: int(d.metadata.get("block_id", "0_0").split("_")[-1])
        )

        return {
            "page_num": page_num,
            "content": {
                "chapter_id": page_to_chapter_id.get(page_num, -1),
                "blocks": lc_documents,
            },
        }

    @staticmethod
    def _merge_text_blocks(blocks: list) -> list:
        """Intelligently merges fragmented text blocks into coherent paragraphs."""
        if not blocks:
            return []
        merged_blocks = []
        current_text = ""
        current_bbox = fitz.Rect()
        sentence_enders = {".", "?", "!", "•"}

        for i, block in enumerate(blocks):
            block_text = block[4].strip()
            if not current_text:  # Starting a new paragraph
                current_bbox = fitz.Rect(block[:4])
                current_text = block_text
            else:  # Continue existing paragraph
                current_bbox.include_rect(block[:4])
                current_text = f"{current_text} {block_text}"

            is_last_block = i == len(blocks) - 1
            ends_with_punctuation = block_text.endswith(tuple(sentence_enders))

            if ends_with_punctuation or is_last_block:
                merged_blocks.append((
                    current_bbox.x0,
                    current_bbox.y0,
                    current_bbox.x1,
                    current_bbox.y1,
                    current_text,
                    len(merged_blocks),
                    0,
                ))
                current_text = ""
        return merged_blocks

    @staticmethod
    def should_filter_text_block(
            block_text: str,
            block_bbox: fitz.Rect,
            page_height: float,
            filter_size: int,
    ) -> bool:
        """Determines if a text block from a header/footer should be filtered out."""
        is_in_header_area = block_bbox.y0 < (page_height * 0.10)
        is_in_footer_area = block_bbox.y1 > (page_height * 0.80)
        is_short_text = len(block_text) < filter_size
        return (is_in_header_area or is_in_footer_area) and is_short_text

    @staticmethod
    def find_best_caption_for_figure(
            figure_bbox: fitz.Rect, potential_captions_on_page: list
    ) -> tuple:
        """Finds the best caption for a given figure based on proximity and alignment."""
        best_caption_info = (None, -1)
        min_score = float("inf")

        for cap_info in potential_captions_on_page:
            cap_bbox = cap_info["bbox"]
            # Heuristic: Score captions directly below the figure
            if cap_bbox.y0 >= figure_bbox.y1 - 10:  # Caption starts below the figure
                vertical_dist = cap_bbox.y0 - figure_bbox.y1
                # Calculate horizontal overlap
                overlap_x_start = max(figure_bbox.x0, cap_bbox.x0)
                overlap_x_end = min(figure_bbox.x1, cap_bbox.x1)
                if (
                        overlap_x_end - overlap_x_start
                ) > 0:  # If they overlap horizontally
                    fig_center_x = (figure_bbox.x0 + figure_bbox.x1) / 2
                    cap_center_x = (cap_bbox.x0 + cap_bbox.x1) / 2
                    horizontal_center_dist = abs(fig_center_x - cap_center_x)
                    # Score is a combination of vertical and horizontal distance
                    score = vertical_dist + (horizontal_center_dist * 0.5)
                    if score < min_score:
                        min_score = score
                        best_caption_info = (cap_info["text"], cap_info["original_idx"])
        return best_caption_info
